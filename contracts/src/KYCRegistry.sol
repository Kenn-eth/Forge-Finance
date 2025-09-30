// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KYCRegistry
 * @notice Registry for managing KYC verification status of business addresses
 * @dev Allows admin to verify/unverify addresses for compliance requirements
 */

import "@openzeppelin/contracts/access/Ownable.sol";

contract KYCRegistry is Ownable {
    /* ============================
       EVENTS
       ============================ */
    
    event AddressVerified(address indexed addr, string businessId, uint256 timestamp);
    event AddressUnverified(address indexed addr, uint256 timestamp);
    event VerificationExpirySet(address indexed addr, uint256 expiryTime);

    /* ============================
       STORAGE
       ============================ */
    
    struct VerificationInfo {
        bool isVerified;
        string businessId;
        uint256 verifiedAt;
        uint256 expiryTime;
    }

    mapping(address => VerificationInfo) public verifications;
    mapping(string => address) public businessIdToAddress;
    
    uint256 public defaultExpiryDuration = 365 days; // 1 year default

    /* ============================
       MODIFIERS
       ============================ */
    
    modifier notZeroAddress(address addr) {
        require(addr != address(0), "KYCRegistry: zero address");
        _;
    }

    modifier notEmptyString(string memory str) {
        require(bytes(str).length > 0, "KYCRegistry: empty string");
        _;
    }

    /* ============================
       VERIFICATION FUNCTIONS
       ============================ */

    /// @notice Verify an address with KYC
    /// @param addr Address to verify
    /// @param businessId Unique business identifier
    function verifyAddress(address addr, string calldata businessId) 
        external 
        onlyOwner 
        notZeroAddress(addr) 
        notEmptyString(businessId) 
    {
        require(!verifications[addr].isVerified, "KYCRegistry: already verified");
        require(businessIdToAddress[businessId] == address(0), "KYCRegistry: business ID in use");

        uint256 expiryTime = block.timestamp + defaultExpiryDuration;
        
        verifications[addr] = VerificationInfo({
            isVerified: true,
            businessId: businessId,
            verifiedAt: block.timestamp,
            expiryTime: expiryTime
        });

        businessIdToAddress[businessId] = addr;

        emit AddressVerified(addr, businessId, block.timestamp);
        emit VerificationExpirySet(addr, expiryTime);
    }

    /// @notice Verify an address with custom expiry
    /// @param addr Address to verify
    /// @param businessId Unique business identifier
    /// @param expiryTime Unix timestamp when verification expires
    function verifyAddressWithExpiry(
        address addr, 
        string calldata businessId, 
        uint256 expiryTime
    ) external onlyOwner notZeroAddress(addr) notEmptyString(businessId) {
        require(!verifications[addr].isVerified, "KYCRegistry: already verified");
        require(businessIdToAddress[businessId] == address(0), "KYCRegistry: business ID in use");
        require(expiryTime > block.timestamp, "KYCRegistry: expiry in past");

        verifications[addr] = VerificationInfo({
            isVerified: true,
            businessId: businessId,
            verifiedAt: block.timestamp,
            expiryTime: expiryTime
        });

        businessIdToAddress[businessId] = addr;

        emit AddressVerified(addr, businessId, block.timestamp);
        emit VerificationExpirySet(addr, expiryTime);
    }

    /// @notice Unverify an address
    /// @param addr Address to unverify
    function unverifyAddress(address addr) external onlyOwner notZeroAddress(addr) {
        require(verifications[addr].isVerified, "KYCRegistry: not verified");

        string memory businessId = verifications[addr].businessId;
        
        // Clear verification
        delete verifications[addr];
        delete businessIdToAddress[businessId];

        emit AddressUnverified(addr, block.timestamp);
    }

    /// @notice Extend verification expiry
    /// @param addr Address to extend
    /// @param newExpiryTime New expiry timestamp
    function extendVerification(address addr, uint256 newExpiryTime) 
        external 
        onlyOwner 
        notZeroAddress(addr) 
    {
        require(verifications[addr].isVerified, "KYCRegistry: not verified");
        require(newExpiryTime > block.timestamp, "KYCRegistry: expiry in past");

        verifications[addr].expiryTime = newExpiryTime;
        emit VerificationExpirySet(addr, newExpiryTime);
    }

    /* ============================
       VIEW FUNCTIONS
       ============================ */

    /// @notice Check if an address is verified (and not expired)
    /// @param addr Address to check
    /// @return isVerified True if verified and not expired
    function isVerified(address addr) external view returns (bool isVerified) {
        VerificationInfo memory info = verifications[addr];
        return info.isVerified && info.expiryTime > block.timestamp;
    }

    /// @notice Get verification info for an address
    /// @param addr Address to check
    /// @return info Verification information
    function getVerificationInfo(address addr) external view returns (VerificationInfo memory info) {
        return verifications[addr];
    }

    /// @notice Check if verification is expired
    /// @param addr Address to check
    /// @return expired True if verification is expired
    function isExpired(address addr) external view returns (bool expired) {
        return verifications[addr].expiryTime <= block.timestamp;
    }

    /// @notice Get time until expiry
    /// @param addr Address to check
    /// @return timeRemaining Seconds until expiry (0 if expired)
    function getTimeUntilExpiry(address addr) external view returns (uint256 timeRemaining) {
        uint256 expiryTime = verifications[addr].expiryTime;
        if (expiryTime <= block.timestamp) {
            return 0;
        }
        return expiryTime - block.timestamp;
    }

    /// @notice Get address by business ID
    /// @param businessId Business identifier
    /// @return addr Associated address
    function getAddressByBusinessId(string calldata businessId) external view returns (address addr) {
        return businessIdToAddress[businessId];
    }

    /* ============================
       ADMIN FUNCTIONS
       ============================ */

    /// @notice Set default expiry duration
    /// @param duration Duration in seconds
    function setDefaultExpiryDuration(uint256 duration) external onlyOwner {
        require(duration > 0, "KYCRegistry: zero duration");
        defaultExpiryDuration = duration;
    }

    /// @notice Batch verify multiple addresses
    /// @param addresses Array of addresses to verify
    /// @param businessIds Array of business IDs
    function batchVerify(
        address[] calldata addresses,
        string[] calldata businessIds
    ) external onlyOwner {
        require(addresses.length == businessIds.length, "KYCRegistry: length mismatch");
        
        for (uint256 i = 0; i < addresses.length; i++) {
            verifyAddress(addresses[i], businessIds[i]);
        }
    }

    /// @notice Emergency: unverify all expired addresses
    function unverifyExpired() external onlyOwner {
        // This would require iterating through all addresses
        // For gas efficiency, consider implementing with events or off-chain indexing
        // For now, this is a placeholder
        revert("KYCRegistry: implement with off-chain indexing");
    }
}