const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const { keccak256 } = require('js-sha3');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const db = new sqlite3.Database('kyc.db');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create KYC table if it doesn't exist
// address: user's wallet address (primary key)
// data: JSON string of KYC data
// verified: 0 (not verified) or 1 (verified)
db.run(`
  CREATE TABLE IF NOT EXISTS kyc (
    address TEXT PRIMARY KEY,
    data TEXT,
    verified INTEGER
  )
`);

// Load contract config from environment variables
const KYC_CONTRACT_ADDRESS = process.env.KYC_CONTRACT_ADDRESS;
const KYC_CONTRACT_ABI = require('./KYCRegistry.abi.json'); // Place ABI JSON in backend dir
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const ETH_RPC_URL = process.env.ETH_RPC_URL;

let contract, wallet;
if (KYC_CONTRACT_ADDRESS && ADMIN_PRIVATE_KEY && ETH_RPC_URL) {
  const provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
  wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
  contract = new ethers.Contract(KYC_CONTRACT_ADDRESS, KYC_CONTRACT_ABI, wallet);
}

// Endpoint to submit KYC data
app.post('/kyc', (req, res) => {
  const { address, data } = req.body;
  if (!address || !data) {
    return res.status(400).json({ error: 'Address and data are required.' });
  }
  db.run(
    'INSERT OR REPLACE INTO kyc (address, data, verified) VALUES (?, ?, ?)',
    [address, JSON.stringify(data), 0],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Endpoint to verify KYC and call contract
app.post('/kyc/verify', async (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'Address is required.' });
  }
  db.get('SELECT data FROM kyc WHERE address = ?', [address], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Address not found.' });
    try {
      // Hash the KYC data with address merged
      const kycData = JSON.parse(row.data);
      const kycHash = '0x' + keccak256(JSON.stringify({ address, ...kycData }));
      // Call the contract's verifyUser
      if (!contract) {
        return res.status(500).json({ error: 'Contract not configured.' });
      }
      const tx = await contract.verifyUser(address, kycHash);
      await tx.wait();
      // Mark as verified in DB
      db.run('UPDATE kyc SET verified = 1 WHERE address = ?', [address], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, txHash: tx.hash });
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// Endpoint to check KYC status
app.get('/kyc/:address', (req, res) => {
  const { address } = req.params;
  db.get(
    'SELECT address, verified FROM kyc WHERE address = ?',
    [address],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    }
  );
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`KYC backend running on port ${PORT}`);
});
