// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FlowLedgerStreaming
 * @notice Linear USDC streaming for continuous payroll. Employer deposits, worker withdraws accrued amount over time.
 */
contract FlowLedgerStreaming is ReentrancyGuard {
    IERC20 public immutable usdc;

    struct Stream {
        address employer;
        address worker;
        uint256 totalAmount;
        uint256 startTime;
        uint256 endTime;
        uint256 withdrawn;
        uint8 status; // 0=active, 1=completed, 2=cancelled
    }

    mapping(bytes32 => Stream) public streams;
    mapping(address => bytes32[]) public employerStreams;
    mapping(address => bytes32[]) public workerStreams;
    uint256 private nonce;

    event StreamCreated(bytes32 indexed streamId, address indexed employer, address indexed worker, uint256 totalAmount, uint256 startTime, uint256 endTime, uint256 timestamp);
    event StreamWithdrawn(bytes32 indexed streamId, address indexed worker, uint256 amount, uint256 timestamp);
    event StreamCancelled(bytes32 indexed streamId, address indexed employer, uint256 refunded, uint256 workerPaid, uint256 timestamp);

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function createStream(
        address worker,
        uint256 totalAmount,
        uint256 startTime,
        uint256 endTime
    ) external nonReentrant returns (bytes32 streamId) {
        require(worker != address(0), "Invalid worker");
        require(totalAmount > 0, "Amount must be > 0");
        require(endTime > startTime, "End must be after start");
        require(startTime >= block.timestamp - 60, "Start must be now or future");

        streamId = keccak256(abi.encodePacked(msg.sender, worker, totalAmount, block.timestamp, nonce++));

        streams[streamId] = Stream({
            employer: msg.sender,
            worker: worker,
            totalAmount: totalAmount,
            startTime: startTime,
            endTime: endTime,
            withdrawn: 0,
            status: 0
        });

        employerStreams[msg.sender].push(streamId);
        workerStreams[worker].push(streamId);

        require(usdc.transferFrom(msg.sender, address(this), totalAmount), "USDC transfer failed");

        emit StreamCreated(streamId, msg.sender, worker, totalAmount, startTime, endTime, block.timestamp);
    }

    function getWithdrawable(bytes32 streamId) public view returns (uint256) {
        Stream storage s = streams[streamId];
        if (s.status != 0) return 0;
        if (block.timestamp <= s.startTime) return 0;

        uint256 elapsed = block.timestamp >= s.endTime ? s.endTime - s.startTime : block.timestamp - s.startTime;
        uint256 duration = s.endTime - s.startTime;
        uint256 accrued = (s.totalAmount * elapsed) / duration;
        return accrued - s.withdrawn;
    }

    function withdrawFromStream(bytes32 streamId) external nonReentrant {
        Stream storage s = streams[streamId];
        require(s.worker == msg.sender, "Not the worker");
        require(s.status == 0, "Stream not active");

        uint256 withdrawable = getWithdrawable(streamId);
        require(withdrawable > 0, "Nothing to withdraw");

        s.withdrawn += withdrawable;

        if (s.withdrawn >= s.totalAmount) {
            s.status = 1; // completed
        }

        require(usdc.transfer(msg.sender, withdrawable), "USDC transfer failed");

        emit StreamWithdrawn(streamId, msg.sender, withdrawable, block.timestamp);
    }

    function cancelStream(bytes32 streamId) external nonReentrant {
        Stream storage s = streams[streamId];
        require(s.employer == msg.sender, "Not the employer");
        require(s.status == 0, "Stream not active");

        uint256 workerOwed = getWithdrawable(streamId) + s.withdrawn;
        uint256 workerPay = workerOwed > s.withdrawn ? workerOwed - s.withdrawn : 0;
        uint256 refund = s.totalAmount - workerOwed;

        s.status = 2; // cancelled
        s.withdrawn = workerOwed;

        if (workerPay > 0) {
            require(usdc.transfer(s.worker, workerPay), "Worker pay failed");
        }
        if (refund > 0) {
            require(usdc.transfer(s.employer, refund), "Refund failed");
        }

        emit StreamCancelled(streamId, msg.sender, refund, workerPay, block.timestamp);
    }

    function getStream(bytes32 streamId) external view returns (
        address employer,
        address worker,
        uint256 totalAmount,
        uint256 startTime,
        uint256 endTime,
        uint256 withdrawn,
        uint8 status
    ) {
        Stream storage s = streams[streamId];
        return (s.employer, s.worker, s.totalAmount, s.startTime, s.endTime, s.withdrawn, s.status);
    }

    function getEmployerStreams(address employer) external view returns (bytes32[] memory) {
        return employerStreams[employer];
    }

    function getWorkerStreams(address worker) external view returns (bytes32[] memory) {
        return workerStreams[worker];
    }
}
