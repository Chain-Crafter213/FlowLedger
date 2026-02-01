// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FlowWageFeeManager
 * @notice Manages protocol fees for FlowLedger ecosystem
 * @dev Collects fees from escrow operations and distributes to treasury
 */
contract FlowWageFeeManager is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public treasury;
    
    // Fee in basis points (1% = 100, 0.5% = 50)
    uint256 public payrollFeeBps = 50; // 0.5% default
    uint256 public constant MAX_FEE_BPS = 500; // 5% max

    // Whitelisted addresses (no fee)
    mapping(address => bool) public feeExempt;

    event FeeCollected(
        address indexed from,
        uint256 amount,
        uint256 feeAmount
    );

    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event FeeExemptionUpdated(address indexed account, bool exempt);

    constructor(address _usdc, address _treasury, address _owner) Ownable(_owner) {
        require(_usdc != address(0), "Invalid USDC");
        require(_treasury != address(0), "Invalid treasury");
        usdc = IERC20(_usdc);
        treasury = _treasury;
    }

    /**
     * @notice Calculate fee for an amount
     * @param amount Principal amount
     * @param payer Address paying the fee
     */
    function calculateFee(uint256 amount, address payer) public view returns (uint256) {
        if (feeExempt[payer]) return 0;
        return (amount * payrollFeeBps) / 10000;
    }

    /**
     * @notice Collect fee from a transfer
     * @param from Address paying
     * @param amount Total amount being transferred
     */
    function collectFee(address from, uint256 amount) external returns (uint256 feeAmount) {
        feeAmount = calculateFee(amount, from);
        if (feeAmount > 0) {
            usdc.safeTransferFrom(from, treasury, feeAmount);
            emit FeeCollected(from, amount, feeAmount);
        }
    }

    /**
     * @notice Update the payroll fee
     * @param newFeeBps New fee in basis points
     */
    function setPayrollFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee too high");
        uint256 oldFee = payrollFeeBps;
        payrollFeeBps = newFeeBps;
        emit FeeUpdated(oldFee, newFeeBps);
    }

    /**
     * @notice Update the treasury address
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Set fee exemption for an address
     * @param account Address to update
     * @param exempt Whether the address is exempt
     */
    function setFeeExemption(address account, bool exempt) external onlyOwner {
        feeExempt[account] = exempt;
        emit FeeExemptionUpdated(account, exempt);
    }

    /**
     * @notice Withdraw any stuck tokens (emergency)
     * @param token Token address
     * @param to Recipient
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }
}
