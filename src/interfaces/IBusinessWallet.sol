// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBusinessWallet
 * @notice Interface for BusinessWallet contract
 * @dev Defines the core functionality of business wallets
 */
interface IBusinessWallet {
    /* ============================
       EVENTS
       ============================ */
    
    event WalletInitialized(address indexed owner);
    event PaymentSent(address indexed to, address indexed token, uint256 amount, bytes data);
    event PaymentReceived(address indexed from, address indexed token, uint256 amount);
    event MultisigSetup(address[] signers, uint256 threshold);
    event InvoiceMinted(address indexed tokenAddress, bytes metadataCid, uint256 amount);
    event MarketplaceListed(address indexed token, uint256 tokenId, uint256 price);

    /* ============================
       CORE FUNCTIONS
       ============================ */

    /// @notice Initialize the business wallet
    /// @param _owner Initial owner/admin address
    function initialize(address _owner) external;

    /// @notice Execute a transaction (ETH or contract call)
    /// @param to Target address
    /// @param value ETH amount to send
    /// @param data Call data
    function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory);

    /// @notice Transfer ERC20 tokens
    /// @param token Token contract address
    /// @param to Recipient address
    /// @param amount Amount to transfer
    function transferToken(address token, address to, uint256 amount) external;

    /// @notice Mint an invoice token (requires KYC verification)
    /// @param metadataCid IPFS CID for invoice metadata
    /// @param amount Invoice amount
    /// @return tokenAddress Address of the minted invoice token
    function mintInvoice(bytes calldata metadataCid, uint256 amount) external returns (address tokenAddress);

    /// @notice List an invoice token on marketplace
    /// @param token Invoice token address
    /// @param tokenId Token ID to list
    /// @param price Listing price
    function listOnMarketplace(address token, uint256 tokenId, uint256 price) external;

    /* ============================
       VIEW FUNCTIONS
       ============================ */

    /// @notice Get all multisig signers
    function getMultisigSigners() external view returns (address[] memory);

    /// @notice Get multisig configuration
    function getMultisigConfig() external view returns (address[] memory signers, uint256 threshold, bool enabled);

    /// @notice Check if the business is KYC verified
    function isKYCVerified() external view returns (bool);

    /* ============================
       RECEIVE
       ============================ */

    /// @notice Receive ETH
    receive() external payable;
}
