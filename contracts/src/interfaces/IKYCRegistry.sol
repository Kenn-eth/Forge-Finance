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

    struct User {
        Role role;
        bool verified;
    }

    // Events

    /// @notice Event emitted when a business is registered
    /// @param user Address of the business
    event BusinessRegistered(address indexed user);

    /// @notice Event emitted when an investor is registered
    /// @param user Address of the user
    event InvestorRegistered(address indexed user);

    function registerBusiness() external;
    function registerInvestor() external;
    function verifyKYC(address user) external;

    /// @notice Revoke a user
    /// @param user Address of the user
    function revokeUser(address user) external;

    // Query
    function isBusiness(address user) external view returns (bool);
    function isInvestor(address user) external view returns (bool);
    function getKYCStatus(address user) external view returns (bool);
}
