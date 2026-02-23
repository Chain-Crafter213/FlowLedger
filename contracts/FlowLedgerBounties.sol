// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FlowLedgerBounties
 * @notice On-chain bounty board. Employer deposits USDC, workers submit, employer approves to release.
 */
contract FlowLedgerBounties is ReentrancyGuard {
    IERC20 public immutable usdc;

    struct Bounty {
        address employer;
        uint256 amount;
        bytes32 descriptionHash;
        uint256 deadline;
        uint8 status; // 0=open, 1=approved, 2=cancelled
        address approvedSubmitter;
        uint256 createdAt;
    }

    struct Submission {
        bytes32 proofHash;
        uint256 submittedAt;
        uint8 status; // 0=pending, 1=approved, 2=rejected
    }

    mapping(bytes32 => Bounty) public bounties;
    mapping(bytes32 => mapping(address => Submission)) public submissions;
    mapping(bytes32 => address[]) public bountySubmitters;
    mapping(address => bytes32[]) public employerBounties;
    uint256 private nonce;

    event BountyCreated(bytes32 indexed bountyId, address indexed employer, uint256 amount, bytes32 descriptionHash, uint256 deadline, uint256 timestamp);
    event WorkSubmitted(bytes32 indexed bountyId, address indexed submitter, bytes32 proofHash, uint256 timestamp);
    event BountyApproved(bytes32 indexed bountyId, address indexed submitter, uint256 amount, uint256 timestamp);
    event SubmissionRejected(bytes32 indexed bountyId, address indexed submitter, bytes32 reasonHash, uint256 timestamp);
    event BountyCancelled(bytes32 indexed bountyId, uint256 refunded, uint256 timestamp);

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function createBounty(
        uint256 amount,
        bytes32 descriptionHash,
        uint256 deadline
    ) external nonReentrant returns (bytes32 bountyId) {
        require(amount > 0, "Amount must be > 0");
        require(deadline > block.timestamp, "Deadline must be future");

        bountyId = keccak256(abi.encodePacked(msg.sender, amount, descriptionHash, block.timestamp, nonce++));

        bounties[bountyId] = Bounty({
            employer: msg.sender,
            amount: amount,
            descriptionHash: descriptionHash,
            deadline: deadline,
            status: 0,
            approvedSubmitter: address(0),
            createdAt: block.timestamp
        });

        employerBounties[msg.sender].push(bountyId);

        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");

        emit BountyCreated(bountyId, msg.sender, amount, descriptionHash, deadline, block.timestamp);
    }

    function submitWork(bytes32 bountyId, bytes32 proofHash) external {
        Bounty storage b = bounties[bountyId];
        require(b.status == 0, "Bounty not open");
        require(block.timestamp <= b.deadline, "Deadline passed");
        require(submissions[bountyId][msg.sender].submittedAt == 0, "Already submitted");

        submissions[bountyId][msg.sender] = Submission({
            proofHash: proofHash,
            submittedAt: block.timestamp,
            status: 0
        });

        bountySubmitters[bountyId].push(msg.sender);

        emit WorkSubmitted(bountyId, msg.sender, proofHash, block.timestamp);
    }

    function approveBounty(bytes32 bountyId, address submitter) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        require(b.employer == msg.sender, "Not the employer");
        require(b.status == 0, "Bounty not open");
        require(submissions[bountyId][submitter].submittedAt > 0, "No submission");

        b.status = 1;
        b.approvedSubmitter = submitter;
        submissions[bountyId][submitter].status = 1;

        require(usdc.transfer(submitter, b.amount), "USDC transfer failed");

        emit BountyApproved(bountyId, submitter, b.amount, block.timestamp);
    }

    function rejectSubmission(bytes32 bountyId, address submitter, bytes32 reasonHash) external {
        Bounty storage b = bounties[bountyId];
        require(b.employer == msg.sender, "Not the employer");
        require(b.status == 0, "Bounty not open");
        require(submissions[bountyId][submitter].submittedAt > 0, "No submission");

        submissions[bountyId][submitter].status = 2;

        emit SubmissionRejected(bountyId, submitter, reasonHash, block.timestamp);
    }

    function cancelBounty(bytes32 bountyId) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        require(b.employer == msg.sender, "Not the employer");
        require(b.status == 0, "Bounty not open");

        b.status = 2;

        require(usdc.transfer(b.employer, b.amount), "Refund failed");

        emit BountyCancelled(bountyId, b.amount, block.timestamp);
    }

    function getBounty(bytes32 bountyId) external view returns (
        address employer,
        uint256 amount,
        bytes32 descriptionHash,
        uint256 deadline,
        uint8 status,
        address approvedSubmitter,
        uint256 createdAt
    ) {
        Bounty storage b = bounties[bountyId];
        return (b.employer, b.amount, b.descriptionHash, b.deadline, b.status, b.approvedSubmitter, b.createdAt);
    }

    function getSubmission(bytes32 bountyId, address submitter) external view returns (
        bytes32 proofHash,
        uint256 submittedAt,
        uint8 status
    ) {
        Submission storage s = submissions[bountyId][submitter];
        return (s.proofHash, s.submittedAt, s.status);
    }

    function getBountySubmitters(bytes32 bountyId) external view returns (address[] memory) {
        return bountySubmitters[bountyId];
    }

    function getEmployerBounties(address employer) external view returns (bytes32[] memory) {
        return employerBounties[employer];
    }
}
