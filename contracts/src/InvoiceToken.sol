// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {IKYCRegistry} from "./interfaces/IKYCRegistry.sol";

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

contract InvoiceToken1155 is ERC1155, AccessControl, ERC1155Burnable {

    IKYCRegistry KYCRegistry;
    using Strings for uint256;

    event TransferHookSet(address indexed oldHook, address indexed newHook, address indexed setter);
    event InvoiceMinted(address indexed to, uint256 indexed id, uint256 amount, string metadataURI);
    event InvoiceBurned(address indexed from, uint256 indexed id, uint256 amount);


    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant HOOK_ADMIN_ROLE = keccak256("HOOK_ADMIN_ROLE");

    ITransferHook1155 public transferHook;


    constructor(string memory baseURI, address admin, address kyc) ERC1155(baseURI) {
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
    function mintInvoice(
        address to,
        uint256 id,
        uint256 amount,
        string memory metadataURI,
        bytes memory data
    ) external {
        require(amount > 0, "Invoice: zero amount");
        require(KYCRegistry.verifiedBusiness(msg.sender));
        // _mint will revert if to == address(0)
        _mint(to, id, amount, data);
        emit InvoiceMinted(to, id, amount, metadataURI);
    }

    function burnInvoice(address from, uint256 id, uint256 amount)
    external onlyRole(BURNER_ROLE) {
        require(amount > 0, "Invoice: zero burn amount");
        _burn(from, id, amount);
        emit InvoiceBurned(from, id, amount);
    }

    /// user flow
    /**
     * Business creates invoice token stating required loan amount and value of the invoice;
     the quantity minted depends on the value of the invoice and the required loan amount
     * Investors provides a fraction of the required loan amount and a proportional qnty of the 1155 tokens are sent to them
     * 
     * 
     */


    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        // Always call parent hook first (important)
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        // If a transferHook contract has been set, call it before allowing transfer
        if (address(transferHook) != address(0)) {
            bool allowed = transferHook.onERC1155Transfer(operator, from, to, ids, amounts, data);
            require(allowed, "InvoiceToken: transfer blocked by hook");
        }
    }


}