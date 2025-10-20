// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBusinessWalletFactory
 * @notice Interface for BusinessWalletFactory contract
 * @dev Defines the factory functionality for creating business wallets
 */
interface IBusinessWalletFactory {
    /* ============================
       EVENTS
       ============================ */
    
    event WalletCreated(address indexed owner, address wallet, bytes32 salt);
    event ImplementationUpdated(address newImplementation);

    /* ============================
       CORE FUNCTIONS
       ============================ */

    /// @notice Deploy a wallet for msg.sender (business user) deterministically
    /// @param salt Deterministic salt (server-generated)
    /// @param initData Encoded initializer for BusinessWallet.initialize(...)
    function createWallet(bytes32 salt, bytes memory initData) external returns (address walletAddr);

    /// @notice Build initializer calldata for BusinessWallet.initialize(owner)
    function buildInitData(address owner) external pure returns (bytes memory);

    /// @notice Compute predicted wallet address using standard parameters
    function computeWalletAddress(bytes32 salt, address owner) external view returns (address);

    /// @notice Predict the wallet address for a given salt + initData
    function computeAddress(bytes32 salt, bytes memory initData) external view returns (address predicted);

    /* ============================
       VIEW FUNCTIONS
       ============================ */

    /// @notice Check if a business already has a wallet
    function hasWallet(address business) external view returns (bool);

    /// @notice Get wallet address for a business
    function getWallet(address business) external view returns (address);

    /// @notice Get the current implementation address
    function implementation() external view returns (address);

    /// @notice Check if a salt has been used
    function usedSalt(bytes32 salt) external view returns (bool);

    /// @notice Get wallet address for a business owner
    function businessToWallet(address business) external view returns (address);

    /* ============================
       ADMIN FUNCTIONS
       ============================ */

    /// @notice Set implementation address
    /// @param _implementation New implementation address
    function setImplementation(address _implementation) external;
}
