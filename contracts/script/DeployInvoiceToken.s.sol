// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {InvoiceTokenVault} from "../src/InvoiceToken.sol";
import {KYCRegistry} from "../src/KYCRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployInvoiceToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Get contract addresses from environment
        address kycRegistry = vm.envAddress("KYC_REGISTRY_ADDRESS");
        address usdcToken = vm.envAddress("USDC_ADDRESS");

        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        console.log("KYC Registry address:", kycRegistry);
        console.log("USDC address:", usdcToken);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy InvoiceTokenVault implementation
        InvoiceTokenVault invoiceTokenImpl = new InvoiceTokenVault();
        console.log(
            "InvoiceTokenVault implementation deployed at:",
            address(invoiceTokenImpl)
        );

        // 2. Deploy InvoiceTokenVault proxy
        bytes memory initData = abi.encodeWithSelector(
            InvoiceTokenVault.initialize.selector,
            "", // baseURI (empty - will use token ID only)
            deployer, // admin
            usdcToken, // USDC token address
            kycRegistry // KYC registry address
        );

        ERC1967Proxy invoiceTokenProxy = new ERC1967Proxy(
            address(invoiceTokenImpl),
            initData
        );
        InvoiceTokenVault invoiceToken = InvoiceTokenVault(
            address(invoiceTokenProxy)
        );
        console.log(
            "InvoiceTokenVault proxy deployed at:",
            address(invoiceToken)
        );

        vm.stopBroadcast();

        // Output the addresses for configuration
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log(
            "InvoiceTokenVault Implementation:",
            address(invoiceTokenImpl)
        );
        console.log("InvoiceTokenVault Proxy:", address(invoiceToken));
        console.log("\n=== ENVIRONMENT VARIABLES ===");
        console.log(
            "NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS=",
            address(invoiceToken)
        );
        console.log("INVOICE_TOKEN_CONTRACT_ADDRESS=", address(invoiceToken));
        console.log("\n=== VERIFICATION COMMANDS ===");
        console.log(
            "forge verify-contract",
            address(invoiceTokenImpl),
            "InvoiceTokenVault"
        );
        console.log(
            "forge verify-contract",
            address(invoiceToken),
            "ERC1967Proxy"
        );
    }
}
