// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {KYCRegistry} from "../src/KYCRegistry.sol";

// Upgrades an existing KYCRegistry UUPS proxy to a provided implementation address
// Env:
// - KYC_PROXY_ADDRESS: address of existing proxy
// - KYC_NEW_IMPLEMENTATION: address of the new implementation (already deployed)
// - PRIVATE_KEY: admin with DEFAULT_ADMIN_ROLE on proxy
contract UpgradeKYCToImpl is Script {
    function run() external {
        address proxyAddress = vm.envAddress("KYC_PROXY_ADDRESS");
        address newImpl = vm.envAddress("KYC_NEW_IMPLEMENTATION");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Upgrading KYCRegistry Proxy (provided impl) ===");
        console.log("Deployer:", deployer);
        console.log("Proxy:", proxyAddress);
        console.log("New Implementation:", newImpl);

        vm.startBroadcast(deployerPrivateKey);

        KYCRegistry proxy = KYCRegistry(proxyAddress);
        bytes32 adminRole = proxy.DEFAULT_ADMIN_ROLE();
        bool isAdmin = proxy.hasRole(adminRole, deployer);
        console.log("Deployer has admin role:", isAdmin);
        require(isAdmin, "Not authorized to upgrade");

        proxy.upgradeToAndCall(newImpl, "");

        console.log("\n=== Upgrade Complete ===");
        console.log("Proxy:", proxyAddress);
        console.log("Now points to:", newImpl);

        vm.stopBroadcast();
    }
}
