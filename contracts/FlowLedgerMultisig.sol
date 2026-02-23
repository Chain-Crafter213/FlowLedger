// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FlowLedgerMultisig
 * @notice Multi-signature payroll approval. Create teams, propose payroll, require N-of-M approvals, auto-execute.
 */
contract FlowLedgerMultisig is ReentrancyGuard {
    IERC20 public immutable usdc;

    struct Team {
        address creator;
        address[] signers;
        uint256 requiredApprovals;
        uint256 createdAt;
        bool exists;
    }

    struct Proposal {
        bytes32 teamId;
        address proposer;
        address[] workers;
        uint256[] amounts;
        string label;
        uint256 totalAmount;
        uint256 approvalCount;
        uint8 status; // 0=pending, 1=executed, 2=cancelled
        uint256 createdAt;
    }

    mapping(bytes32 => Team) public teams;
    mapping(bytes32 => Proposal) public proposals;
    mapping(bytes32 => mapping(address => bool)) public hasApproved;
    mapping(address => bytes32[]) public userTeams;
    mapping(bytes32 => bytes32[]) public teamProposals;
    uint256 private teamNonce;
    uint256 private proposalNonce;

    event TeamCreated(bytes32 indexed teamId, address indexed creator, uint256 signerCount, uint256 requiredApprovals, uint256 timestamp);
    event ProposalCreated(bytes32 indexed proposalId, bytes32 indexed teamId, address indexed proposer, uint256 totalAmount, string label, uint256 timestamp);
    event ProposalApproved(bytes32 indexed proposalId, address indexed signer, uint256 approvalCount, uint256 timestamp);
    event ProposalExecuted(bytes32 indexed proposalId, uint256 totalAmount, uint256 timestamp);
    event ProposalCancelled(bytes32 indexed proposalId, uint256 refunded, uint256 timestamp);

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function createTeam(
        address[] calldata signers,
        uint256 requiredApprovals
    ) external returns (bytes32 teamId) {
        require(signers.length >= 2, "Need at least 2 signers");
        require(requiredApprovals >= 1 && requiredApprovals <= signers.length, "Invalid threshold");

        teamId = keccak256(abi.encodePacked(msg.sender, signers.length, block.timestamp, teamNonce++));

        teams[teamId].creator = msg.sender;
        teams[teamId].signers = signers;
        teams[teamId].requiredApprovals = requiredApprovals;
        teams[teamId].createdAt = block.timestamp;
        teams[teamId].exists = true;

        for (uint256 i = 0; i < signers.length; i++) {
            userTeams[signers[i]].push(teamId);
        }

        emit TeamCreated(teamId, msg.sender, signers.length, requiredApprovals, block.timestamp);
    }

    function createProposal(
        bytes32 teamId,
        address[] calldata workers,
        uint256[] calldata amounts,
        string calldata label
    ) external nonReentrant returns (bytes32 proposalId) {
        require(teams[teamId].exists, "Team does not exist");
        require(workers.length == amounts.length, "Length mismatch");
        require(workers.length > 0, "No workers");
        require(_isSigner(teamId, msg.sender), "Not a team signer");

        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }

        proposalId = keccak256(abi.encodePacked(teamId, msg.sender, total, block.timestamp, proposalNonce++));

        Proposal storage p = proposals[proposalId];
        p.teamId = teamId;
        p.proposer = msg.sender;
        p.workers = workers;
        p.amounts = amounts;
        p.label = label;
        p.totalAmount = total;
        p.approvalCount = 0;
        p.status = 0;
        p.createdAt = block.timestamp;

        teamProposals[teamId].push(proposalId);

        require(usdc.transferFrom(msg.sender, address(this), total), "USDC transfer failed");

        emit ProposalCreated(proposalId, teamId, msg.sender, total, label, block.timestamp);
    }

    function approveProposal(bytes32 proposalId) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(p.status == 0, "Proposal not pending");
        require(_isSigner(p.teamId, msg.sender), "Not a team signer");
        require(!hasApproved[proposalId][msg.sender], "Already approved");

        hasApproved[proposalId][msg.sender] = true;
        p.approvalCount++;

        emit ProposalApproved(proposalId, msg.sender, p.approvalCount, block.timestamp);

        // Auto-execute when threshold met
        if (p.approvalCount >= teams[p.teamId].requiredApprovals) {
            _executeProposal(proposalId);
        }
    }

    function cancelProposal(bytes32 proposalId) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(p.status == 0, "Proposal not pending");
        require(p.proposer == msg.sender, "Not the proposer");

        p.status = 2;
        require(usdc.transfer(p.proposer, p.totalAmount), "Refund failed");

        emit ProposalCancelled(proposalId, p.totalAmount, block.timestamp);
    }

    function _executeProposal(bytes32 proposalId) private {
        Proposal storage p = proposals[proposalId];
        p.status = 1;

        for (uint256 i = 0; i < p.workers.length; i++) {
            require(usdc.transfer(p.workers[i], p.amounts[i]), "Payment failed");
        }

        emit ProposalExecuted(proposalId, p.totalAmount, block.timestamp);
    }

    function _isSigner(bytes32 teamId, address user) private view returns (bool) {
        address[] storage signers = teams[teamId].signers;
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == user) return true;
        }
        return false;
    }

    function getTeam(bytes32 teamId) external view returns (
        address creator,
        address[] memory signers,
        uint256 requiredApprovals,
        uint256 createdAt,
        bool exists
    ) {
        Team storage t = teams[teamId];
        return (t.creator, t.signers, t.requiredApprovals, t.createdAt, t.exists);
    }

    function getProposal(bytes32 proposalId) external view returns (
        bytes32 teamId,
        address proposer,
        address[] memory workers,
        uint256[] memory amounts,
        string memory label,
        uint256 totalAmount,
        uint256 approvalCount,
        uint8 status,
        uint256 createdAt
    ) {
        Proposal storage p = proposals[proposalId];
        return (p.teamId, p.proposer, p.workers, p.amounts, p.label, p.totalAmount, p.approvalCount, p.status, p.createdAt);
    }

    function getTeamProposals(bytes32 teamId) external view returns (bytes32[] memory) {
        return teamProposals[teamId];
    }

    function getUserTeams(address user) external view returns (bytes32[] memory) {
        return userTeams[user];
    }
}
