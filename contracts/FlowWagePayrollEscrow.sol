// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FlowWagePayrollEscrow
 * @notice Escrow contract for batch payroll payments with USDC
 * @dev Supports bulk deposits, individual claims, and employer revocations
 */
contract FlowWagePayrollEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // State
    IERC20 public immutable usdc;
    address public feeManager;
    uint256 public payrollCount;

    struct PayrollRun {
        uint256 id;
        address employer;
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 createdAt;
        uint256 expiresAt;
        bool revoked;
        string memo;
    }

    struct Payment {
        uint256 payrollId;
        address worker;
        uint256 amount;
        bool claimed;
        bool disputed;
        uint256 claimedAt;
    }

    // Payroll ID => PayrollRun
    mapping(uint256 => PayrollRun) public payrollRuns;
    
    // Payroll ID => Worker => Payment
    mapping(uint256 => mapping(address => Payment)) public payments;
    
    // Payroll ID => Worker addresses
    mapping(uint256 => address[]) public payrollWorkers;

    // Events
    event PayrollCreated(
        uint256 indexed payrollId,
        address indexed employer,
        uint256 totalAmount,
        uint256 workerCount,
        string memo
    );
    
    event PaymentClaimed(
        uint256 indexed payrollId,
        address indexed worker,
        uint256 amount
    );
    
    event PaymentDisputed(
        uint256 indexed payrollId,
        address indexed worker,
        string reason
    );
    
    event PayrollRevoked(
        uint256 indexed payrollId,
        address indexed employer,
        uint256 refundedAmount
    );

    constructor(address _usdc, address _owner) Ownable(_owner) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Set the fee manager contract
     * @param _feeManager Address of the fee manager
     */
    function setFeeManager(address _feeManager) external onlyOwner {
        feeManager = _feeManager;
    }

    /**
     * @notice Create a new payroll run with bulk payments
     * @param workers Array of worker addresses
     * @param amounts Array of payment amounts (in USDC base units)
     * @param memo Description of the payroll run
     * @param expiresIn Seconds until the payroll expires (0 = never)
     */
    function createPayroll(
        address[] calldata workers,
        uint256[] calldata amounts,
        string calldata memo,
        uint256 expiresIn
    ) external nonReentrant returns (uint256 payrollId) {
        require(workers.length > 0, "No workers");
        require(workers.length == amounts.length, "Length mismatch");
        require(workers.length <= 100, "Too many workers");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(workers[i] != address(0), "Invalid worker");
            require(amounts[i] > 0, "Invalid amount");
            totalAmount += amounts[i];
        }

        // Transfer USDC from employer to escrow
        usdc.safeTransferFrom(msg.sender, address(this), totalAmount);

        // Create payroll run
        payrollId = ++payrollCount;
        payrollRuns[payrollId] = PayrollRun({
            id: payrollId,
            employer: msg.sender,
            totalAmount: totalAmount,
            claimedAmount: 0,
            createdAt: block.timestamp,
            expiresAt: expiresIn > 0 ? block.timestamp + expiresIn : 0,
            revoked: false,
            memo: memo
        });

        // Create individual payments
        for (uint256 i = 0; i < workers.length; i++) {
            payments[payrollId][workers[i]] = Payment({
                payrollId: payrollId,
                worker: workers[i],
                amount: amounts[i],
                claimed: false,
                disputed: false,
                claimedAt: 0
            });
            payrollWorkers[payrollId].push(workers[i]);
        }

        emit PayrollCreated(payrollId, msg.sender, totalAmount, workers.length, memo);
    }

    /**
     * @notice Claim a payment from a payroll run
     * @param payrollId ID of the payroll run
     */
    function claimPayment(uint256 payrollId) external nonReentrant {
        PayrollRun storage run = payrollRuns[payrollId];
        Payment storage payment = payments[payrollId][msg.sender];

        require(run.id > 0, "Payroll not found");
        require(!run.revoked, "Payroll revoked");
        require(run.expiresAt == 0 || block.timestamp <= run.expiresAt, "Payroll expired");
        require(payment.amount > 0, "Not a recipient");
        require(!payment.claimed, "Already claimed");
        require(!payment.disputed, "Payment disputed");

        payment.claimed = true;
        payment.claimedAt = block.timestamp;
        run.claimedAmount += payment.amount;

        usdc.safeTransfer(msg.sender, payment.amount);

        emit PaymentClaimed(payrollId, msg.sender, payment.amount);
    }

    /**
     * @notice Dispute a payment
     * @param payrollId ID of the payroll run
     * @param reason Reason for dispute
     */
    function disputePayment(uint256 payrollId, string calldata reason) external {
        Payment storage payment = payments[payrollId][msg.sender];
        
        require(payment.amount > 0, "Not a recipient");
        require(!payment.claimed, "Already claimed");
        require(!payment.disputed, "Already disputed");

        payment.disputed = true;

        emit PaymentDisputed(payrollId, msg.sender, reason);
    }

    /**
     * @notice Revoke a payroll and refund unclaimed amounts
     * @param payrollId ID of the payroll run
     */
    function revokePayroll(uint256 payrollId) external nonReentrant {
        PayrollRun storage run = payrollRuns[payrollId];
        
        require(run.employer == msg.sender, "Not employer");
        require(!run.revoked, "Already revoked");

        run.revoked = true;
        
        uint256 refundAmount = run.totalAmount - run.claimedAmount;
        if (refundAmount > 0) {
            usdc.safeTransfer(msg.sender, refundAmount);
        }

        emit PayrollRevoked(payrollId, msg.sender, refundAmount);
    }

    /**
     * @notice Get all workers in a payroll run
     * @param payrollId ID of the payroll run
     */
    function getPayrollWorkers(uint256 payrollId) external view returns (address[] memory) {
        return payrollWorkers[payrollId];
    }

    /**
     * @notice Get payment details for a worker
     * @param payrollId ID of the payroll run
     * @param worker Worker address
     */
    function getPayment(uint256 payrollId, address worker) external view returns (Payment memory) {
        return payments[payrollId][worker];
    }

    /**
     * @notice Check if a payment is claimable
     * @param payrollId ID of the payroll run
     * @param worker Worker address
     */
    function isClaimable(uint256 payrollId, address worker) external view returns (bool) {
        PayrollRun storage run = payrollRuns[payrollId];
        Payment storage payment = payments[payrollId][worker];

        if (run.id == 0) return false;
        if (run.revoked) return false;
        if (run.expiresAt > 0 && block.timestamp > run.expiresAt) return false;
        if (payment.amount == 0) return false;
        if (payment.claimed) return false;
        if (payment.disputed) return false;

        return true;
    }
}
