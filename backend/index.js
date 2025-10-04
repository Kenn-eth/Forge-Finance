const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

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

// Endpoint to verify KYC
app.post('/kyc/verify', (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'Address is required.' });
  }
  db.run(
    'UPDATE kyc SET verified = 1 WHERE address = ?',
    [address],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Address not found.' });
      res.json({ success: true });
    }
  );
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
