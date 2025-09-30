// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
  BusinessWalletFactory.sol (self-serve version)
  - Businesses self-deploy their own smart wallet using CREATE2 + ERC1967Proxy
  - Deterministic salt (computed server-side) ensures predictable address
  - Each business gets exactly one wallet
  - NO KYC required for wallet creation - KYC only required for invoice tokenization
*/

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BusinessWalletFactory is Ownable {
    // Address of the BusinessWallet logic (implementation)
    address public implementation;

    // Track deployed wallets
    mapping(address => address) public businessToWallet; // EOA -> wallet
    mapping(bytes32 => bool) public usedSalt; // ensure unique salts

    event WalletCreated(address indexed owner, address wallet, bytes32 salt);
    event ImplementationUpdated(address newImplementation);

    constructor(address _implementation) {
        require(_implementation != address(0), "impl-zero");
        implementation = _implementation;
    }

    /* ============================
       Address Prediction
       ============================ */

    /// @notice Predict the wallet address for a given salt + initData
    function computeAddress(bytes32 salt, bytes memory initData) public view returns (address predicted) {
        bytes memory bytecode = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(implementation, initData)
        );
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(bytecode))
        );
        predicted = address(uint160(uint256(hash)));
    }

    /* ============================
       Wallet Deployment (Self-Serve)
       ============================ */

    /// @notice Deploy a wallet for msg.sender (business user) deterministically
    /// @param salt Deterministic salt (server-generated)
    /// @param initData Encoded initializer for BusinessWallet.initialize(...)
    function createWallet(bytes32 salt, bytes memory initData) external returns (address walletAddr) {
        address owner = msg.sender;
        require(owner != address(0), "owner-zero");
        require(businessToWallet[owner] == address(0), "wallet-exists");
        require(!usedSalt[salt], "salt-used");

        bytes memory bytecode = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(implementation, initData)
        );

        assembly {
            walletAddr := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(walletAddr) { revert(0, 0) }
        }

        // Save mappings
        businessToWallet[owner] = walletAddr;
        usedSalt[salt] = true;

        emit WalletCreated(owner, walletAddr, salt);
    }

    /* ============================
       Admin (Factory Maintenance)
       ============================ */

    function setImplementation(address _implementation) external onlyOwner {
        require(_implementation != address(0), "impl-zero");
        implementation = _implementation;
        emit ImplementationUpdated(_implementation);
    }

    /* ============================
       Frontend Helpers
       ============================ */

    /// @notice Build initializer calldata for BusinessWallet.initialize(owner)
    function buildInitData(address owner) public pure returns (bytes memory) {
        return abi.encodeWithSignature("initialize(address)", owner);
    }

    /// @notice Compute predicted wallet address using standard parameters
    function computeWalletAddress(bytes32 salt, address owner) external view returns (address) {
        bytes memory initData = buildInitData(owner);
        return computeAddress(salt, initData);
    }

    /// @notice Check if a business already has a wallet
    function hasWallet(address business) external view returns (bool) {
        return businessToWallet[business] != address(0);
    }

    /// @notice Get wallet address for a business
    function getWallet(address business) external view returns (address) {
        return businessToWallet[business];
    }
}
