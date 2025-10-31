// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {InvoiceTokenVault} from "../src/InvoiceToken.sol";

// Deploys only the new implementation (no proxy). Use with an existing UUPS proxy.
contract DeployInvoiceTokenImplV3 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Deploying InvoiceToken Implementation V3 (UUPS) ===");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        InvoiceTokenVault newImpl = new InvoiceTokenVault();
        console.log("New Implementation:", address(newImpl));

        vm.stopBroadcast();

        console.log("\n=== NEXT STEPS ===");
        console.log(
            "1) Set INVOICE_TOKEN_NEW_IMPLEMENTATION=%s",
            address(newImpl)
        );
        console.log(
            "2) Run UpgradeInvoiceToken.s.sol with INVOICE_TOKEN_PROXY_ADDRESS set to your existing proxy"
        );

        console.log("\n=== VERIFICATION (example: base-sepolia) ===");
        console.log(
            "forge verify-contract %s src/InvoiceToken.sol:InvoiceTokenVault --chain base-sepolia",
            address(newImpl)
        );
    }
}
