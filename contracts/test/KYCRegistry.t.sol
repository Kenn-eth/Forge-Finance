// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {KYCRegistry} from "../src/KYCRegistry.sol";

contract KYCRegistryTest is Test {
    KYCRegistry public kycRegistry;
    address public admin = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);

    function setUp() public {
        vm.prank(admin);
        kycRegistry = new KYCRegistry();
        kycRegistry.initialize(admin);
    }

    function testInitialize() public {
        assertTrue(
            kycRegistry.hasRole(kycRegistry.DEFAULT_ADMIN_ROLE(), admin)
        );
        assertTrue(kycRegistry.hasRole(kycRegistry.ADMIN_ROLE(), admin));
    }

    function testRegisterInvestor() public {
        vm.prank(user1);
        kycRegistry.registerInvestor();

        assertTrue(kycRegistry.isInvestor(user1));
        assertFalse(kycRegistry.isBusiness(user1));
        assertFalse(kycRegistry.isKYCVerified(user1));
    }

    function testRegisterBusiness() public {
        vm.prank(user1);
        kycRegistry.registerBusiness();

        assertTrue(kycRegistry.isBusiness(user1));
        assertFalse(kycRegistry.isInvestor(user1));
        assertFalse(kycRegistry.isKYCVerified(user1));
    }

    function testVerifyKYCAfterRegistration() public {
        // First register as investor
        vm.prank(user1);
        kycRegistry.registerInvestor();

        // Then verify KYC
        vm.prank(admin);
        kycRegistry.verifyKYC(user1);

        assertTrue(kycRegistry.isInvestor(user1));
        assertTrue(kycRegistry.isKYCVerified(user1));
    }

    function testVerifyKYCAfterBusinessRegistration() public {
        // First register as business
        vm.prank(user1);
        kycRegistry.registerBusiness();

        // Then verify KYC
        vm.prank(admin);
        kycRegistry.verifyKYC(user1);

        assertTrue(kycRegistry.isBusiness(user1));
        assertTrue(kycRegistry.isKYCVerified(user1));
    }

    function testVerifyKYCWithoutRegistrationFails() public {
        vm.prank(admin);
        vm.expectRevert("User must be registered before KYC verification");
        kycRegistry.verifyKYC(user1);
    }

    function testVerifyKYCAlreadyVerifiedFails() public {
        // Register and verify
        vm.prank(user1);
        kycRegistry.registerInvestor();

        vm.prank(admin);
        kycRegistry.verifyKYC(user1);

        // Try to verify again
        vm.prank(admin);
        vm.expectRevert("User is already KYC verified");
        kycRegistry.verifyKYC(user1);
    }

    function testDoubleRegistrationFails() public {
        vm.prank(user1);
        kycRegistry.registerInvestor();

        vm.prank(user1);
        vm.expectRevert("Investor already registered");
        kycRegistry.registerInvestor();
    }

    function testDoubleBusinessRegistrationFails() public {
        vm.prank(user1);
        kycRegistry.registerBusiness();

        vm.prank(user1);
        vm.expectRevert("Business already registered");
        kycRegistry.registerBusiness();
    }

    function testRevokeUser() public {
        // Register and verify user
        vm.prank(user1);
        kycRegistry.registerInvestor();

        vm.prank(admin);
        kycRegistry.verifyKYC(user1);

        // Revoke user
        vm.prank(admin);
        kycRegistry.revokeUser(user1);

        assertFalse(kycRegistry.isInvestor(user1));
        assertFalse(kycRegistry.isKYCVerified(user1));
    }

    function testNonAdminCannotRevokeUser() public {
        vm.prank(user1);
        kycRegistry.registerInvestor();

        vm.prank(user2);
        vm.expectRevert("Caller is not an admin");
        kycRegistry.revokeUser(user1);
    }
}
