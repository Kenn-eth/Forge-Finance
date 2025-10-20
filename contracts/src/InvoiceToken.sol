// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155Upgradeable} from "@openzeppelin-upgradeable/contracts/token/ERC1155/ERC1155Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin-upgradeable/contracts/access/AccessControlUpgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC1155BurnableUpgradeable} from "@openzeppelin-upgradeable/contracts/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin-upgradeable/contracts/utils/ReentrancyGuardUpgradeable.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IKYCRegistry} from "./interfaces/IKYCRegistry.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ITransferHook1155 {
    function onERC1155Transfer(
        address operator,
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external view returns (bool);
}

interface IUSDC is IERC20 {
    function decimals() external view returns (uint8);
}

contract InvoiceTokenVault is
    ERC1155Upgradeable,
    AccessControlUpgradeable,
    ERC1155BurnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IERC1155Receiver
{
    IKYCRegistry KYCRegistry;
    using Strings for uint256;

    event TransferHookSet(
        address indexed oldHook,
        address indexed newHook,
        address indexed setter
    );
    event InvoiceMinted(
        address indexed createdBy,
        uint256 indexed id,
        uint256 amount,
        string metadataURI
    );
    event InvoiceWithdrawn(
        address indexed createdBy,
        uint256 indexed id,
        uint256 amount
    );
    event InvoiceTokensBought(
        address indexed buyer,
        uint256 indexed id,
        uint256 quantity
    );
    event InvoiceFullfilled(
        address indexed createdBy,
        uint256 indexed id,
        uint256 amount
    );
    event InvoiceProfitClaimed(
        address indexed claimer,
        uint256 indexed id,
        uint256 amount
    );
    event InvoiceBurned(
        address indexed from,
        uint256 indexed id,
        uint256 amount
    );

    struct InvoiceDetails {
        uint256 loanAmount;
        uint256 invoiceValue;
        uint256 unitValue;
        uint256 createdAt;
        address createdBy;
        uint256 campaignDuration;
        uint256 campaignEndTime;
        uint256 maturityDate;
        uint256 tokenSupply;
        uint256 availableSupply;
        bool isFulfilled; /// whether the invoice has been paid off by business
        bytes data;
    }

    IUSDC public usdc;
    uint256 public nonce;
    mapping(uint256 => address) public idToOwner;
    mapping(address => uint256[]) public ownerToIds;
    mapping(uint256 => InvoiceDetails) public idToInvoiceDetails;
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant HOOK_ADMIN_ROLE = keccak256("HOOK_ADMIN_ROLE");

    ITransferHook1155 public transferHook;

    using SafeERC20 for IUSDC;

    /// @dev Upgradeable initializer
    function initialize(
        address admin,
        address _usdc,
        address kyc
    ) public initializer {
        usdc = IUSDC(_usdc);
        __ERC1155_init("");
        __AccessControl_init();
        // ERC1155Burnable doesn't need initialization
        __ReentrancyGuard_init();
        KYCRegistry = IKYCRegistry(kyc);
        _grantRole(DEFAULT_ADMIN_ROLE, admin); // makes admin the top-level role
        _grantRole(BURNER_ROLE, admin);
        _grantRole(HOOK_ADMIN_ROLE, admin);
    }

    function setTransferHook(address hook) external onlyRole(HOOK_ADMIN_ROLE) {
        require(hook != address(0), "InvoiceToken1155: zero address");
        address oldHook = address(transferHook);
        transferHook = ITransferHook1155(hook);
        emit TransferHookSet(oldHook, hook, msg.sender);
    }

    /// an invoice token is minted by business owners to obtain loan from investors using a yet-to-be-paid invoice as collateral
    /// therefore the metadata have to contain the actual value of the invoice, loan amount needed, and the due date of the invoice
    function createInvoice(
        uint256 loanAmount,
        uint256 invoiceValue,
        uint256 unitValue,
        uint256 campaignDuration,
        uint256 maturityDate,
        bytes memory data
    ) external nonReentrant {
        /// @audit this fn should return a value
        require(invoiceValue > 0, "Invoice: zero amount");
        require(
            KYCRegistry.isBusiness(msg.sender),
            "User must be a registered business"
        );
        require(
            invoiceValue % unitValue == 0,
            "unit value must be a factor of invoice value"
        );
        require(
            invoiceValue >= loanAmount,
            "invoice value must be greater than or equal to loan amount"
        );
        require(
            (loanAmount > 0) && (unitValue > 0) && (invoiceValue > 0),
            "must be non-zero values"
        );

        uint256 totalSupply = invoiceValue / unitValue;

        // Create invoice details struct
        InvoiceDetails memory invoiceDetails = InvoiceDetails({
            loanAmount: loanAmount,
            invoiceValue: invoiceValue,
            unitValue: unitValue,
            createdAt: block.timestamp,
            createdBy: msg.sender,
            campaignDuration: campaignDuration,
            campaignEndTime: campaignDuration + block.timestamp,
            maturityDate: maturityDate,
            tokenSupply: totalSupply,
            availableSupply: totalSupply,
            isFulfilled: false,
            data: data
        });

        // Store invoice details
        idToInvoiceDetails[nonce] = invoiceDetails;

        _mint(address(this), nonce, totalSupply, data);
        idToOwner[nonce] = msg.sender;
        ownerToIds[msg.sender].push(nonce);
        nonce++;

        emit InvoiceMinted(msg.sender, nonce - 1, totalSupply, "");
    }

    function withdrawInvoiceLoan(uint256 id) external {
        require(
            idToInvoiceDetails[id].campaignEndTime <= block.timestamp,
            "campaign duration not over"
        );
        require(
            idToInvoiceDetails[id].createdBy == msg.sender,
            "not the creator of the invoice"
        );
        require(
            idToInvoiceDetails[id].availableSupply == 0,
            "invoice not yet bought up"
        );
        usdc.safeTransfer(
            idToInvoiceDetails[id].createdBy,
            idToInvoiceDetails[id].loanAmount
        );

        emit InvoiceWithdrawn(
            idToInvoiceDetails[id].createdBy,
            id,
            idToInvoiceDetails[id].loanAmount
        );
    }

    function buyInvoiceTokens(uint256 id, uint256 quantity) external {
        require(
            idToInvoiceDetails[id].campaignEndTime >= block.timestamp,
            "campaign duration over"
        );
        require(quantity > 0, "quantity must be greater than 0");
        require(
            idToInvoiceDetails[id].availableSupply >= quantity,
            "not enough available supply"
        );

        uint256 amountToPay = (quantity * idToInvoiceDetails[id].loanAmount) /
            idToInvoiceDetails[id].tokenSupply; /// @audit-issue there could be a risk of rounding errors
        usdc.safeTransferFrom(msg.sender, address(this), amountToPay); /// @audit amount paid to buy token should be based on the loan amount not the invoice value

        safeTransferFrom(address(this), msg.sender, id, quantity, "");
        idToInvoiceDetails[id].availableSupply -= quantity;
        emit InvoiceTokensBought(msg.sender, id, quantity);
    }

    function fulfillInvoice(uint256 id) external {
        require(
            idToInvoiceDetails[id].isFulfilled == false,
            "invoice already fulfilled"
        );
        require(
            idToInvoiceDetails[id].availableSupply == 0,
            "invoice not yet bought up"
        );
        usdc.safeTransferFrom(
            msg.sender,
            address(this),
            idToInvoiceDetails[id].invoiceValue
        );
        idToInvoiceDetails[id].isFulfilled = true;
        emit InvoiceFullfilled(
            idToInvoiceDetails[id].createdBy,
            id,
            idToInvoiceDetails[id].invoiceValue
        );
    }

    function claimProfitFromMaturedInvoice(
        uint256 id,
        uint256 quantity
    ) external {
        require(
            idToInvoiceDetails[id].isFulfilled == true,
            "invoice not fulfilled"
        );
        require(balanceOf(msg.sender, id) >= quantity, "not enough tokens");

        uint256 amountToClaim = quantity * idToInvoiceDetails[id].unitValue;
        _burn(msg.sender, id, quantity);
        usdc.safeTransfer(msg.sender, amountToClaim);
        emit InvoiceProfitClaimed(msg.sender, id, amountToClaim);
    }

    /// user flow
    /**
     * Business creates invoice token stating required loan amount and value of the invoice;
     the quantity minted depends on the value of the invoice and the required loan amount
     * Investors provides a fraction of the required loan amount and a proportional qnty of the 1155 tokens are sent to them
     * 
     * 
     */
    function getInvoiceOwner(uint256 id) external view returns (address) {
        return idToOwner[id];
    }

    /**
     * @dev Handles the receipt of a single ERC-1155 token type.
     * @return bytes4 The function selector for onERC1155Received
     */
    function onERC1155Received(
        address, // operator
        address, // from
        uint256, // id
        uint256, // value
        bytes calldata // data
    ) external pure override returns (bytes4) {
        // You can add custom logic here if needed
        // For now, we accept all transfers
        return this.onERC1155Received.selector;
    }

    /**
     * @dev Handles the receipt of multiple ERC-1155 token types.
     * @return bytes4 The function selector for onERC1155BatchReceived
     */
    function onERC1155BatchReceived(
        address, // operator
        address, // from
        uint256[] calldata, // ids
        uint256[] calldata, // values
        bytes calldata // data
    ) external pure override returns (bytes4) {
        // You can add custom logic here if needed
        // For now, we accept all batch transfers
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable, IERC165)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
