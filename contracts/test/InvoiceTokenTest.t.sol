// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {InvoiceTokenVault} from "../src/InvoiceToken.sol";
import {KYCRegistry} from "../src/KYCRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUSDC is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string public name = "Mock USDC";
    string public symbol = "USDC";
    uint8 public decimals = 6;

    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        _allowances[from][msg.sender] -= amount;
        _balances[from] -= amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract InvoiceTokenTest is Test {
    InvoiceTokenVault public invoiceToken;
    KYCRegistry public kycRegistry;
    MockUSDC public usdc;

    address public admin = address(1);
    address public business = address(2);
    address public investor = address(3);

    function setUp() public {
        vm.startPrank(admin);

        // Deploy Mock USDC
        usdc = new MockUSDC();

        // Deploy KYC Registry with proxy
        KYCRegistry kycImplementation = new KYCRegistry();
        bytes memory kycInitData = abi.encodeWithSelector(
            KYCRegistry.initialize.selector,
            admin
        );
        ERC1967Proxy kycProxy = new ERC1967Proxy(
            address(kycImplementation),
            kycInitData
        );
        kycRegistry = KYCRegistry(address(kycProxy));

        // Deploy Invoice Token with proxy
        InvoiceTokenVault invoiceImplementation = new InvoiceTokenVault();
        bytes memory invoiceInitData = abi.encodeWithSelector(
            InvoiceTokenVault.initialize.selector,
            admin,
            address(usdc),
            address(kycRegistry)
        );
        ERC1967Proxy invoiceProxy = new ERC1967Proxy(
            address(invoiceImplementation),
            invoiceInitData
        );
        invoiceToken = InvoiceTokenVault(address(invoiceProxy));

        vm.stopPrank();

        console.log("=== Setup Complete ===");
        console.log("Admin:", admin);
        console.log("Business:", business);
        console.log("Investor:", investor);
        console.log("KYC Registry:", address(kycRegistry));
        console.log("Invoice Token:", address(invoiceToken));
        console.log("USDC:", address(usdc));
    }

    function testCreateInvoiceWithoutBusinessRegistration() public {
        console.log(
            "\n=== Test 1: Create Invoice WITHOUT Business Registration ==="
        );

        vm.startPrank(business);

        uint256 loanAmount = 90000 * 1e6; // $90,000 with 6 decimals
        uint256 invoiceValue = 100000 * 1e6; // $100,000 with 6 decimals
        uint256 unitValue = 100 * 1e6; // $100 with 6 decimals
        uint256 campaignDuration = 7 days;
        uint256 maturityDate = block.timestamp + 30 days;

        console.log("Loan Amount:", loanAmount);
        console.log("Invoice Value:", invoiceValue);
        console.log("Unit Value:", unitValue);

        // This should FAIL with "User must be a registered business"
        vm.expectRevert("User must be a registered business");
        invoiceToken.createInvoice(
            loanAmount,
            invoiceValue,
            unitValue,
            campaignDuration,
            maturityDate,
            ""
        );

        console.log(
            "RESULT: Reverted as expected with 'User must be a registered business'"
        );

        vm.stopPrank();
    }

    function testCreateInvoiceWithBusinessRegistration() public {
        console.log(
            "\n=== Test 2: Create Invoice WITH Business Registration ==="
        );

        // Register business
        vm.prank(business);
        kycRegistry.registerBusiness();
        console.log("Business registered:", kycRegistry.isBusiness(business));

        vm.startPrank(business);

        uint256 loanAmount = 90000 * 1e6; // $90,000 with 6 decimals
        uint256 invoiceValue = 100000 * 1e6; // $100,000 with 6 decimals
        uint256 unitValue = 100 * 1e6; // $100 with 6 decimals
        uint256 campaignDuration = 7 days;
        uint256 maturityDate = block.timestamp + 30 days;

        console.log("Loan Amount:", loanAmount);
        console.log("Invoice Value:", invoiceValue);
        console.log("Unit Value:", unitValue);
        console.log("Campaign Duration:", campaignDuration);
        console.log("Maturity Date:", maturityDate);

        // This should SUCCEED
        invoiceToken.createInvoice(
            loanAmount,
            invoiceValue,
            unitValue,
            campaignDuration,
            maturityDate,
            ""
        );

        console.log("RESULT: Invoice created successfully!");
        console.log("Token ID: 0");

        vm.stopPrank();
    }

    function testCreateInvoiceWithInvalidUnitValue() public {
        console.log("\n=== Test 3: Create Invoice with Invalid Unit Value ===");

        // Register business
        vm.prank(business);
        kycRegistry.registerBusiness();

        vm.startPrank(business);

        uint256 loanAmount = 90000 * 1e6;
        uint256 invoiceValue = 100000 * 1e6;
        uint256 unitValue = 150 * 1e6; // Invalid: 100000 % 150 != 0
        uint256 campaignDuration = 7 days;
        uint256 maturityDate = block.timestamp + 30 days;

        console.log("Invoice Value:", invoiceValue);
        console.log("Unit Value:", unitValue);
        console.log("Modulo Result:", invoiceValue % unitValue);

        // This should FAIL
        vm.expectRevert("unit value must be a factor of invoice value");
        invoiceToken.createInvoice(
            loanAmount,
            invoiceValue,
            unitValue,
            campaignDuration,
            maturityDate,
            ""
        );

        console.log("RESULT: Reverted as expected");

        vm.stopPrank();
    }

    function testCreateInvoiceWithLoanExceedingValue() public {
        console.log(
            "\n=== Test 4: Create Invoice with Loan > Invoice Value ==="
        );

        // Register business
        vm.prank(business);
        kycRegistry.registerBusiness();

        vm.startPrank(business);

        uint256 loanAmount = 110000 * 1e6; // More than invoice value
        uint256 invoiceValue = 100000 * 1e6;
        uint256 unitValue = 100 * 1e6;
        uint256 campaignDuration = 7 days;
        uint256 maturityDate = block.timestamp + 30 days;

        console.log("Loan Amount:", loanAmount);
        console.log("Invoice Value:", invoiceValue);

        // This should FAIL
        vm.expectRevert(
            "invoice value must be greater than or equal to loan amount"
        );
        invoiceToken.createInvoice(
            loanAmount,
            invoiceValue,
            unitValue,
            campaignDuration,
            maturityDate,
            ""
        );

        console.log("RESULT: Reverted as expected");

        vm.stopPrank();
    }

    function testCreateInvoiceEdgeCases() public {
        console.log("\n=== Test 5: Edge Cases ===");

        // Register business
        vm.prank(business);
        kycRegistry.registerBusiness();

        vm.startPrank(business);

        // Test with zero invoice value
        console.log("\nTesting zero invoice value...");
        vm.expectRevert("Invoice: zero amount");
        invoiceToken.createInvoice(
            0,
            100000 * 1e6,
            100 * 1e6,
            7 days,
            block.timestamp + 30 days,
            ""
        );
        console.log("RESULT: Reverted as expected");

        // Test with very small values
        console.log("\nTesting very small values...");
        uint256 smallLoan = 1 * 1e6; // $1
        uint256 smallInvoice = 10 * 1e6; // $10
        uint256 smallUnit = 1 * 1e6; // $1

        invoiceToken.createInvoice(
            smallLoan,
            smallInvoice,
            smallUnit,
            7 days,
            block.timestamp + 30 days,
            ""
        );
        console.log("RESULT: Small values work!");

        vm.stopPrank();
    }
}
