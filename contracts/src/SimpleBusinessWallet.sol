// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleBusinessWallet is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // Business information
    string public businessName;
    address public owner;
    bool public isActive;

    // Events
    event BusinessWalletInitialized(address indexed owner, string businessName);
    event FundsReceived(address indexed sender, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event TokenTransferred(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlyActive() {
        require(isActive, "Wallet is not active");
        _;
    }

    // Initializer
    function initialize(
        address _owner,
        string memory _businessName
    ) public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();

        owner = _owner;
        businessName = _businessName;
        isActive = true;

        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        _grantRole(ADMIN_ROLE, _owner);
        _grantRole(OPERATOR_ROLE, _owner);

        emit BusinessWalletInitialized(_owner, _businessName);
    }

    // Receive ETH
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    // Withdraw ETH
    function withdrawETH(
        uint256 amount
    ) external onlyOwner onlyActive nonReentrant {
        require(address(this).balance >= amount, "Insufficient balance");

        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(owner, amount);
    }

    // Transfer ERC20 tokens
    function transferToken(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner onlyActive nonReentrant {
        require(IERC20(token).transfer(to, amount), "Token transfer failed");
        emit TokenTransferred(token, to, amount);
    }

    // Get balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Get token balance
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // UUPS authorization
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
