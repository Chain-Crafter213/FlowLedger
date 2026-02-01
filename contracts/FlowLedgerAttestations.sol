// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FlowLedgerAttestations
 * @notice On-chain attestations for payment verification and disputes
 * @dev Stores hashes of payment metadata for auditability
 */
contract FlowLedgerAttestations is Ownable {
    struct Attestation {
        bytes32 contentHash;
        address attester;
        uint256 timestamp;
        string attestationType;
        bool revoked;
    }

    // Attestation ID => Attestation
    mapping(bytes32 => Attestation) public attestations;
    
    // Address => Attestation IDs
    mapping(address => bytes32[]) public attestationsByAddress;
    
    // TX Hash => Attestation IDs
    mapping(bytes32 => bytes32[]) public attestationsByTx;

    uint256 public attestationCount;

    event AttestationCreated(
        bytes32 indexed attestationId,
        address indexed attester,
        bytes32 contentHash,
        string attestationType
    );

    event AttestationRevoked(
        bytes32 indexed attestationId,
        address indexed revoker
    );

    constructor(address _owner) Ownable(_owner) {}

    /**
     * @notice Create a new attestation
     * @param contentHash Hash of the attestation content (IPFS CID, etc.)
     * @param attestationType Type of attestation (e.g., "payslip", "receipt", "dispute")
     * @param relatedTxHash Optional transaction hash this attestation relates to
     */
    function createAttestation(
        bytes32 contentHash,
        string calldata attestationType,
        bytes32 relatedTxHash
    ) external returns (bytes32 attestationId) {
        require(contentHash != bytes32(0), "Invalid content hash");
        
        attestationId = keccak256(
            abi.encodePacked(contentHash, msg.sender, block.timestamp, attestationCount++)
        );

        attestations[attestationId] = Attestation({
            contentHash: contentHash,
            attester: msg.sender,
            timestamp: block.timestamp,
            attestationType: attestationType,
            revoked: false
        });

        attestationsByAddress[msg.sender].push(attestationId);
        
        if (relatedTxHash != bytes32(0)) {
            attestationsByTx[relatedTxHash].push(attestationId);
        }

        emit AttestationCreated(attestationId, msg.sender, contentHash, attestationType);
    }

    /**
     * @notice Revoke an attestation
     * @param attestationId ID of the attestation to revoke
     */
    function revokeAttestation(bytes32 attestationId) external {
        Attestation storage attestation = attestations[attestationId];
        
        require(attestation.attester == msg.sender, "Not attester");
        require(!attestation.revoked, "Already revoked");

        attestation.revoked = true;

        emit AttestationRevoked(attestationId, msg.sender);
    }

    /**
     * @notice Get attestations by address
     * @param addr Address to query
     */
    function getAttestationsByAddress(address addr) external view returns (bytes32[] memory) {
        return attestationsByAddress[addr];
    }

    /**
     * @notice Get attestations by transaction hash
     * @param txHash Transaction hash to query
     */
    function getAttestationsByTx(bytes32 txHash) external view returns (bytes32[] memory) {
        return attestationsByTx[txHash];
    }

    /**
     * @notice Verify an attestation exists and is valid
     * @param attestationId ID of the attestation
     * @param expectedHash Expected content hash
     */
    function verifyAttestation(
        bytes32 attestationId,
        bytes32 expectedHash
    ) external view returns (bool valid, address attester, uint256 timestamp) {
        Attestation storage attestation = attestations[attestationId];
        
        valid = attestation.contentHash == expectedHash && !attestation.revoked;
        attester = attestation.attester;
        timestamp = attestation.timestamp;
    }
}
