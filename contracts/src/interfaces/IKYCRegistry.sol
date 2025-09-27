// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IKYCRegistry {
    // Roles
    enum Role {
        NONE,
        BUSINESS,
        INVESTOR
    }
    enum Tier {
        NONE,
        TIER1,
        TIER2
    }

    // Events
    event UserRegistered(
        address indexed user,
        Role role,
        Tier tier,
        uint256 expiry,
        string jurisdiction,
        bytes32 docHash
    );
    event UserRevoked(address indexed user, string reason, bytes32 docHash);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event KYCUpdated(address indexed user, Tier newTier, uint256 newExpiry);
    event Paused(address indexed admin);
    event Unpaused(address indexed admin);
    event KYCExpired(address indexed user);

    // Registration & Revocation
    function registerBusiness(
        address user,
        Tier tier,
        uint256 expiry,
        string calldata jurisdiction,
        bytes32 docHash
    ) external;
    function registerInvestor(
        address user,
        Tier tier,
        uint256 expiry,
        string calldata jurisdiction,
        bytes32 docHash
    ) external;
    function batchRegister(
        address[] calldata users,
        Role[] calldata roles,
        Tier[] calldata tiers,
        uint256[] calldata expiries,
        string[] calldata jurisdictions,
        bytes32[] calldata docHashes
    ) external;
    function revokeUser(
        address user,
        string calldata reason,
        bytes32 docHash
    ) external;
    function renewKYC(
        address user,
        Tier newTier,
        uint256 newExpiry,
        bytes32 docHash
    ) external;

    // Query
    function isVerifiedBusiness(address user) external view returns (bool);
    function isVerifiedInvestor(address user) external view returns (bool);
    function getUserRole(address user) external view returns (Role);
    function getUserTier(address user) external view returns (Tier);
    function getUserExpiry(address user) external view returns (uint256);
    function getUserJurisdiction(
        address user
    ) external view returns (string memory);
    function isGloballyWhitelisted(address user) external view returns (bool);
    function getAllUsersByRole(
        Role role
    ) external view returns (address[] memory);
    function getKYCValidity(
        address user
    ) external view returns (uint256 remainingDays);

    // Admin management
    function addAdmin(address admin) external;
    function removeAdmin(address admin) external;
    function isAdmin(address user) external view returns (bool);
    function owner() external view returns (address);
    function kycAuthority() external view returns (address);

    // Pausable
    function pause() external;
    function unpause() external;
    function paused() external view returns (bool);

    // Signature-based registration (EIP-712)
    function registerWithSignature(
        address user,
        Role role,
        Tier tier,
        uint256 expiry,
        string calldata jurisdiction,
        bytes32 docHash,
        bytes calldata signature
    ) external;

    // Transfer restriction check (for compliant tokens)
    function canTransfer(address from, address to) external view returns (bool);

    // Migration support
    function migrateUsers(
        address[] calldata users,
        Role[] calldata roles,
        Tier[] calldata tiers,
        uint256[] calldata expiries,
        string[] calldata jurisdictions,
        bytes32[] calldata docHashes
    ) external;

    // Self-revocation
    function selfRevoke(string calldata reason, bytes32 docHash) external;

    // Upgradeability (marker for proxy-compatible design)
    // function proxiableUUID() external view returns (bytes32);

    // Integration hooks/callbacks (to be defined as needed)
    // function onKYCChange(address user, Role newRole, Tier newTier, uint256 newExpiry) external;
}
