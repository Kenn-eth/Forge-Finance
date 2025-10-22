// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {InvoiceTokenVault} from "../src/InvoiceToken.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployInvoiceTokenV2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Get contract addresses from environment
        address kycRegistry = vm.envAddress("KYC_REGISTRY_ADDRESS");
        address usdcToken = vm.envAddress("USDC_ADDRESS");

        console.log("=== Deploying InvoiceToken V2 (UUPS Compatible) ===");
        console.log("Deploying with account:", deployer);
        console.log("Account balance:", deployer.balance);
        console.log("KYC Registry address:", kycRegistry);
        console.log("USDC address:", usdcToken);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy InvoiceTokenVault implementation (with UUPS support)
        console.log("\n1. Deploying implementation...");
        InvoiceTokenVault invoiceTokenImpl = new InvoiceTokenVault();
        console.log(
            "   Implementation deployed at:",
            address(invoiceTokenImpl)
        );
        console.log("   Features:");
        console.log("   - UUPS Upgradeable");
        console.log("   - No nonReentrant on createInvoice");
        console.log("   - Returns token ID from createInvoice");

        // 2. Prepare initialization data
        console.log("\n2. Preparing proxy initialization...");
        bytes memory initData = abi.encodeWithSelector(
            InvoiceTokenVault.initialize.selector,
            deployer, // admin
            usdcToken, // USDC token address
            kycRegistry // KYC registry address
        );

        // 3. Deploy ERC1967Proxy
        console.log("\n3. Deploying proxy...");
        ERC1967Proxy invoiceTokenProxy = new ERC1967Proxy(
            address(invoiceTokenImpl),
            initData
        );
        InvoiceTokenVault invoiceToken = InvoiceTokenVault(
            address(invoiceTokenProxy)
        );
        console.log("   Proxy deployed at:", address(invoiceToken));

        // 4. Verify setup
        console.log("\n4. Verifying deployment...");
        bytes32 adminRole = invoiceToken.DEFAULT_ADMIN_ROLE();
        bool isAdmin = invoiceToken.hasRole(adminRole, deployer);
        console.log("   Deployer has admin role:", isAdmin);

        vm.stopBroadcast();

        // Output summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Implementation:", address(invoiceTokenImpl));
        console.log("Proxy (InvoiceToken):", address(invoiceToken));
        console.log("Admin:", deployer);

        console.log("\n=== ENVIRONMENT VARIABLES ===");
        console.log("Add these to your .env files:");
        console.log("");
        console.log("# Frontend (.env)");
        console.log(
            "NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS=%s",
            address(invoiceToken)
        );
        console.log("");
        console.log("# Backend (.env)");
        console.log("INVOICE_TOKEN_CONTRACT_ADDRESS=%s", address(invoiceToken));
        console.log(
            "INVOICE_TOKEN_IMPLEMENTATION=%s",
            address(invoiceTokenImpl)
        );

        console.log("\n=== VERIFICATION COMMANDS ===");
        console.log("Verify Implementation:");
        console.log(
            "forge verify-contract %s src/InvoiceToken.sol:InvoiceTokenVault --chain base-sepolia",
            address(invoiceTokenImpl)
        );
        console.log("");
        console.log("Verify Proxy:");
        console.log(
            'forge verify-contract %s --constructor-args $(cast abi-encode "constructor(address,bytes)" %s 0x%s) lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy --chain base-sepolia',
            address(invoiceTokenProxy),
            address(invoiceTokenImpl),
            _bytesToHex(initData)
        );

        console.log("\n=== NEXT STEPS ===");
        console.log(
            "1. Update frontend/.env with NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS"
        );
        console.log(
            "2. Update backend/.env with INVOICE_TOKEN_CONTRACT_ADDRESS"
        );
        console.log("3. Restart your frontend and backend services");
        console.log("4. Test invoice creation");
        console.log("\n=== IMPORTANT ===");
        console.log(
            "This is a NEW deployment. Old invoices at the previous address"
        );
        console.log("will remain there. This is a fresh start.");
    }

    function _bytesToHex(
        bytes memory data
    ) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory str = new bytes(data.length * 2);
        for (uint256 i = 0; i < data.length; i++) {
            str[i * 2] = hexChars[uint8(data[i] >> 4)];
            str[i * 2 + 1] = hexChars[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}
