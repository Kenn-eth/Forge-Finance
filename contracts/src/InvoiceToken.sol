// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";

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
    using Strings for uint256;
// 1️⃣ Events
    event TransferHookSet(address indexed oldHook, address indexed newHook, address indexed setter);
    event InvoiceMinted(address indexed to, uint256 indexed id, uint256 amount, string metadataURI);
    event InvoiceBurned(address indexed from, uint256 indexed id, uint256 amount);
// 2️⃣ Roles and State 

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant HOOK_ADMIN_ROLE = keccak256("HOOK_ADMIN_ROLE");

    ITransferHook1155 public transferHook;

// 3️⃣ Constructor
    constructor(string memory baseURI, address admin) ERC1155(baseURI) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin); // makes admin the top-level role
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        _grantRole(HOOK_ADMIN_ROLE, admin);
        }

// 6️⃣ Internal / Private Functions  
    function setTransferHook(address hook) external onlyRole(HOOK_ADMIN_ROLE) {
        require(hook != address(0), "InvoiceToken1155: zero address");
        address oldHook = address(transferHook);
        transferHook = ITransferHook1155(hook);
        emit TransferHookSet(oldHook, hook, msg.sender);
    }

    function mintInvoice(
        address to,
        uint256 id,
        uint256 amount,
        string memory metadataURI,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) {
        require(amount > 0, "Invoice: zero amount");
        // _mint will revert if to == address(0)
        _mint(to, id, amount, data);
        emit InvoiceMinted(to, id, amount, metadataURI);
    }

    function burnInvoice(address from, uint256 id, uint256 amount)
    external
    onlyRole(BURNER_ROLE)
{
    require(amount > 0, "Invoice: zero burn amount");
    _burn(from, id, amount);
    emit InvoiceBurned(from, id, amount);
}


// 7️⃣ Overrides (like _beforeTokenTransfer)
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