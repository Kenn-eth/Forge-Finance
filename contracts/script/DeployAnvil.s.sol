// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SimpleKYCRegistry} from "../src/SimpleKYCRegistry.sol";
import {SimpleBusinessWallet} from "../src/SimpleBusinessWallet.sol";
import {BusinessWalletFactory} from "../src/BusinessWalletFactory.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployAnvil is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("ANVIL_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy SimpleBusinessWallet implementation
        SimpleBusinessWallet businessWalletImpl = new SimpleBusinessWallet();
        console.log(
            "SimpleBusinessWallet implementation deployed at:",
            address(businessWalletImpl)
        );

        // 2. Deploy BusinessWalletFactory
        BusinessWalletFactory factory = new BusinessWalletFactory(
            address(businessWalletImpl)
        );
        console.log("BusinessWalletFactory deployed at:", address(factory));

        // 3. Deploy SimpleKYCRegistry implementation
        SimpleKYCRegistry kycImpl = new SimpleKYCRegistry();
        console.log(
            "SimpleKYCRegistry implementation deployed at:",
            address(kycImpl)
        );

        // 4. Deploy SimpleKYCRegistry proxy
        bytes memory initData = abi.encodeWithSelector(
            SimpleKYCRegistry.initialize.selector,
            deployer, // admin
            deployer, // kycAuthority (same as admin for testing)
            address(factory) // businessWalletFactory
        );

        ERC1967Proxy kycProxy = new ERC1967Proxy(address(kycImpl), initData);
        SimpleKYCRegistry kycRegistry = SimpleKYCRegistry(address(kycProxy));
        console.log(
            "SimpleKYCRegistry proxy deployed at:",
            address(kycRegistry)
        );

        vm.stopBroadcast();

        // Output the addresses for frontend configuration
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log(
            "BusinessWallet Implementation:",
            address(businessWalletImpl)
        );
        console.log("BusinessWalletFactory:", address(factory));
        console.log("KYCRegistry Implementation:", address(kycImpl));
        console.log("KYCRegistry Proxy:", address(kycRegistry));
        console.log("\n=== FRONTEND CONFIG ===");
        console.log("NEXT_PUBLIC_KYC_CONTRACT_ADDRESS=", address(kycRegistry));
        console.log(
            "NEXT_PUBLIC_BUSINESS_WALLET_FACTORY_ADDRESS=",
            address(factory)
        );
    }
}
