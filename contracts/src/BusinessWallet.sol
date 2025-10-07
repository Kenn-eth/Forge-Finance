// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BusinessWallet
 * @notice UUPS upgradeable smart wallet for businesses with multisig support
 * @dev Designed for invoice tokenization, marketplace integration, and secure fund management
 *
 * Key Features:
 * - UUPS upgradeable with admin-controlled upgrades
 * - Multisig support for enhanced security
 * - Invoice token minting integration
 * - Marketplace listing capabilities
 * - KYC verification integration
 * - ETH and ERC20 token handling
 * - Batch operations support
 */
/// question, why did you settle for UUPS, I thought beacon proxy is more suitable
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "./interfaces/IKYCRegistry.sol";
import "./interfaces/IInvoiceTokenFactory.sol";
import "./interfaces/IMarketplace.sol";

/**
 * @title BusinessWallet
 * @dev Upgradeable smart wallet for businesses with multisig capabilities
 */
contract BusinessWallet is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /* ============================
       ROLES & CONSTANTS
       ============================ */

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /* ============================
       EVENTS
       ============================ */

    event WalletInitialized(address indexed owner);
    event PaymentSent(
        address indexed to,
        address indexed token,
        uint256 amount,
        bytes data
    );
    event PaymentReceived(
        address indexed from,
        address indexed token,
        uint256 amount
    );
    event MultisigSetup(address[] signers, uint256 threshold);
    event InvoiceMinted(
        address indexed tokenAddress,
        bytes metadataCid,
        uint256 amount
    );
    event MarketplaceListed(
        address indexed token,
        uint256 tokenId,
        uint256 price
    );
    event FactoryUpdated(address indexed factory);
    event MarketplaceUpdated(address indexed marketplace);

    /* ============================
       STORAGE
       ============================ */

    // Core addresses
    address public owner; // Initial owner/admin
    address public kycRegistry; // KYC verification contract
    address public invoiceFactory; // Invoice token factory
    address public marketplace; // Marketplace contract
    address public CNGN; // CNGN token address

    // Multisig configuration
    address[] public multisigSigners; // Approved signers
    uint256 public multisigThreshold; // Required signatures
    bool public multisigEnabled; // Whether multisig is active

    // Transaction tracking
    mapping(bytes32 => bool) public executedTx; // txHash => executed
    uint256 public nonce; // Nonce for transaction ordering

    // Storage gap for upgrade safety
    uint256[40] private __gap;

    /* ============================
       INITIALIZATION
       ============================ */

    /// @notice Initialize the business wallet
    /// @param _owner Initial owner/admin address
    function initialize(address _owner) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        require(_owner != address(0), "BusinessWallet: owner cannot be zero");

        owner = _owner;
        multisigEnabled = false;

        // Grant admin role to owner
        _grantRole(ADMIN_ROLE, _owner);

        emit WalletInitialized(_owner);
    }

    /* ============================
       ACCESS CONTROL
       ============================ */

    modifier onlyOwnerOrOperator() {
        require(
            msg.sender == owner || hasRole(OPERATOR_ROLE, msg.sender),
            "BusinessWallet: not owner or operator"
        );
        _;
    }

    modifier onlyOwnerOrMultisig() {
        require(
            msg.sender == owner ||
                (multisigEnabled && hasRole(ADMIN_ROLE, msg.sender)),
            "BusinessWallet: not authorized"
        );
        _;
    }

    /* ============================
       MULTISIG MANAGEMENT
       ============================ */

    /// @notice Setup multisig with signers and threshold
    /// @param signers Array of signer addresses
    /// @param threshold Minimum signatures required
    function setupMultisig(
        address[] calldata signers,
        uint256 threshold
    ) external onlyRole(ADMIN_ROLE) {
        require(
            signers.length >= threshold && threshold >= 1,
            "BusinessWallet: invalid multisig params"
        );
        require(!multisigEnabled, "BusinessWallet: multisig already enabled");

        // Clear existing signers
        delete multisigSigners;

        // Add new signers
        for (uint256 i = 0; i < signers.length; i++) {
            require(
                signers[i] != address(0),
                "BusinessWallet: zero signer address"
            );
            multisigSigners.push(signers[i]);
            _grantRole(ADMIN_ROLE, signers[i]);
        }

        multisigThreshold = threshold;
        multisigEnabled = true;

        emit MultisigSetup(signers, threshold);
    }

    /// @notice Disable multisig (emergency function)
    function disableMultisig() external onlyRole(ADMIN_ROLE) {
        require(multisigEnabled, "BusinessWallet: multisig not enabled");

        // Revoke admin roles from signers
        for (uint256 i = 0; i < multisigSigners.length; i++) {
            _revokeRole(ADMIN_ROLE, multisigSigners[i]);
        }

        delete multisigSigners;
        multisigThreshold = 0;
        multisigEnabled = false;
    }

    /* ============================
       CORE EXECUTION
       ============================ */

    /// @notice Execute a transaction (ETH or contract call)
    /// @param to Target address
    /// @param value ETH amount to send
    /// @param data Call data
    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) external onlyOwnerOrMultisig nonReentrant returns (bytes memory) {
        require(to != address(0), "BusinessWallet: target cannot be zero");

        // KYC check removed - businesses can send to any address

        (bool success, bytes memory returnData) = to.call{value: value}(data);
        require(success, "BusinessWallet: execution failed");

        emit PaymentSent(to, address(0), value, data);
        return returnData;
    }

    /// @notice Transfer ERC20 tokens
    /// @param token Token contract address
    /// @param to Recipient address
    /// @param amount Amount to transfer
    function transferToken(
        address token,
        address to,
        uint256 amount
    ) external onlyOwnerOrMultisig nonReentrant {
        require(token != address(0), "BusinessWallet: token cannot be zero");
        require(to != address(0), "BusinessWallet: recipient cannot be zero");

        // KYC check removed - businesses can send tokens to any address

        IERC20Upgradeable(token).safeTransfer(to, amount);
        emit PaymentSent(to, token, amount, "");
    }

    /// @notice Batch execute multiple transactions
    /// @param targets Array of target addresses
    /// @param values Array of ETH amounts
    /// @param datas Array of call data
    function batchExecute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external onlyOwnerOrMultisig nonReentrant {
        require(
            targets.length == values.length && targets.length == datas.length,
            "BusinessWallet: array length mismatch"
        );

        for (uint256 i = 0; i < targets.length; i++) {
            execute(targets[i], values[i], datas[i]);
        }
    }

    /* ============================
       INVOICE INTEGRATION
       ============================ */

    /// @notice Mint an invoice token (requires KYC verification)
    /// @param metadataCid IPFS CID for invoice metadata
    /// @param amount Invoice amount
    /// @return tokenAddress Address of the minted invoice token
    function mintInvoice(
        bytes calldata metadataCid,
        uint256 amount
    ) external onlyOwnerOrMultisig returns (address tokenAddress) {
        require(
            invoiceFactory != address(0),
            "BusinessWallet: invoice factory not set"
        );

        // KYC is required for invoice tokenization
        require(
            kycRegistry != address(0),
            "BusinessWallet: KYC registry not set"
        );
        require(
            IKYCRegistry(kycRegistry).isVerified(owner),
            "BusinessWallet: business not KYC verified"
        );

        tokenAddress = IInvoiceTokenFactory(invoiceFactory).mintInvoice(
            metadataCid,
            address(this),
            amount
        );

        emit InvoiceMinted(tokenAddress, metadataCid, amount);
        return tokenAddress;
    }

    /// @notice List an invoice token on marketplace
    /// @param token Invoice token address
    /// @param tokenId Token ID to list
    /// @param price Listing price
    function listOnMarketplace(
        address token,
        uint256 tokenId,
        uint256 price
    ) external onlyOwnerOrMultisig {
        require(
            marketplace != address(0),
            "BusinessWallet: marketplace not set"
        );

        IMarketplace(marketplace).createListing(token, tokenId, price);
        emit MarketplaceListed(token, tokenId, price);
    }

    /* ============================
       ADMIN FUNCTIONS
       ============================ */

    /// @notice Set invoice factory address
    /// @param _factory New factory address
    function setInvoiceFactory(address _factory) external onlyRole(ADMIN_ROLE) {
        invoiceFactory = _factory;
        emit FactoryUpdated(_factory);
    }

    /// @notice Set marketplace address
    /// @param _marketplace New marketplace address
    function setMarketplace(
        address _marketplace
    ) external onlyRole(ADMIN_ROLE) {
        marketplace = _marketplace;
        emit MarketplaceUpdated(_marketplace);
    }

    /// @notice Set KYC registry address
    /// @param _kyc New KYC registry address
    function setKYCRegistry(address _kyc) external onlyRole(ADMIN_ROLE) {
        kycRegistry = _kyc;
    }

    /// @notice Set CNGN token address
    /// @param _cngn New CNGN token address
    function setCNGN(address _cngn) external onlyRole(ADMIN_ROLE) {
        CNGN = _cngn;
    }

    /// @notice Grant operator role
    /// @param account Account to grant role to
    function grantOperatorRole(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(OPERATOR_ROLE, account);
    }

    /// @notice Revoke operator role
    /// @param account Account to revoke role from
    function revokeOperatorRole(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(OPERATOR_ROLE, account);
    }

    /* ============================
       VIEW FUNCTIONS
       ============================ */

    /// @notice Get all multisig signers
    function getMultisigSigners() external view returns (address[] memory) {
        return multisigSigners;
    }

    /// @notice Get multisig configuration
    function getMultisigConfig()
        external
        view
        returns (address[] memory signers, uint256 threshold, bool enabled)
    {
        return (multisigSigners, multisigThreshold, multisigEnabled);
    }

    /// @notice Get wallet configuration
    function getWalletConfig()
        external
        view
        returns (
            address _owner,
            address _kycRegistry,
            address _invoiceFactory,
            address _marketplace,
            address _cngn
        )
    {
        return (owner, kycRegistry, invoiceFactory, marketplace, CNGN);
    }

    /// @notice Check if the business is KYC verified
    function isKYCVerified() external view returns (bool) {
        if (kycRegistry == address(0)) return false;
        return IKYCRegistry(kycRegistry).isVerified(owner);
    }

    /* ============================
       RECEIVE & UUPS
       ============================ */

    /// @notice Receive ETH
    receive() external payable {
        emit PaymentReceived(msg.sender, address(0), msg.value);
    }

    /// @notice Authorize upgrades (only admin)
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(ADMIN_ROLE) {}

    /* note for @TopBoy
     * Why use UUPS for this contract, is it better than beacon proxy?
     * This contract should be able to send erc1155 tokens (make it erc-1155 compatible)
     * This contract should be able to send nfts
     * KIV there should have a mapping to see balance of tokens (erc20, erc1155, nft) in the wallet. note, might be done on the frontend
     */
}
