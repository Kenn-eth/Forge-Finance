#!/usr/bin/env node

const { ethers } = require('ethers');

// Transaction hash to check
const txHash = process.argv[2];

if (!txHash) {
  console.log('Usage: node check-transaction.js <transaction-hash>');
  process.exit(1);
}

async function checkTransaction() {
  try {
    // Connect to Sepolia
    const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
    
    console.log(`\n🔍 Checking transaction: ${txHash}\n`);
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      console.log('❌ Transaction not found or not yet mined');
      return;
    }
    
    console.log('📊 Transaction Receipt:');
    console.log('  Status:', receipt.status === 1 ? '✅ Success' : '❌ Failed (Reverted)');
    console.log('  Block:', receipt.blockNumber);
    console.log('  Gas Used:', receipt.gasUsed.toString());
    console.log('  From:', receipt.from);
    console.log('  To:', receipt.to);
    console.log('  Contract Address:', receipt.contractAddress || 'N/A');
    
    // Get transaction details
    const tx = await provider.getTransaction(txHash);
    
    if (tx) {
      console.log('\n📝 Transaction Details:');
      console.log('  Gas Limit:', tx.gasLimit.toString());
      console.log('  Gas Price:', ethers.formatUnits(tx.gasPrice, 'gwei'), 'gwei');
      console.log('  Value:', ethers.formatEther(tx.value), 'ETH');
      console.log('  Input Data Length:', tx.data.length, 'bytes');
      
      // Decode function call if possible
      if (tx.data.length > 10) {
        const functionSelector = tx.data.slice(0, 10);
        console.log('  Function Selector:', functionSelector);
      }
    }
    
    // Check for logs (events)
    console.log('\n📜 Events Emitted:', receipt.logs.length);
    if (receipt.logs.length > 0) {
      receipt.logs.forEach((log, i) => {
        console.log(`  Event ${i + 1}:`);
        console.log('    Contract:', log.address);
        console.log('    Topics:', log.topics.length);
      });
    }
    
    // If transaction failed, try to get revert reason
    if (receipt.status === 0) {
      console.log('\n❌ TRANSACTION FAILED\n');
      
      try {
        // Try to replay the transaction to get the revert reason
        const result = await provider.call(tx, tx.blockNumber - 1);
        console.log('Revert reason:', result);
      } catch (error) {
        if (error.data) {
          console.log('Error data:', error.data);
          
          // Try to decode error message
          if (error.data.startsWith('0x08c379a0')) {
            // Standard Error(string) selector
            try {
              const reason = ethers.AbiCoder.defaultAbiCoder().decode(
                ['string'],
                '0x' + error.data.slice(10)
              )[0];
              console.log('📛 Revert Reason:', reason);
            } catch (e) {
              console.log('Could not decode revert reason');
            }
          }
        }
        
        if (error.reason) {
          console.log('📛 Revert Reason:', error.reason);
        }
        
        if (error.message && !error.reason) {
          console.log('Error message:', error.message);
        }
      }
      
      console.log('\n💡 Common Reasons for Failure:');
      console.log('  1. Out of gas (gas limit too low)');
      console.log('  2. Require statement failed');
      console.log('  3. User not authorized');
      console.log('  4. Invalid parameters');
      console.log('  5. Reentrancy guard triggered');
    } else {
      console.log('\n✅ Transaction succeeded!');
    }
    
  } catch (error) {
    console.error('Error checking transaction:', error.message);
  }
}

checkTransaction();

