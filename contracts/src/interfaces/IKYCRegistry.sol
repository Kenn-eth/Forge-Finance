// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IKYCRegistry
 * @notice Interface for KYC verification registry
 * @dev Used by BusinessWallet to verify business addresses for compliance
 */
interface IKYCRegistry {
    // Roles
    enum Role {
        NONE,
        INVESTOR,
        BUSINESS
    }
    enum Tier {
        NONE,
        TIER1,
        TIER2
    }
    struct User {
        Role role;
        bool verified;
        bytes32 kycHash; // Hash of offchain KYC data
    }

    /// business info struct
    struct BusinessInfo {
        string name;
        string registrationNumber;
        string businessType;
        string taxId;
        string email;
        string website;
        bytes32 physicalAddressHash;
        string jurisdiction;
        string sector;
        uint256 dateOfIncorporation;
        address owner;
        bool isVerified;
        uint256 kycExpiry;
        uint256 registeredAt;
        // Additional SME-relevant fields
        string phoneNumber;
        string description;
        string[] socialLinks;
        uint256 numberOfEmployees;
        uint256 annualRevenue;
        string legalStructure;
        address[] directors;
        string[] licenseNumbers;
        string[] licenseTypes;
        uint256[] licenseExpiries;
        string bankName;
        string bankAccountNumber;
        string bankVerificationNumber;
        string logoUrl;
        bytes32[] additionalDocHashes;
    }

    struct InvestorInfo {
        string fullName;
        string email;
        string phoneNumber;
        string nationality;
        string residentialAddress;
        uint256 dateOfBirth;
        string governmentIdNumber;
        string occupation;
        uint256 kycExpiry;
        uint256 registeredAt;
        bool isVerified;
    }

    // Events
    /// @notice Event emitted when a user is registered
    /// @param user Address of the user
    /// @param role Role of the user
    /// @param tier Tier of the user
    /// @param expiry Expiry date of the user
    /// @param jurisdiction Jurisdiction of the user
    /// @param docHash Document hash
    event UserRegistered(
        address indexed user, /// address of the user
        Role role, /// role of the user
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
    /// @notice Register a business
    /// @param businessInfo Business information
    /// @param docHash Document hash
    /// @return Address of the business
    function registerBusiness(
        BusinessInfo calldata businessInfo,
        bytes32 docHash
    ) external returns (address);

    /// @notice Register an investor
    /// @param investorInfo Investor information
    /// @param docHash Document hash
    /// @return Address of the investor
    function registerInvestor(
        InvestorInfo calldata investorInfo,
        bytes32 docHash
    ) external returns (address);

    /// @notice Revoke a user
    /// @param user Address of the user
    /// @param reason Reason for revocation
    /// @param docHash Document hash
    function revokeUser(
        address user,
        string calldata reason,
        bytes32 docHash
    ) external;

    /// @notice Renew a user's KYC
    /// @param user Address of the user
    /// @param newTier New tier
    /// @param newExpiry New expiry date
    /// @param docHash Document hash
    function renewKYC(
        address user,
        Tier newTier,
        uint256 newExpiry,
        bytes32 docHash
    ) external;

    // Query
    function isVerified(address user) external view returns (bool);
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
