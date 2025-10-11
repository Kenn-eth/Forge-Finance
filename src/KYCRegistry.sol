// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "../lib/openzeppelin-contracts-upgradeable/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "../lib/openzeppelin-contracts-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "../lib/openzeppelin-contracts-upgradeable/contracts/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "../lib/openzeppelin-contracts-upgradeable/contracts/utils/PausableUpgradeable.sol";
import {IKYCRegistry} from "./interfaces/IKYCRegistry.sol";
import {IBusinessWalletFactory} from "./interfaces/IBusinessWalletFactory.sol";
import {IBusinessWallet} from "./interfaces/IBusinessWallet.sol";
import {Role, Tier, User} from "./interfaces/IKYCRegistry.sol";

contract KYCRegistry is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    IKYCRegistry
{
    mapping(address => User) private users;
    mapping(Role => address[]) private usersByRole;
    mapping(address => bool) private globalWhitelist;

    mapping(address => bool) private userWallets;
    mapping(address => bool) private investorWallets;
    mapping(address => bool) private businessWallets;
    mapping(address => bool) isKYCVerified;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant KYC_AUTHORITY_ROLE =
        keccak256("KYC_AUTHORITY_ROLE");

    address private _kycAuthority;
    IBusinessWalletFactory private _businessWalletFactory;

    // Initializer for proxy
    function initialize(
        address admin,
        address kycAuthority,
        address businessWalletFactory
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(KYC_AUTHORITY_ROLE, kycAuthority);
        _kycAuthority = kycAuthority;
        _businessWalletFactory = IBusinessWalletFactory(businessWalletFactory);
    }

    function registerUser(Role role) external returns (address userAddress) {
        /// note: users can register multiple businesses but can register once as investor. KIV refactor this fn as such
        require(users[msg.sender].role == Role.None, "Already registered");
        userAddress = _businessWalletFactory.createWallet(
            docHash,
            abi.encode(businessInfo)
        );

        if (role == Role.INVESTOR) {
            investorWallets[userAddress] = true;
        } else if (role == Role.BUSINESS) {
            businessWallets[userAddress] = true;
        } else {
            revert("Invalid role");
        }
        users[msg.sender] = User(role, false, 0);
    }

    function verifyUser(address user, bytes32 kycHash) external onlyAdmin {
        require(users[user].role != Role.None, "Not registered");
        users[user].verified = true;
        users[user].kycHash = kycHash;
    }

    function isVerified(address user) external view returns (bool) {
        return users[user].verified;
    }

    // UUPS authorization
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // ... (interface function implementations to be added)
}
