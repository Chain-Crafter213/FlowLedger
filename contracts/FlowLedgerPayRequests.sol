// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FlowLedgerPayRequests
 * @notice Payment request system for workers to request payments from employers
 * @dev Supports approval workflow with optional escrow
 */
contract FlowLedgerPayRequests is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    uint256 public requestCount;

    enum RequestStatus {
        Pending,
        Approved,
        Rejected,
        Paid,
        Cancelled
    }

    struct PayRequest {
        uint256 id;
        address worker;
        address employer;
        uint256 amount;
        string description;
        uint256 createdAt;
        uint256 dueDate;
        RequestStatus status;
        string rejectionReason;
    }

    // Request ID => PayRequest
    mapping(uint256 => PayRequest) public requests;
    
    // Worker => Request IDs
    mapping(address => uint256[]) public requestsByWorker;
    
    // Employer => Request IDs
    mapping(address => uint256[]) public requestsByEmployer;

    event RequestCreated(
        uint256 indexed requestId,
        address indexed worker,
        address indexed employer,
        uint256 amount,
        string description
    );

    event RequestApproved(
        uint256 indexed requestId,
        address indexed employer
    );

    event RequestRejected(
        uint256 indexed requestId,
        address indexed employer,
        string reason
    );

    event RequestPaid(
        uint256 indexed requestId,
        address indexed employer,
        address indexed worker,
        uint256 amount
    );

    event RequestCancelled(
        uint256 indexed requestId,
        address indexed worker
    );

    constructor(address _usdc, address _owner) Ownable(_owner) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Create a payment request
     * @param employer Address of the employer
     * @param amount Requested amount in USDC
     * @param description Description of the work/service
     * @param dueDate Optional due date (0 = none)
     */
    function createRequest(
        address employer,
        uint256 amount,
        string calldata description,
        uint256 dueDate
    ) external returns (uint256 requestId) {
        require(employer != address(0), "Invalid employer");
        require(amount > 0, "Invalid amount");
        require(employer != msg.sender, "Cannot request from self");

        requestId = ++requestCount;

        requests[requestId] = PayRequest({
            id: requestId,
            worker: msg.sender,
            employer: employer,
            amount: amount,
            description: description,
            createdAt: block.timestamp,
            dueDate: dueDate,
            status: RequestStatus.Pending,
            rejectionReason: ""
        });

        requestsByWorker[msg.sender].push(requestId);
        requestsByEmployer[employer].push(requestId);

        emit RequestCreated(requestId, msg.sender, employer, amount, description);
    }

    /**
     * @notice Approve a payment request
     * @param requestId ID of the request
     */
    function approveRequest(uint256 requestId) external {
        PayRequest storage request = requests[requestId];
        
        require(request.employer == msg.sender, "Not employer");
        require(request.status == RequestStatus.Pending, "Invalid status");

        request.status = RequestStatus.Approved;

        emit RequestApproved(requestId, msg.sender);
    }

    /**
     * @notice Reject a payment request
     * @param requestId ID of the request
     * @param reason Reason for rejection
     */
    function rejectRequest(uint256 requestId, string calldata reason) external {
        PayRequest storage request = requests[requestId];
        
        require(request.employer == msg.sender, "Not employer");
        require(request.status == RequestStatus.Pending, "Invalid status");

        request.status = RequestStatus.Rejected;
        request.rejectionReason = reason;

        emit RequestRejected(requestId, msg.sender, reason);
    }

    /**
     * @notice Pay an approved request
     * @param requestId ID of the request
     */
    function payRequest(uint256 requestId) external nonReentrant {
        PayRequest storage request = requests[requestId];
        
        require(request.employer == msg.sender, "Not employer");
        require(
            request.status == RequestStatus.Approved || 
            request.status == RequestStatus.Pending,
            "Invalid status"
        );

        request.status = RequestStatus.Paid;

        usdc.safeTransferFrom(msg.sender, request.worker, request.amount);

        emit RequestPaid(requestId, msg.sender, request.worker, request.amount);
    }

    /**
     * @notice Cancel a pending request
     * @param requestId ID of the request
     */
    function cancelRequest(uint256 requestId) external {
        PayRequest storage request = requests[requestId];
        
        require(request.worker == msg.sender, "Not worker");
        require(request.status == RequestStatus.Pending, "Invalid status");

        request.status = RequestStatus.Cancelled;

        emit RequestCancelled(requestId, msg.sender);
    }

    /**
     * @notice Get requests by worker
     * @param worker Worker address
     */
    function getRequestsByWorker(address worker) external view returns (uint256[] memory) {
        return requestsByWorker[worker];
    }

    /**
     * @notice Get requests by employer
     * @param employer Employer address
     */
    function getRequestsByEmployer(address employer) external view returns (uint256[] memory) {
        return requestsByEmployer[employer];
    }

    /**
     * @notice Get request details
     * @param requestId ID of the request
     */
    function getRequest(uint256 requestId) external view returns (PayRequest memory) {
        return requests[requestId];
    }
}
