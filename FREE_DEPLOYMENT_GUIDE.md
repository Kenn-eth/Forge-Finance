# 🚀 Free Deployment Guide - No Private Keys Required

This guide shows you how to deploy Forge Finance to free hosting platforms **without exposing your private keys**.

## 🎯 **Key Changes Made**

✅ **Backend works without private keys**  
✅ **No blockchain transactions from backend**  
✅ **Frontend handles all blockchain interactions**  
✅ **Users sign their own transactions**  

## 🌐 **Recommended Free Hosting Stack**

### **Option 1: Vercel + Railway (Recommended)**
- **Frontend**: Vercel (Next.js optimized)
- **Backend**: Railway (Node.js with database)
- **Cost**: Completely free

### **Option 2: Netlify + Render**
- **Frontend**: Netlify
- **Backend**: Render
- **Cost**: Completely free

### **Option 3: GitHub Pages + Heroku**
- **Frontend**: GitHub Pages
- **Backend**: Heroku (limited free tier)
- **Cost**: Free with limitations

## 📋 **Deployment Steps**

### **Step 1: Prepare Your Repository**

1. **Remove sensitive files**:
   ```bash
   # Make sure these are in .gitignore
   echo "*.env" >> .gitignore
   echo "*.env.local" >> .gitignore
   echo "backend/kyc.db" >> .gitignore
   echo "backend/uploads/" >> .gitignore
   
   # Optional: Keep sample database for testing
   # echo "!backend/sample-kyc.db" >> .gitignore
   ```

2. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Prepare for deployment without private keys"
   git push origin main
   ```

### **Step 2: Deploy Backend (Railway)**

1. **Go to [Railway.app](https://railway.app)**
2. **Connect your GitHub repository**
3. **Select the `backend` folder**
4. **Set environment variables** (optional):
   ```
   PORT=3001
   API_URL=https://your-backend-url.railway.app
   ```
5. **Deploy** - Railway will automatically detect Node.js

### **Step 3: Deploy Frontend (Vercel)**

1. **Go to [Vercel.com](https://vercel.com)**
2. **Import your GitHub repository**
3. **Set build settings**:
   - Framework: Next.js
   - Root Directory: `frontend`
4. **Set environment variables**:
   ```
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
   NEXT_PUBLIC_KYC_REGISTRY_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```
5. **Deploy**

### **Step 4: Update Frontend API URL**

Update your frontend to use the deployed backend URL:

```typescript
// In your frontend code, replace localhost with your Railway URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-url.railway.app';
```

## 🔧 **Environment Variables Reference**

### **Backend (Railway)**
```env
# Required
PORT=3001
API_URL=https://your-backend-url.railway.app

# Optional (for read-only blockchain queries)
ETH_RPC_URL=https://sepolia.base.org
KYC_CONTRACT_ADDRESS=0x...
INVOICE_TOKEN_CONTRACT_ADDRESS=0x...
USDC_CONTRACT_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# NO PRIVATE KEYS NEEDED - Frontend handles all transactions!
```

### **Frontend (Vercel)**
```env
# Required
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app

# Contract addresses (update with your deployed contracts)
NEXT_PUBLIC_KYC_REGISTRY_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

## 🎯 **How It Works Without Private Keys**

### **KYC Verification Flow**
1. **User submits KYC data** → Backend stores in database
2. **Backend marks as verified** → Database verification
3. **User verifies on blockchain** → Frontend calls `verifyKYC()` directly
4. **User signs transaction** → No server private keys needed

### **Invoice Creation Flow**
1. **User creates invoice** → Backend stores metadata
2. **User mints NFT** → Frontend calls smart contract
3. **User signs transaction** → Direct wallet interaction

### **Key Insight: `verifyKYC` is Public!**
- ✅ **No admin role required** - anyone can call `verifyKYC()`
- ✅ **No private keys needed** - users sign their own transactions
- ✅ **Backend is database-only** - no blockchain transactions from server
- ✅ **Fully functional on free hosting**

## 🚨 **Security Best Practices**

1. **Never commit private keys to git**
2. **Use environment variables for sensitive data**
3. **Consider using a dedicated admin wallet with minimal funds**
4. **Regularly rotate keys if using blockchain integration**

## 🔍 **Testing Your Deployment**

1. **Check backend health**: `https://your-backend-url.railway.app/kyc/test-address`
2. **Test frontend**: Connect wallet and try KYC flow
3. **Verify database**: Check that data is being stored
4. **Test blockchain**: Ensure users can interact with contracts

## 🆘 **Troubleshooting**

### **Backend Issues**
- Check Railway logs for errors
- Verify environment variables are set
- Ensure database file is being created

### **Frontend Issues**
- Check Vercel build logs
- Verify environment variables
- Test API connectivity

### **Blockchain Issues**
- Ensure contract addresses are correct
- Check network configuration
- Verify user has testnet ETH

## 📞 **Support**

If you encounter issues:
1. Check the logs on your hosting platform
2. Verify all environment variables are set correctly
3. Test locally first to isolate issues
4. Check that your smart contracts are deployed and accessible

---

**🎉 Congratulations!** Your Forge Finance app is now deployed without exposing any private keys!
