const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { keccak256 } = require('js-sha3');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const db = new sqlite3.Database('kyc.db');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/invoices';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

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

// Add sample data for testing (only if database is empty)
db.get('SELECT COUNT(*) as count FROM kyc', (err, row) => {
  if (err) return;
  if (row.count === 0) {
    console.log('🌱 Seeding database with sample data...');
    
    // Sample KYC data
    const sampleKYC = [
      {
        address: '0x1234567890123456789012345678901234567890',
        data: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          role: 'BUSINESS',
          company: 'Sample Corp'
        }),
        verified: 1
      },
      {
        address: '0x0987654321098765432109876543210987654321',
        data: JSON.stringify({
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'INVESTOR',
          company: 'Investment LLC'
        }),
        verified: 1
      }
    ];
    
    sampleKYC.forEach((kyc) => {
      db.run('INSERT INTO kyc (address, data, verified) VALUES (?, ?, ?)', 
        [kyc.address, kyc.data, kyc.verified]);
    });
    
    console.log('✅ Sample data added for testing');
  }
});

// Create invoices table for storing invoice metadata
db.run(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_id INTEGER UNIQUE,
    business_address TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    services TEXT,
    invoice_value INTEGER NOT NULL,
    loan_amount INTEGER NOT NULL,
    unit_value INTEGER NOT NULL,
    due_date TEXT,
    description TEXT,
    metadata_uri TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create invoice_documents table for file attachments
db.run(`
  CREATE TABLE IF NOT EXISTS invoice_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices (id)
  )
`);

// Load contract config from environment variables (for read-only operations)
const KYC_CONTRACT_ADDRESS = process.env.KYC_CONTRACT_ADDRESS;
const KYC_CONTRACT_ABI = require('./KYCRegistry.abi.json').abi; // Extract ABI array from JSON
const ETH_RPC_URL = process.env.ETH_RPC_URL;

// Contract setup for read-only operations only
let contract, provider;
if (KYC_CONTRACT_ADDRESS && ETH_RPC_URL) {
  provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
  // Read-only contract - no signer needed
  contract = new ethers.Contract(KYC_CONTRACT_ADDRESS, KYC_CONTRACT_ABI, provider);
  console.log('✅ Blockchain read-only integration enabled');
} else {
  console.log('⚠️  Blockchain integration disabled - running in database-only mode');
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

// Endpoint to verify KYC (database only - frontend handles blockchain)
app.post('/kyc/verify', async (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'Address is required.' });
  }
  
  try {
    // Backend only handles database verification
    // Frontend handles blockchain verification directly with user's wallet
    db.run('UPDATE kyc SET verified = 1 WHERE address = ?', [address], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ 
        success: true, 
        method: 'database',
        message: 'KYC verified in database. User should verify on blockchain via frontend.' 
      });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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

// ==================== INVOICE ENDPOINTS ====================

// Endpoint to create invoice metadata and return URI
app.post('/invoices', (req, res) => {
  const {
    business_address,
    invoice_number,
    customer_name,
    customer_email,
    services,
    invoice_value,
    loan_amount,
    unit_value,
    due_date,
    description
  } = req.body;

  // Validate required fields
  if (!business_address || !invoice_number || !customer_name || !invoice_value || !loan_amount || !unit_value) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Generate metadata URI (points to our API)
  const metadata_uri = `${process.env.API_URL || 'http://localhost:3001'}/invoices/metadata/${invoice_number}`;

  // Insert into database
  db.run(
    `INSERT INTO invoices (
      business_address, invoice_number, customer_name, customer_email,
      services, invoice_value, loan_amount, unit_value, due_date,
      description, metadata_uri
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      business_address, invoice_number, customer_name, customer_email,
      services, invoice_value, loan_amount, unit_value, due_date,
      description, metadata_uri
    ],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      res.json({
        success: true,
        invoice_id: this.lastID,
        metadata_uri: metadata_uri
      });
    }
  );
});

// Endpoint to get invoice metadata (replaces IPFS JSON)
app.get('/invoices/metadata/:invoice_number', (req, res) => {
  const { invoice_number } = req.params;
  
  db.get(
    'SELECT * FROM invoices WHERE invoice_number = ?',
    [invoice_number],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Invoice not found' });

      // Return ERC1155 compatible metadata
      const metadata = {
        name: `Invoice #${row.invoice_number}`,
        description: row.description || `Invoice for ${row.services}`,
        image: "https://via.placeholder.com/400x300?text=Invoice+Document",
        external_url: `https://yourplatform.com/invoice/${row.invoice_number}`,
        attributes: [
          { trait_type: "Invoice Number", value: row.invoice_number },
          { trait_type: "Customer Name", value: row.customer_name },
          { trait_type: "Customer Email", value: row.customer_email },
          { trait_type: "Services", value: row.services },
          { trait_type: "Invoice Value", value: `${row.invoice_value} USD` },
          { trait_type: "Loan Amount", value: `${row.loan_amount} USD` },
          { trait_type: "Due Date", value: row.due_date },
          { trait_type: "Created At", value: row.created_at },
          { trait_type: "Business Address", value: row.business_address }
        ],
        properties: {
          invoiceNumber: row.invoice_number,
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          services: row.services,
          invoiceValue: row.invoice_value,
          loanAmount: row.loan_amount,
          dueDate: row.due_date,
          description: row.description
        }
      };

      res.json(metadata);
    }
  );
});

// Endpoint to get invoice details by token ID
app.get('/invoices/token/:token_id', (req, res) => {
  const { token_id } = req.params;
  
  db.get(
    'SELECT * FROM invoices WHERE token_id = ?',
    [token_id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Invoice not found' });
      res.json(row);
    }
  );
});

// Endpoint to update token ID after minting
app.put('/invoices/:id/token', (req, res) => {
  const { id } = req.params;
  const { token_id } = req.body;
  
  db.run(
    'UPDATE invoices SET token_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [token_id, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Endpoint to update token ID by invoice number (easier for frontend)
app.put('/invoices/token/:invoice_number', (req, res) => {
  const { invoice_number } = req.params;
  const { token_id } = req.body;
  
  db.run(
    'UPDATE invoices SET token_id = ?, updated_at = CURRENT_TIMESTAMP WHERE invoice_number = ?',
    [token_id, invoice_number],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, token_id });
    }
  );
});

// Endpoint to get invoice details from contract by token ID
app.get('/contract/invoice-details/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  
  try {
    // Call the contract to get invoice details
    const invoiceDetails = await invoiceTokenContract.idToInvoiceDetails(tokenId);
    
    res.json({
      loanAmount: invoiceDetails.loanAmount.toString(),
      invoiceValue: invoiceDetails.invoiceValue.toString(),
      unitValue: invoiceDetails.unitValue.toString(),
      createdAt: invoiceDetails.createdAt.toString(),
      createdBy: invoiceDetails.createdBy,
      campaignDuration: invoiceDetails.campaignDuration.toString(),
      campaignEndTime: invoiceDetails.campaignEndTime.toString(),
      maturityDate: invoiceDetails.maturityDate.toString(),
      tokenSupply: invoiceDetails.tokenSupply.toString(),
      availableSupply: invoiceDetails.availableSupply.toString(),
      isFulfilled: invoiceDetails.isFulfilled,
      data: invoiceDetails.data
    });
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
});

// Endpoint to get invoice metadata by token ID
app.get('/invoices/token/:tokenId', (req, res) => {
  const { tokenId } = req.params;
  
  db.get(
    'SELECT * FROM invoices WHERE token_id = ?',
    [tokenId],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      
      res.json(row);
    }
  );
});

// Endpoint to get all invoices for a business
app.get('/invoices/business/:address', (req, res) => {
  const { address } = req.params;
  
  db.all(
    'SELECT * FROM invoices WHERE business_address = ? ORDER BY created_at DESC',
    [address],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`KYC backend running on port ${PORT}`);
});
