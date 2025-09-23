// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Campaign.sol";

contract CampaignFactory {
    // Event emitted when a new campaign is created
    event CampaignCreated(
        address indexed owner,
        address campaign,
        string name,
        uint256 timestamp
    );

    // Array to keep track of all deployed campaigns
    address[] public campaigns;

    // Function to create a new campaign (implementation to be added)
    function createCampaign(
        string memory name,
        uint256 goal,
        uint256 tokenPrice,
        uint256 totalTokens,
        uint256 deadline,
        address usdcAddress
    ) external returns (address) {
        Campaign campaign = new Campaign(
            msg.sender,
            name,
            goal,
            tokenPrice,
            totalTokens,
            deadline,
            usdcAddress
        );
        address campaignAddr = address(campaign);
        campaigns.push(campaignAddr);
        emit CampaignCreated(msg.sender, campaignAddr, name, block.timestamp);
        return campaignAddr;
    }

    // Function to get all campaigns
    function getCampaigns() external view returns (address[] memory) {
        return campaigns;
    }
}
