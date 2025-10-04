// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "../lib/openzeppelin-contracts-upgradeable/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "../lib/openzeppelin-contracts-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "../lib/openzeppelin-contracts-upgradeable/contracts/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "../lib/openzeppelin-contracts-upgradeable/contracts/utils/PausableUpgradeable.sol";
import {IKYCRegistry} from "./interfaces/IKYCRegistry.sol";

contract KYCRegistry is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    IKYCRegistry
{
    mapping(address => UserInfo) private users;
    mapping(Role => address[]) private usersByRole;
    mapping(address => bool) private globalWhitelist;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant KYC_AUTHORITY_ROLE =
        keccak256("KYC_AUTHORITY_ROLE");

    address private _kycAuthority;

    // Initializer for proxy
    function initialize(
        address admin,
        address kycAuthority
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(KYC_AUTHORITY_ROLE, kycAuthority);
        _kycAuthority = kycAuthority;
    }

    // UUPS authorization
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // ... (interface function implementations to be added)
}
