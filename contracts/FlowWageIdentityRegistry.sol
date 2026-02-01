// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FlowWageIdentityRegistry
 * @notice Registry for linking wallet addresses to identity metadata
 * @dev Stores IPFS hashes of encrypted identity data
 */
contract FlowWageIdentityRegistry is Ownable {
    struct Identity {
        bytes32 dataHash; // IPFS CID of encrypted identity data
        uint256 registeredAt;
        uint256 updatedAt;
        bool verified;
        address verifier;
    }

    // Address => Identity
    mapping(address => Identity) public identities;
    
    // Authorized verifiers
    mapping(address => bool) public verifiers;

    event IdentityRegistered(
        address indexed account,
        bytes32 dataHash
    );

    event IdentityUpdated(
        address indexed account,
        bytes32 oldHash,
        bytes32 newHash
    );

    event IdentityVerified(
        address indexed account,
        address indexed verifier
    );

    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);

    constructor(address _owner) Ownable(_owner) {}

    /**
     * @notice Register identity data
     * @param dataHash IPFS CID of the encrypted identity data
     */
    function registerIdentity(bytes32 dataHash) external {
        require(dataHash != bytes32(0), "Invalid data hash");
        require(identities[msg.sender].registeredAt == 0, "Already registered");

        identities[msg.sender] = Identity({
            dataHash: dataHash,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp,
            verified: false,
            verifier: address(0)
        });

        emit IdentityRegistered(msg.sender, dataHash);
    }

    /**
     * @notice Update identity data
     * @param newDataHash New IPFS CID
     */
    function updateIdentity(bytes32 newDataHash) external {
        require(newDataHash != bytes32(0), "Invalid data hash");
        Identity storage identity = identities[msg.sender];
        require(identity.registeredAt > 0, "Not registered");

        bytes32 oldHash = identity.dataHash;
        identity.dataHash = newDataHash;
        identity.updatedAt = block.timestamp;
        identity.verified = false; // Reset verification on update
        identity.verifier = address(0);

        emit IdentityUpdated(msg.sender, oldHash, newDataHash);
    }

    /**
     * @notice Verify an identity (verifiers only)
     * @param account Address to verify
     */
    function verifyIdentity(address account) external {
        require(verifiers[msg.sender], "Not a verifier");
        Identity storage identity = identities[account];
        require(identity.registeredAt > 0, "Not registered");
        require(!identity.verified, "Already verified");

        identity.verified = true;
        identity.verifier = msg.sender;

        emit IdentityVerified(account, msg.sender);
    }

    /**
     * @notice Add a verifier
     * @param verifier Address to add
     */
    function addVerifier(address verifier) external onlyOwner {
        require(verifier != address(0), "Invalid verifier");
        require(!verifiers[verifier], "Already verifier");
        verifiers[verifier] = true;
        emit VerifierAdded(verifier);
    }

    /**
     * @notice Remove a verifier
     * @param verifier Address to remove
     */
    function removeVerifier(address verifier) external onlyOwner {
        require(verifiers[verifier], "Not a verifier");
        verifiers[verifier] = false;
        emit VerifierRemoved(verifier);
    }

    /**
     * @notice Check if an identity is verified
     * @param account Address to check
     */
    function isVerified(address account) external view returns (bool) {
        return identities[account].verified;
    }

    /**
     * @notice Get identity data hash
     * @param account Address to query
     */
    function getIdentityHash(address account) external view returns (bytes32) {
        return identities[account].dataHash;
    }
}
