// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin-upgradeable/contracts/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin-upgradeable/contracts/utils/PausableUpgradeable.sol";
import {IKYCRegistry} from "./interfaces/IKYCRegistry.sol";

contract KYCRegistry is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    IKYCRegistry
{
    // Storage variables (stored in proxy, persistent across upgrades)
    mapping(address => bool) public registeredBusinesses;
    mapping(address => bool) public registeredInvestors;
    mapping(address => bool) public isKYCVerified;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Modifiers
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, _msgSender()), "Caller is not an admin");
        _;
    }

    // Initializer for proxy
    function initialize(address admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    function registerBusiness() external {
        require(
            !registeredBusinesses[msg.sender],
            "Business already registered"
        );
        registeredBusinesses[msg.sender] = true;
        emit BusinessRegistered(msg.sender);
    }

    function registerInvestor() external {
        require(
            !registeredInvestors[msg.sender],
            "Investor already registered"
        );
        registeredInvestors[msg.sender] = true;
        emit InvestorRegistered(msg.sender);
    }

    function verifyKYC(address user) external {
        /* note for the next version
        require(
            registeredBusinesses[user] || registeredInvestors[user],
            "User must be registered before KYC verification"
        );
        require(
            !isKYCVerified[user],
            "User is already KYC verified"
        );
         */
        isKYCVerified[user] = true;
    }

    function getKYCStatus(address user) external view returns (bool) {
        return isKYCVerified[user];
    }

    function revokeUser(address user) external onlyAdmin {
        registeredBusinesses[user] = false;
        registeredInvestors[user] = false;
        isKYCVerified[user] = false;
    }

    function isBusiness(address user) external view returns (bool) {
        return registeredBusinesses[user];
    }

    function isInvestor(address user) external view returns (bool) {
        return registeredInvestors[user];
    }

    // UUPS authorization
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {
        // Only DEFAULT_ADMIN_ROLE can authorize upgrades
        // The onlyRole modifier already handles the authorization check
    }
}
