// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMarketplace
 * @notice Interface for invoice token marketplace
 * @dev Used by BusinessWallet to list invoice tokens for trading
 */
interface IMarketplace {
    /* ============================
       EVENTS
       ============================ */
    
    event ListingCreated(
        address indexed seller,
        address indexed token,
        uint256 indexed tokenId,
        uint256 price,
        uint256 listingId
    );
    
    event ListingSold(
        address indexed buyer,
        address indexed seller,
        address indexed token,
        uint256 tokenId,
        uint256 price,
        uint256 listingId
    );
    
    event ListingCancelled(
        address indexed seller,
        uint256 indexed listingId
    );

    /* ============================
       CORE FUNCTIONS
       ============================ */

    /// @notice Create a new listing on the marketplace
    /// @param token Address of the invoice token contract
    /// @param tokenId Token ID to list
    /// @param price Listing price in the marketplace currency
    function createListing(address token, uint256 tokenId, uint256 price) external;

    /// @notice Buy a listed invoice token
    /// @param listingId ID of the listing to buy
    function buyListing(uint256 listingId) external payable;

    /// @notice Cancel an active listing
    /// @param listingId ID of the listing to cancel
    function cancelListing(uint256 listingId) external;

    /* ============================
       VIEW FUNCTIONS
       ============================ */

    /// @notice Get listing details
    /// @param listingId ID of the listing
    /// @return seller Address of the seller
    /// @return token Address of the invoice token contract
    /// @return tokenId Token ID
    /// @return price Listing price
    /// @return isActive Whether listing is still active
    function getListing(uint256 listingId) external view returns (
        address seller,
        address token,
        uint256 tokenId,
        uint256 price,
        bool isActive
    );

    /// @notice Get all active listings
    /// @return listingIds Array of active listing IDs
    function getActiveListings() external view returns (uint256[] memory listingIds);

    /// @notice Get listings by seller
    /// @param seller Address of the seller
    /// @return listingIds Array of listing IDs created by seller
    function getListingsBySeller(address seller) external view returns (uint256[] memory listingIds);

    /// @notice Get total number of listings
    /// @return count Total count of listings (active + inactive)
    function getTotalListings() external view returns (uint256 count);

    /// @notice Check if a listing is active
    /// @param listingId ID of the listing
    /// @return isActive True if listing is active
    function isListingActive(uint256 listingId) external view returns (bool isActive);
}