# 🧪 Integration Test Guide

This guide helps you test the complete Forge Finance platform integration from wallet connection to invoice tokenization.

## 🎯 **Test Scenarios**

### **Scenario 1: Investor Registration & KYC Flow**

1. **Connect Wallet**
   - Open frontend at `http://localhost:3000`
   - Click "Connect Wallet"
   - Select your wallet (MetaMask, Coinbase Wallet, etc.)
   - Verify connection shows your address

2. **Register as Investor**
   - Select "INVESTOR" role
   - Fill required fields:
     - Full Name: "John Doe"
     - Email: "john@example.com"
     - Phone: "+1234567890"
   - Click "Complete Registration"
   - Confirm transaction in wallet
   - Wait for transaction confirmation

3. **KYC Verification**
   - Should automatically redirect to KYC verification
   - Click "Verify KYC"
   - Confirm transaction in wallet
   - Wait for verification completion
   - Should redirect to dashboard

**Expected Results:**
- ✅ Wallet connected successfully
- ✅ Registration transaction confirmed
- ✅ User appears as registered investor in contract
- ✅ KYC verification transaction confirmed
- ✅ User appears as KYC verified
- ✅ Dashboard shows investor interface

### **Scenario 2: Business Registration & Invoice Creation**

1. **Register as Business**
   - Connect wallet (if not already connected)
   - Select "BUSINESS" role
   - Fill required fields:
     - Business Name: "TechCorp Inc"
     - Business Type: "Technology"
     - Registration Number: "123456789"
   - Complete registration and KYC (same as investor)

2. **Create Invoice Token**
   - Navigate to "Create Invoice Token"
   - Fill invoice details:
     - Invoice Number: "INV-2024-001"
     - Customer Name: "Client Corp"
     - Invoice Value: "10000"
     - Loan Amount: "8000"
     - Unit Value: "100"
     - Due Date: "2024-12-31"
   - Click "Create Invoice Token"
   - Confirm transaction in wallet

**Expected Results:**
- ✅ Business registration successful
- ✅ Invoice token created successfully
- ✅ Token appears in marketplace
- ✅ Contract shows correct invoice details

### **Scenario 3: Token Purchase & Trading**

1. **Browse Marketplace**
   - Navigate to marketplace
   - Should see created invoice tokens
   - Verify token details are correct

2. **Purchase Tokens**
   - Select an invoice token
   - Enter quantity to purchase
   - Click "Buy Tokens"
   - Confirm USDC approval transaction
   - Confirm purchase transaction

3. **Verify Purchase**
   - Check dashboard for owned tokens
   - Verify token balance in wallet
   - Check contract for correct ownership

**Expected Results:**
- ✅ Marketplace shows available tokens
- ✅ Purchase transaction successful
- ✅ Token ownership updated correctly
- ✅ USDC transferred correctly

### **Scenario 4: Invoice Fulfillment & Profit Claiming**

1. **Fulfill Invoice** (Business)
   - Business user fulfills invoice
   - Transfers full invoice value to contract
   - Marks invoice as fulfilled

2. **Claim Profits** (Investor)
   - Investor navigates to dashboard
   - Sees claimable profits
   - Clicks "Claim Profit"
   - Confirms transaction
   - Receives profit in USDC

**Expected Results:**
- ✅ Invoice marked as fulfilled
- ✅ Investors can claim profits
- ✅ Tokens burned after claiming
- ✅ Correct profit amounts distributed

## 🔍 **Contract Verification Commands**

### **Check User Registration Status**
```bash
# Check if address is registered as business
cast call <KYC_CONTRACT_ADDRESS> "isBusiness(address)" <USER_ADDRESS> --rpc-url https://sepolia.base.org

# Check if address is registered as investor
cast call <KYC_CONTRACT_ADDRESS> "isInvestor(address)" <USER_ADDRESS> --rpc-url https://sepolia.base.org

# Check KYC verification status
cast call <KYC_CONTRACT_ADDRESS> "getKYCStatus(address)" <USER_ADDRESS> --rpc-url https://sepolia.base.org
```

### **Check Invoice Token Details**
```bash
# Get total number of tokens created
cast call <INVOICE_TOKEN_CONTRACT_ADDRESS> "nonce()" --rpc-url https://sepolia.base.org

# Get invoice details for token ID
cast call <INVOICE_TOKEN_CONTRACT_ADDRESS> "idToInvoiceDetails(uint256)" <TOKEN_ID> --rpc-url https://sepolia.base.org

# Get token owner
cast call <INVOICE_TOKEN_CONTRACT_ADDRESS> "idToOwner(uint256)" <TOKEN_ID> --rpc-url https://sepolia.base.org
```

### **Check Token Balances**
```bash
# Check ERC1155 token balance
cast call <INVOICE_TOKEN_CONTRACT_ADDRESS> "balanceOf(address,uint256)" <USER_ADDRESS> <TOKEN_ID> --rpc-url https://sepolia.base.org

# Check USDC balance
cast call <USDC_CONTRACT_ADDRESS> "balanceOf(address)" <USER_ADDRESS> --rpc-url https://sepolia.base.org
```

## 🐛 **Troubleshooting Common Issues**

### **Transaction Fails**
- Check wallet has sufficient ETH for gas
- Verify contract addresses are correct
- Check network is set to Base Sepolia
- Ensure user has required permissions

### **Frontend Not Loading**
- Check environment variables are set
- Verify contract addresses in `.env.local`
- Check browser console for errors
- Ensure backend is running

### **Contract Calls Fail**
- Verify contract is deployed correctly
- Check ABI matches deployed contract
- Ensure user is registered and KYC verified
- Check contract function parameters

### **USDC Transfer Issues**
- Ensure user has USDC tokens
- Check USDC approval is sufficient
- Verify USDC contract address is correct
- Check transfer amount is valid

## 📊 **Success Metrics**

### **Registration Flow**
- ✅ Wallet connection success rate: >95%
- ✅ Registration transaction success: >90%
- ✅ KYC verification success: >90%
- ✅ Time to complete registration: <5 minutes

### **Invoice Creation**
- ✅ Invoice creation success: >90%
- ✅ Metadata stored correctly: 100%
- ✅ Token minted successfully: >95%

### **Trading Flow**
- ✅ Token purchase success: >90%
- ✅ Ownership transfer correct: 100%
- ✅ USDC transfer accurate: 100%

### **Profit Claiming**
- ✅ Claim success rate: >90%
- ✅ Profit calculation correct: 100%
- ✅ Token burn successful: 100%

## 🎉 **Test Completion Checklist**

- [ ] All test scenarios pass
- [ ] No console errors in frontend
- [ ] All contract interactions successful
- [ ] Database records created correctly
- [ ] User experience is smooth
- [ ] Error handling works properly
- [ ] Loading states display correctly
- [ ] Transaction confirmations show
- [ ] Dashboard updates in real-time
- [ ] Mobile responsiveness works

## 🚀 **Ready for Production**

Once all tests pass, your Forge Finance platform is ready for:
- Public testnet deployment
- User acceptance testing
- Mainnet deployment
- Production launch

For any issues, check the troubleshooting section or review the deployment logs.
