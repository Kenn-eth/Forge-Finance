#!/bin/bash

# Script to sync contract ABIs from foundry build output to frontend

echo "Syncing contract ABIs to frontend..."

# Create contracts directory if it doesn't exist
mkdir -p frontend/src/contracts

# Copy contract ABIs
cp contracts/out/InvoiceToken.sol/InvoiceTokenVault.json frontend/src/contracts/
cp contracts/out/KYCRegistry.sol/KYCRegistry.json frontend/src/contracts/

echo "✓ Contract ABIs synced successfully!"
echo "  - InvoiceTokenVault.json"
echo "  - KYCRegistry.json"

