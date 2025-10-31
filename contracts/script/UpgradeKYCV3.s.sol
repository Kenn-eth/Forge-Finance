// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {KYCRegistry} from "../src/KYCRegistry.sol";

// Upgrades an existing KYCRegistry UUPS proxy to a new implementation
// Env:
// - KYC_PROXY_ADDRESS: address of existing proxy
// - PRIVATE_KEY: admin with DEFAULT_ADMIN_ROLE on proxy
contract UpgradeKYCV3 is Script {
    function run() external {
        address proxyAddress = vm.envAddress("KYC_PROXY_ADDRESS");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Upgrading KYCRegistry Proxy ===");
        console.log("Deployer:", deployer);
        console.log("Proxy:", proxyAddress);

        vm.startBroadcast(deployerPrivateKey);

        // 1) Deploy new implementation
        console.log("\n1) Deploying new implementation...");
        KYCRegistry newImpl = new KYCRegistry();
        console.log("   New Implementation:", address(newImpl));

        // 2) Perform UUPS upgrade
        console.log("\n2) Calling upgradeToAndCall on proxy...");
        KYCRegistry proxy = KYCRegistry(proxyAddress);

        bytes32 adminRole = proxy.DEFAULT_ADMIN_ROLE();
        bool isAdmin = proxy.hasRole(adminRole, deployer);
        console.log("   Deployer has admin role:", isAdmin);
        require(isAdmin, "Not authorized to upgrade");

        // No initializer call needed; pass empty data. Use if you add new init steps.
        proxy.upgradeToAndCall(address(newImpl), "");

        console.log("\n=== Upgrade Complete ===");
        console.log("Proxy:", proxyAddress);
        console.log("New Implementation:", address(newImpl));

        vm.stopBroadcast();
    }
}
