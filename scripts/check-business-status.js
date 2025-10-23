#!/usr/bin/env node

const { ethers } = require('ethers');

// Get wallet address from command line
const walletAddress = process.argv[2];

if (!walletAddress) {
  console.log('Usage: node check-business-status.js <wallet-address>');
  process.exit(1);
}

async function checkBusinessStatus() {
  try {
    // Connect to Sepolia
    const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
    
    console.log(`\n🔍 Checking business status for: ${walletAddress}\n`);
    
    // KYC Registry ABI (minimal)
    const kycABI = [
      "function isBusiness(address user) external view returns (bool)",
      "function isInvestor(address user) external view returns (bool)",
      "function getKYCStatus(address user) external view returns (bool)"
    ];
    
    // You'll need to set the correct KYC contract address
    const KYC_CONTRACT_ADDRESS = process.env.KYC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
    
    if (KYC_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      console.log('❌ KYC_CONTRACT_ADDRESS not set in environment variables');
      console.log('Please set KYC_CONTRACT_ADDRESS in your .env file');
      return;
    }
    
    const kycContract = new ethers.Contract(KYC_CONTRACT_ADDRESS, kycABI, provider);
    
    // Check business registration
    const isBusiness = await kycContract.isBusiness(walletAddress);
    console.log('🏢 Registered as Business:', isBusiness ? '✅ Yes' : '❌ No');
    
    // Check investor registration
    const isInvestor = await kycContract.isInvestor(walletAddress);
    console.log('💰 Registered as Investor:', isInvestor ? '✅ Yes' : '❌ No');
    
    // Check KYC status
    const isKYCVerified = await kycContract.getKYCStatus(walletAddress);
    console.log('🔐 KYC Verified:', isKYCVerified ? '✅ Yes' : '❌ No');
    
    console.log('\n📋 Summary:');
    if (isBusiness && isKYCVerified) {
      console.log('✅ You can create invoice tokens');
    } else {
      console.log('❌ Cannot create invoice tokens');
      if (!isBusiness) {
        console.log('   - Need to register as business');
      }
      if (!isKYCVerified) {
        console.log('   - Need to complete KYC verification');
      }
    }
    
  } catch (error) {
    console.error('Error checking business status:', error.message);
  }
}

checkBusinessStatus();
