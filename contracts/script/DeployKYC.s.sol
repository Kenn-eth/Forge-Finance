// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {KYCRegistry} from "../src/KYCRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployKYC is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying KYC contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy KYCRegistry implementation (logic only)
        KYCRegistry kycImpl = new KYCRegistry();
        console.log(
            "KYCRegistry implementation deployed at:",
            address(kycImpl)
        );

        // 2. Deploy KYCRegistry proxy
        bytes memory initData = abi.encodeWithSelector(
            KYCRegistry.initialize.selector,
            deployer // admin
        );

        ERC1967Proxy kycProxy = new ERC1967Proxy(address(kycImpl), initData); /// deploys new proxy
        KYCRegistry kycRegistry = KYCRegistry(address(kycProxy));
        console.log("KYCRegistry proxy deployed at:", address(kycRegistry));

        vm.stopBroadcast();

        // Output the addresses for configuration
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("KYCRegistry Implementation:", address(kycImpl));
        console.log("KYCRegistry Proxy:", address(kycRegistry));
        console.log("\n=== ENVIRONMENT VARIABLES ===");
        console.log("KYC_REGISTRY_ADDRESS=", address(kycRegistry));
        console.log(
            "NEXT_PUBLIC_KYC_REGISTRY_CONTRACT_ADDRESS=",
            address(kycRegistry)
        );
        console.log("\n=== VERIFICATION COMMANDS ===");
        console.log("forge verify-contract", address(kycImpl), "KYCRegistry");
        console.log("forge verify-contract", address(kycProxy), "ERC1967Proxy");
    }
}
