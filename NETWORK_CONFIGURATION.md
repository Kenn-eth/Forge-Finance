# Network Configuration Guide

This guide explains the network configuration for Forge Finance wallet integration.

## 🌐 **Supported Networks**

The application now supports the following networks (localhost removed):

### **Testnets (Recommended for Development)**
- **Base Sepolia** (Chain ID: 84532)
  - RPC: `https://sepolia.base.org`
  - Explorer: `https://sepolia.basescan.org`
  - Faucet: `https://bridge.base.org/deposit`

- **Sepolia** (Chain ID: 11155111)
  - RPC: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`
  - Explorer: `https://sepolia.etherscan.io`
  - Faucet: `https://sepoliafaucet.com`

### **Mainnets (Production)**
- **Base** (Chain ID: 8453)
  - RPC: `https://mainnet.base.org`
  - Explorer: `https://basescan.org`

- **Ethereum** (Chain ID: 1)
  - RPC: `https://mainnet.infura.io/v3/YOUR_PROJECT_ID`
  - Explorer: `https://etherscan.io`

## 🔧 **Environment Variables**

Create a `.env.local` file in your frontend directory:

```env
# WalletConnect Project ID (Required)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id

# Contract Addresses (Update with your deployed contracts)
NEXT_PUBLIC_KYC_REGISTRY_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS=0x...

# Network Configuration (Optional - defaults to Base Sepolia)
NEXT_PUBLIC_DEFAULT_CHAIN_ID=84532
```

## 🚀 **Getting Started**

### 1. **For Development (Base Sepolia)**
```bash
# Get testnet ETH from Base Sepolia faucet
# https://bridge.base.org/deposit

# Deploy contracts to Base Sepolia
# Update contract addresses in .env.local
```

### 2. **For Production (Base Mainnet)**
```bash
# Deploy contracts to Base mainnet
# Update contract addresses in .env.local
# Set NEXT_PUBLIC_DEFAULT_CHAIN_ID=8453
```

## 💰 **Getting Testnet Tokens**

### Base Sepolia ETH
1. Go to [Base Bridge](https://bridge.base.org/deposit)
2. Connect your wallet
3. Bridge ETH from Sepolia to Base Sepolia
4. Use the bridged ETH for testing

### Sepolia ETH
1. Go to [Sepolia Faucet](https://sepoliafaucet.com)
2. Enter your wallet address
3. Request testnet ETH

## 🔗 **Network Switching**

Users can switch between networks using:
- **MetaMask**: Click network dropdown → Add network → Custom RPC
- **RainbowKit**: Built-in network switching UI
- **WalletConnect**: Automatic network detection

## 📱 **Mobile Wallet Support**

The configuration supports mobile wallets through WalletConnect:
- **MetaMask Mobile**
- **Coinbase Wallet**
- **Rainbow Mobile**
- **Trust Wallet**

## 🛠️ **Troubleshooting**

### Common Issues

1. **"Unsupported Network" Error**
   - User needs to switch to a supported network
   - Check if wallet is connected to the correct chain

2. **"Insufficient Funds" Error**
   - User needs testnet tokens for testing
   - Use faucets to get testnet ETH

3. **"Contract Not Found" Error**
   - Contract addresses not set in environment variables
   - Contracts not deployed to the current network

### Network RPC Issues

If you encounter RPC issues, try alternative RPC endpoints:

**Base Sepolia:**
- `https://sepolia.base.org`
- `https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

**Base Mainnet:**
- `https://mainnet.base.org`
- `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`

## 🎯 **Recommended Setup**

### For Development:
1. Use **Base Sepolia** as primary testnet
2. Deploy contracts to Base Sepolia
3. Get testnet ETH from Base Bridge
4. Test all functionality on testnet

### For Production:
1. Deploy contracts to **Base Mainnet**
2. Update environment variables
3. Set default chain to Base (8453)
4. Monitor transactions on BaseScan

## 📊 **Network Benefits**

### Base Network Advantages:
- **Low Gas Fees** - Significantly cheaper than Ethereum
- **Fast Transactions** - Quick confirmation times
- **Ethereum Compatibility** - Easy migration from Ethereum
- **Coinbase Backing** - Reliable infrastructure

### Why Base Sepolia for Testing:
- **Free Testing** - No real money required
- **Full Functionality** - Same features as mainnet
- **Easy Faucets** - Simple to get testnet tokens
- **Fast Development** - Quick iteration cycles

This configuration provides a robust, production-ready network setup that works seamlessly across all devices and wallets!

