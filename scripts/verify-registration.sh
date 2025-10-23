#!/bin/bash

# Usage: ./verify-registration.sh <wallet-address> <kyc-contract-address>

WALLET=$1
KYC_CONTRACT=$2
RPC_URL=${3:-"https://ethereum-sepolia-rpc.publicnode.com"}

if [ -z "$WALLET" ] || [ -z "$KYC_CONTRACT" ]; then
    echo "Usage: ./verify-registration.sh <wallet-address> <kyc-contract-address> [rpc-url]"
    exit 1
fi

echo "🔍 Checking registration status for: $WALLET"
echo "📝 KYC Contract: $KYC_CONTRACT"
echo ""

# Check if registered as business
echo "Checking isBusiness..."
cast call $KYC_CONTRACT "isBusiness(address)(bool)" $WALLET --rpc-url $RPC_URL

echo ""
echo "Checking isInvestor..."
cast call $KYC_CONTRACT "isInvestor(address)(bool)" $WALLET --rpc-url $RPC_URL

echo ""
echo "Checking KYC status..."
cast call $KYC_CONTRACT "getKYCStatus(address)(bool)" $WALLET --rpc-url $RPC_URL

