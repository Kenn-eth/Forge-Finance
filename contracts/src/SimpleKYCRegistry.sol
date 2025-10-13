// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract SimpleKYCRegistry is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable
{
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant KYC_AUTHORITY_ROLE =
        keccak256("KYC_AUTHORITY_ROLE");

    // User roles
    enum Role {
        NONE,
        INVESTOR,
        BUSINESS
    }

    // User struct
    struct User {
        Role role;
        bool verified;
        bytes32 kycHash;
    }

    // State variables
    mapping(address => User) private users;
    mapping(address => bool) private userWallets;
    mapping(address => bool) private investorWallets;
    mapping(address => bool) private businessWallets;
    mapping(address => bool) private isKYCVerified;

    address private _kycAuthority;
    address private _businessWalletFactory;

    // Events
    event UserRegistered(address indexed user, Role role, address wallet);
    event UserVerified(address indexed user, bytes32 kycHash);

    // Modifiers
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not admin");
        _;
    }

    modifier onlyKycAuthority() {
        require(hasRole(KYC_AUTHORITY_ROLE, msg.sender), "Not KYC authority");
        _;
    }

    // Initializer
    function initialize(
        address admin,
        address kycAuthority,
        address businessWalletFactory /// @audit to be removed
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(KYC_AUTHORITY_ROLE, kycAuthority);

        _kycAuthority = kycAuthority;
        _businessWalletFactory = businessWalletFactory; /// @audit to be removed
    }

    // Register user (simplified version)
    function registerUser(Role role) external returns (address userAddress) {
        require(users[msg.sender].role == Role.NONE, "Already registered");
        require(role == Role.INVESTOR || role == Role.BUSINESS, "Invalid role");

        // For demo purposes, we'll just use the user's address as the wallet
        // In a real implementation, this would call the BusinessWalletFactory
        userAddress = msg.sender;

        if (role == Role.INVESTOR) {
            investorWallets[userAddress] = true;
        } else if (role == Role.BUSINESS) {
            businessWallets[userAddress] = true;
        }

        users[msg.sender] = User(role, false, bytes32(0));
        userWallets[userAddress] = true;

        emit UserRegistered(msg.sender, role, userAddress);
    }

    // Verify user (admin only)
    function verifyUser(
        address user,
        bytes32 kycHash
    ) external onlyKycAuthority {
        require(users[user].role != Role.NONE, "User not registered");

        users[user].verified = true;
        users[user].kycHash = kycHash;
        isKYCVerified[user] = true;

        emit UserVerified(user, kycHash);
    }

    // View functions
    function isVerified(address user) external view returns (bool) {
        return users[user].verified;
    }

    function getUserRole(address user) external view returns (Role) {
        return users[user].role;
    }

    function isVerifiedBusiness(address user) external view returns (bool) {
        return users[user].role == Role.BUSINESS && users[user].verified;
    }

    function isVerifiedInvestor(address user) external view returns (bool) {
        return users[user].role == Role.INVESTOR && users[user].verified;
    }

    // UUPS authorization
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
