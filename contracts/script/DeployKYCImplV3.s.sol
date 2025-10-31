// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {KYCRegistry} from "../src/KYCRegistry.sol";

// Deploys only the new implementation (no proxy). Use with an existing UUPS proxy.
contract DeployKYCImplV3 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Deploying KYCRegistry Implementation V3 (UUPS) ===");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        KYCRegistry newImpl = new KYCRegistry();
        console.log("New Implementation:", address(newImpl));

        vm.stopBroadcast();

        console.log("\n=== NEXT STEPS ===");
        console.log("1) Set KYC_NEW_IMPLEMENTATION=%s", address(newImpl));
        console.log(
            "2) Run UpgradeKYCV3.s.sol with KYC_PROXY_ADDRESS set to your existing proxy"
        );

        console.log("\n=== VERIFICATION (example: base-sepolia) ===");
        console.log(
            "forge verify-contract %s src/KYCRegistry.sol:KYCRegistry --chain base-sepolia",
            address(newImpl)
        );
    }
}
