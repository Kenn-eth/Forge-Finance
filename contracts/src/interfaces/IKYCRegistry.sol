// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IKYCRegistry
 * @notice Interface for KYC verification registry
 * @dev Used by BusinessWallet to verify business addresses for compliance
 */
interface IKYCRegistry {
    /**
     * @notice Check if an address is KYC verified
     * @param _addr Address to check
     * @return isVerified True if address is verified and not expired
     */
    function isVerified(address _addr) external view returns (bool);
}
