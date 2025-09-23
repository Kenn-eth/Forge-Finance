// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract Campaign is ERC20 {
    address public owner;
    string public campaignName;
    uint256 public goal;
    uint256 public tokenPrice;
    uint256 public totalTokens;
    uint256 public deadline;
    address public usdcAddress;
    uint256 public totalRaised;
    bool public goalReached;
    bool public finalized;

    mapping(address => uint256) public invested;
    mapping(address => uint256) public claimedRefund;

    // Vesting state (simple linear vesting for demonstration)
    uint256 public vestingStart;
    uint256 public vestingDuration;
    uint256 public vestedAmount;
    uint256 public withdrawn;

    event Invested(
        address indexed investor,
        uint256 amount,
        uint256 tokensMinted
    );
    event Redeemed(
        address indexed investor,
        uint256 tokensBurned,
        uint256 usdcReturned
    );
    event Refunded(address indexed investor, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event GoalReached(uint256 totalRaised);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not campaign owner");
        _;
    }

    constructor(
        address _owner,
        string memory _name,
        uint256 _goal,
        uint256 _tokenPrice,
        uint256 _totalTokens,
        uint256 _deadline,
        address _usdcAddress
    ) ERC20(_name, "CMPGN") {
        owner = _owner;
        campaignName = _name;
        goal = _goal;
        tokenPrice = _tokenPrice;
        totalTokens = _totalTokens;
        deadline = _deadline;
        usdcAddress = _usdcAddress;
        _mint(address(this), _totalTokens); // Mint all tokens to contract for distribution
    }

    function invest(uint256 usdcAmount) external {
        require(block.timestamp < deadline, "Campaign ended");
        require(usdcAmount > 0, "Zero amount");
        require(totalRaised + usdcAmount <= goal, "Exceeds goal");
        uint256 tokensToMint = (usdcAmount * 1e18) / tokenPrice;
        require(
            balanceOf(address(this)) >= tokensToMint,
            "Not enough tokens left"
        );
        IERC20(usdcAddress).transferFrom(msg.sender, address(this), usdcAmount);
        _transfer(address(this), msg.sender, tokensToMint);
        invested[msg.sender] += usdcAmount;
        totalRaised += usdcAmount;
        emit Invested(msg.sender, usdcAmount, tokensToMint);
        if (totalRaised >= goal && !goalReached) {
            goalReached = true;
            vestingStart = block.timestamp;
            emit GoalReached(totalRaised);
        }
    }

    function redeem(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Zero amount");
        uint256 usdcToReturn = (tokenAmount * tokenPrice) / 1e18;
        require(
            IERC20(usdcAddress).balanceOf(address(this)) >= usdcToReturn,
            "Insufficient USDC in contract"
        );
        _transfer(msg.sender, address(this), tokenAmount);
        IERC20(usdcAddress).transfer(msg.sender, usdcToReturn);
        emit Redeemed(msg.sender, tokenAmount, usdcToReturn);
    }

    function refund() external {
        require(block.timestamp >= deadline, "Campaign not ended");
        require(!goalReached, "Goal was reached");
        uint256 amount = invested[msg.sender];
        require(amount > 0, "No investment");
        require(claimedRefund[msg.sender] == 0, "Already refunded");
        claimedRefund[msg.sender] = amount;
        IERC20(usdcAddress).transfer(msg.sender, amount);
        _transfer(msg.sender, address(this), balanceOf(msg.sender)); // Return tokens
        emit Refunded(msg.sender, amount);
    }

    function withdrawVested() external onlyOwner {
        require(goalReached, "Goal not reached");
        require(block.timestamp >= vestingStart, "Vesting not started");
        // Simple linear vesting: all funds available after vestingDuration
        uint256 available = vestedAmountToDate() - withdrawn;
        require(available > 0, "Nothing to withdraw");
        withdrawn += available;
        IERC20(usdcAddress).transfer(owner, available);
        emit FundsWithdrawn(owner, available);
    }

    function vestedAmountToDate() public view returns (uint256) {
        if (!goalReached) return 0;
        if (block.timestamp >= vestingStart + vestingDuration) {
            return totalRaised;
        } else {
            return
                (totalRaised * (block.timestamp - vestingStart)) /
                vestingDuration;
        }
    }

    // Owner can finalize campaign and set vesting duration (once)
    function finalize(uint256 _vestingDuration) external onlyOwner {
        require(goalReached, "Goal not reached");
        require(!finalized, "Already finalized");
        vestingDuration = _vestingDuration;
        finalized = true;
    }
}
