// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IInvoiceToken
 * @notice Interface for InvoiceToken contract
 * @dev Defines the functionality of individual invoice tokens
 */
interface IInvoiceToken {
    /* ============================
       EVENTS
       ============================ */
    
    event InvoicePaid(address indexed payer, uint256 amount);
    event InvoiceTransferred(address indexed from, address indexed to, uint256 tokenId);
    event InvoiceMetadataUpdated(string newMetadataCid);

    /* ============================
       CORE FUNCTIONS
       ============================ */

    /// @notice Pay the invoice
    /// @param amount Amount to pay
    function payInvoice(uint256 amount) external payable;

    /// @notice Get invoice details
    /// @return metadataCid IPFS CID of invoice metadata
    /// @return amount Original invoice amount
    /// @return paidAmount Amount already paid
    /// @return beneficiary Invoice beneficiary
    /// @return isPaid Whether invoice is fully paid
    function getInvoiceDetails() external view returns (
        string memory metadataCid,
        uint256 amount,
        uint256 paidAmount,
        address beneficiary,
        bool isPaid
    );

    /// @notice Check if invoice is fully paid
    /// @return isPaid True if invoice is fully paid
    function isPaid() external view returns (bool);

    /// @notice Get remaining amount to be paid
    /// @return remainingAmount Amount still owed
    function getRemainingAmount() external view returns (uint256 remainingAmount);

    /* ============================
       STANDARD ERC721 FUNCTIONS
       ============================ */

    /// @notice Transfer ownership of the invoice token
    /// @param to Address to transfer to
    /// @param tokenId Token ID to transfer
    function transferFrom(address from, address to, uint256 tokenId) external;

    /// @notice Approve spender for token
    /// @param to Address to approve
    /// @param tokenId Token ID to approve
    function approve(address to, uint256 tokenId) external;

    /// @notice Get owner of token
    /// @param tokenId Token ID
    /// @return owner Address of token owner
    function ownerOf(uint256 tokenId) external view returns (address owner);
}
