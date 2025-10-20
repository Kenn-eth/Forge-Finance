// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IInvoiceTokenFactory
 * @notice Interface for InvoiceTokenFactory contract
 * @dev Defines the factory functionality for creating invoice tokens
 */
interface IInvoiceTokenFactory {
    /* ============================
       EVENTS
       ============================ */
    
    event InvoiceTokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        address indexed beneficiary,
        string metadataCid,
        uint256 amount
    );

    /* ============================
       CORE FUNCTIONS
       ============================ */

    /// @notice Mint a new invoice token
    /// @param metadataCid IPFS CID containing invoice metadata
    /// @param beneficiary Address that will own the minted invoice token
    /// @param amount Invoice amount/value
    /// @return tokenAddress Address of the newly minted invoice token contract
    function mintInvoice(bytes calldata metadataCid, address beneficiary, uint256 amount) external returns (address tokenAddress);

    /// @notice Get all invoice tokens created by a specific business
    /// @param business Address of the business
    /// @return tokens Array of invoice token addresses
    function getInvoicesByBusiness(address business) external view returns (address[] memory tokens);

    /// @notice Get total number of invoice tokens created
    /// @return count Total count of invoice tokens
    function getTotalInvoices() external view returns (uint256 count);

    /// @notice Get invoice token by index
    /// @param index Index of the invoice token
    /// @return tokenAddress Address of the invoice token
    function getInvoiceByIndex(uint256 index) external view returns (address tokenAddress);

    /* ============================
       VIEW FUNCTIONS
       ============================ */

    /// @notice Check if an address is a valid business wallet
    /// @param business Address to check
    /// @return isValid True if address is a valid business wallet
    function isValidBusiness(address business) external view returns (bool isValid);

    /// @notice Get the business wallet factory address
    /// @return factory Address of the business wallet factory
    function businessWalletFactory() external view returns (address factory);

    /// @notice Get the marketplace address
    /// @return marketplace Address of the marketplace
    function marketplace() external view returns (address marketplace);
}