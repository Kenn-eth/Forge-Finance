// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {InvoiceTokenVault} from "../src/InvoiceToken.sol";

/**
 * @dev This script upgrades the InvoiceToken implementation using UUPS pattern
 *
 * Requirements:
 * 1. The new implementation must have UUPSUpgradeable support
 * 2. The deployer must have DEFAULT_ADMIN_ROLE on the proxy
 */
contract UpgradeInvoiceToken is Script {
    function run() external {
        // Load environment variables
        address proxyAddress = vm.envAddress("INVOICE_TOKEN_PROXY_ADDRESS");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Upgrading InvoiceToken Implementation ===");
        console.log("Deployer:", deployer);
        console.log("Proxy Address:", proxyAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new implementation
        console.log("\n1. Deploying new implementation...");
        console.log("   Changes:");
        console.log("   - Removed nonReentrant modifier from createInvoice");
        console.log("   - Added UUPS upgradeability support");
        InvoiceTokenVault newImplementation = new InvoiceTokenVault();
        console.log(
            "New Implementation deployed at:",
            address(newImplementation)
        );

        // Upgrade the proxy using UUPS upgradeToAndCall
        console.log("\n2. Upgrading proxy via UUPS...");

        // Get the proxy as the implementation contract
        InvoiceTokenVault proxy = InvoiceTokenVault(proxyAddress);

        // Check if deployer has DEFAULT_ADMIN_ROLE
        bytes32 adminRole = proxy.DEFAULT_ADMIN_ROLE();
        bool isAdmin = proxy.hasRole(adminRole, deployer);
        console.log("Deployer has admin role:", isAdmin);

        if (!isAdmin) {
            console.log("ERROR: Deployer does not have admin role!");
            console.log("Cannot upgrade the contract.");
            vm.stopBroadcast();
            revert("Not authorized");
        }

        // Call upgradeToAndCall on the proxy (UUPS pattern)
        proxy.upgradeToAndCall(address(newImplementation), "");

        console.log("\n=== Upgrade Complete ===");
        console.log("Proxy:", proxyAddress);
        console.log("New Implementation:", address(newImplementation));
        console.log("\nProxy now points to the new implementation!");
        console.log("All state data is preserved in the proxy.");

        vm.stopBroadcast();
    }
}
