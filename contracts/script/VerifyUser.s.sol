// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SimpleKYCRegistry} from "../src/SimpleKYCRegistry.sol";

contract VerifyUser is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("ANVIL_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // KYC Registry address from deployment
        address kycRegistry = 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9;

        console.log("Verifying user with KYC Registry:", kycRegistry);

        vm.startBroadcast(deployerPrivateKey);

        SimpleKYCRegistry registry = SimpleKYCRegistry(kycRegistry);

        // Verify the first user (you can change this address)
        address userToVerify = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Account 1
        bytes32 kycHash = keccak256(
            abi.encodePacked("verified_documents", block.timestamp)
        );

        registry.verifyUser(userToVerify, kycHash);

        console.log("User verified:", userToVerify);
        console.log("KYC Hash:", vm.toString(kycHash));

        vm.stopBroadcast();
    }
}
