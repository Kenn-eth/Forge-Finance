# 🚀 Forge Finance Deployment Guide

This guide will help you deploy the complete Forge Finance platform from smart contracts to frontend.

## 📋 **Prerequisites**

- Node.js 18+
- Foundry (for smart contracts)
- Git
- Wallet with testnet ETH (Base Sepolia recommended)

## 🔧 **Environment Setup**

### 1. **Clone and Install Dependencies**

```bash
git clone <your-repo>
cd Forge-Finance

# Install contract dependencies
cd contracts
forge install

# Install frontend dependencies
cd ../frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. **Environment Variables**

#### Frontend (.env.local)
```bash
cp frontend/.env.example frontend/.env.local
```

Update with your values:
```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_KYC_REGISTRY_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0x...
```

#### Backend (.env)
```bash
cp backend/.env.example backend/.env
```

Update with your values:
```env
ETH_RPC_URL=https://sepolia.base.org
ADMIN_PRIVATE_KEY=0x...
KYC_CONTRACT_ADDRESS=0x...
INVOICE_TOKEN_CONTRACT_ADDRESS=0x...
USDC_CONTRACT_ADDRESS=0x...
```

## 🏗️ **Smart Contract Deployment**

### 1. **Deploy KYC Registry First**

```bash
cd contracts

# Set environment variables
export PRIVATE_KEY=0x... # Your private key with testnet ETH
export ETH_RPC_URL=https://sepolia.base.org

# Deploy KYC Registry
forge script script/DeployKYC.s.sol:DeployKYC --rpc-url $ETH_RPC_URL --broadcast --verify
```

### 2. **Deploy Invoice Token Contract**

```bash
# Set additional environment variables
export KYC_REGISTRY_ADDRESS=0x... # From step 1 output
export USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e # USDC on Base Sepolia

# Deploy Invoice Token
forge script script/DeployInvoiceToken.s.sol:DeployInvoiceToken --rpc-url $ETH_RPC_URL --broadcast --verify
```

### 3. **Update Environment Variables**

Copy the deployed contract addresses to your frontend and backend `.env` files.

## 🖥️ **Backend Deployment**

### 1. **Start Backend Server**

```bash
cd backend
npm start
```

The backend will:
- Create SQLite database
- Start API server on port 3001
- Connect to deployed contracts

### 2. **Test Backend Endpoints**

```bash
# Test KYC endpoint
curl -X POST http://localhost:3001/kyc \
  -H "Content-Type: application/json" \
  -d '{"address":"0x...","data":{"name":"Test User"}}'

# Test invoice creation
curl -X POST http://localhost:3001/invoices \
  -H "Content-Type: application/json" \
  -d '{"business_address":"0x...","invoice_number":"INV-001","customer_name":"Test Corp","invoice_value":"10000","loan_amount":"8000","unit_value":"100"}'
```

## 🌐 **Frontend Deployment**

### 1. **Development Mode**

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

### 2. **Production Build**

```bash
npm run build
npm start
```

### 3. **Deploy to Vercel (Recommended)**

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

## 🔗 **Integration Testing**

### 1. **Test Complete Flow**

1. **User Registration**
   - Connect wallet
   - Register as investor/business
   - Verify KYC through backend

2. **Invoice Creation** (Business)
   - Create invoice token
   - Verify on blockchain
   - Check metadata API

3. **Token Purchase** (Investor)
   - Browse marketplace
   - Purchase invoice tokens
   - Verify transaction

4. **Profit Claiming**
   - Wait for invoice fulfillment
   - Claim profits
   - Verify token burn

### 2. **Monitor Logs**

```bash
# Backend logs
cd backend && npm start

# Frontend logs
cd frontend && npm run dev

# Contract events
cast logs --from-block latest --address <CONTRACT_ADDRESS>
```

## 🚨 **Troubleshooting**

### Common Issues:

1. **Contract Deployment Fails**
   - Check private key has sufficient ETH
   - Verify RPC URL is correct
   - Ensure contract compiles: `forge build`

2. **Frontend Can't Connect**
   - Verify contract addresses in `.env.local`
   - Check WalletConnect project ID
   - Ensure wallet is on correct network

3. **Backend API Errors**
   - Check database permissions
   - Verify contract ABIs are present
   - Check RPC connection

4. **Transaction Failures**
   - Ensure sufficient gas
   - Check contract function parameters
   - Verify user has required permissions

## 📊 **Network Addresses**

### Base Sepolia (Recommended)
- **USDC**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **RPC**: `https://sepolia.base.org`
- **Explorer**: `https://sepolia.basescan.org`

### Base Mainnet
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **RPC**: `https://mainnet.base.org`
- **Explorer**: `https://basescan.org`

## ✅ **Deployment Checklist**

- [ ] Smart contracts deployed and verified
- [ ] Environment variables configured
- [ ] Backend API running and tested
- [ ] Frontend connected to contracts
- [ ] User registration flow working
- [ ] Invoice creation working
- [ ] Token purchase working
- [ ] Profit claiming working
- [ ] All integrations tested

## 🎉 **You're Ready!**

Your Forge Finance platform is now deployed and ready for users!

For support, check the troubleshooting section or open an issue in the repository.
