'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi';
import { CONTRACTS, INVOICE_TOKEN_ABI, KYC_REGISTRY_ABI } from '@/lib/contracts';
import { createInvoiceInDatabase } from '@/lib/ipfs';

interface InvoiceFormData {
  customerName: string;
  customerEmail: string;
  services: string;
  invoiceValue: string;
  loanAmount: string;
  unitValue: string;
  dueDate: string;
  description: string;
  campaignDuration: string;
  maturityDate: string;
  documents?: File[];
}

export function InvoiceCreationForm() {
  const { address } = useAccount();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError, error: receiptError, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');

  // Check if user is registered as business (with query enabled false to not block render)
  const { data: isBusiness } = useReadContract({
    address: CONTRACTS.KYC_REGISTRY,
    abi: KYC_REGISTRY_ABI,
    functionName: 'isBusiness',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address, // Only fetch when address is available
      staleTime: 60 * 1000, // Cache for 1 minute
    },
  });
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerName: '',
    customerEmail: '',
    services: '',
    invoiceValue: '',
    loanAmount: '',
    unitValue: '100', // $100 default minimum investment
    dueDate: '',
    description: '',
    campaignDuration: '30', // 30 days default
    maturityDate: '',
    documents: []
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, documents: files }));
  };

  // Function to parse contract errors and provide user-friendly messages
  const parseContractError = (error: unknown): string => {
    if (!error) return 'An unknown error occurred';
    
    const errorMessage = (error as Error).message || error.toString();
    
    // Common contract error patterns
    if (errorMessage.includes('User must be a registered business')) {
      return 'You must be registered as a business to create invoice tokens. Please complete your business registration first.';
    }
    
    if (errorMessage.includes('Invoice: zero amount')) {
      return 'Invoice value must be greater than zero.';
    }
    
    if (errorMessage.includes('unit value must be a factor of invoice value')) {
      return 'Unit value must divide evenly into invoice value. Please adjust your values.';
    }
    
    if (errorMessage.includes('invoice value must be greater than or equal to loan amount')) {
      return 'Invoice value must be greater than or equal to the loan amount requested.';
    }
    
    if (errorMessage.includes('must be non-zero values')) {
      return 'All financial values must be greater than zero.';
    }
    
    if (errorMessage.includes('insufficient funds')) {
      return 'Insufficient funds for transaction. Please check your wallet balance.';
    }
    
    if (errorMessage.includes('user rejected')) {
      return 'Transaction was rejected. Please try again.';
    }
    
    if (errorMessage.includes('gas')) {
      return 'Transaction failed due to gas issues. Please try again with higher gas limit.';
    }
    
    // Return the original error message if no pattern matches
    return errorMessage;
  };

  // No need for metadata URI generation - everything is stored on-chain

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Validate required fields
      if (!formData.customerName || !formData.invoiceValue || !formData.loanAmount || !formData.unitValue) {
        throw new Error('Please fill in all required fields');
      }

      // Calculate values for contract
      // Convert to integers (wei units) - multiply by 1e6 for USDC (6 decimals)
      const invoiceValue = Math.floor(parseFloat(formData.invoiceValue) * 1e6);
      const loanAmount = Math.floor(parseFloat(formData.loanAmount) * 1e6);
      const unitValue = Math.floor(parseFloat(formData.unitValue) * 1e6);
      const campaignDuration = parseInt(formData.campaignDuration) * 24 * 60 * 60; // Convert days to seconds
      const maturityDate = Math.floor(new Date(formData.maturityDate).getTime() / 1000); // Convert to timestamp

      // Validate unit value is a factor of invoice value
      if (invoiceValue % unitValue !== 0) {
        throw new Error(`Unit value (${unitValue}) must be a factor of invoice value (${invoiceValue})`);
      }
      
      // 1. First, store additional details in database
      // Generate unique invoice number
      const generatedInvoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      setInvoiceNumber(generatedInvoiceNumber);
      
      const invoiceData = {
        business_address: address,
        invoice_number: generatedInvoiceNumber,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        services: formData.services,
        invoice_value: invoiceValue,
        loan_amount: loanAmount,
        unit_value: unitValue,
        due_date: formData.dueDate,
        description: formData.description
      };

      try {
        const metadataUri = await createInvoiceInDatabase(invoiceData);
        console.log('Invoice metadata stored:', metadataUri);
      } catch (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to store invoice data. Please try again.');
      }

      // 2. Then call smart contract with only required parameters
      console.log('📊 Contract Call Parameters:');
      console.log('  loanAmount:', loanAmount);
      console.log('  invoiceValue:', invoiceValue);
      console.log('  unitValue:', unitValue);
      console.log('  campaignDuration:', campaignDuration);
      console.log('  maturityDate:', maturityDate);
      console.log('  address:', address);
      console.log('  contract:', CONTRACTS.INVOICE_TOKEN);
      
      // First simulate the contract call to get the return value
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      
      const simulationResult = await publicClient.simulateContract({
        address: CONTRACTS.INVOICE_TOKEN,
        abi: INVOICE_TOKEN_ABI,
        functionName: 'createInvoice',
        args: [
          loanAmount,
          invoiceValue,
          unitValue,
          campaignDuration,
          maturityDate,
          '0x' // empty data - metadata is stored in database
        ],
        account: address,
      });

      // Debug the simulation result
      console.log('Full simulation result:', simulationResult);
      console.log('Simulation result.result:', simulationResult.result);
      console.log('Type of result:', typeof simulationResult.result);

      // Extract the token ID from the simulation result
      let tokenIdFromSimulation;
      if (typeof simulationResult.result === 'bigint') {
        tokenIdFromSimulation = Number(simulationResult.result);
      } else if (typeof simulationResult.result === 'string') {
        tokenIdFromSimulation = parseInt(simulationResult.result, 10);
      } else {
        console.error('Unexpected result type:', typeof simulationResult.result, simulationResult.result);
        tokenIdFromSimulation = 0;
      }
      
      setTokenId(tokenIdFromSimulation);
      console.log('Token ID from simulation:', tokenIdFromSimulation);

      // Validate that we got a valid token ID
      if (isNaN(tokenIdFromSimulation) || tokenIdFromSimulation < 0) {
        console.warn('Invalid token ID from simulation, proceeding with transaction anyway');
      }

      // Now execute the actual transaction
      writeContract({
        address: CONTRACTS.INVOICE_TOKEN,
        abi: INVOICE_TOKEN_ABI,
        functionName: 'createInvoice',
        args: [
          loanAmount,
          invoiceValue,
          unitValue,
          campaignDuration,
          maturityDate,
          '0x' // empty data - metadata is stored in database
        ],
      });

    } catch (error) {
      console.error('Invoice creation error:', error);
      const errorMessage = parseContractError(error);
      alert(`Invoice creation failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback: Extract token ID from transaction receipt logs if simulation failed
  useEffect(() => {
    if (receipt && receipt.logs && (tokenId === null || isNaN(tokenId) || tokenId === 0)) {
      console.log('Attempting to extract token ID from transaction logs as fallback');
      
      // Find the InvoiceMinted event in the logs
      const invoiceMintedEvent = receipt.logs.find(log => {
        return log.address.toLowerCase() === CONTRACTS.INVOICE_TOKEN.toLowerCase();
      });

      if (invoiceMintedEvent && invoiceMintedEvent.topics && invoiceMintedEvent.topics.length >= 3) {
        try {
          const tokenIdFromEvent = parseInt(invoiceMintedEvent.topics[2] || '0', 16);
          if (tokenIdFromEvent > 0) {
            setTokenId(tokenIdFromEvent);
            console.log('Token ID extracted from event logs:', tokenIdFromEvent);
          }
        } catch (error) {
          console.error('Error extracting token ID from event:', error);
        }
      }
    }
  }, [receipt, tokenId]);

  // Handle transaction errors
  // Only show error if we have an error AND either no hash or the receipt shows failure
  if ((isError || error) && !hash) {
    // Transaction submission error (never got a hash)
    const errorMessage = parseContractError(error);
    
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">Invoice Creation Failed</h2>
        <p className="text-gray-600 mb-4">
          {errorMessage}
        </p>
        
        <div className="flex space-x-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If we have a hash but receipt shows transaction failed (status = 0)
  if (receipt && receipt.status === 'reverted') {
    const errorMessage = receiptError ? parseContractError(receiptError) : 'Transaction was reverted by the network';
    
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">Transaction Reverted</h2>
        <p className="text-gray-600 mb-4">
          {errorMessage}
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
          <a 
            href={`https://sepolia.etherscan.io/tx/${hash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-mono text-sm text-blue-600 hover:text-blue-800 break-all"
          >
            {hash}
          </a>
          <p className="text-xs text-gray-500 mt-2">Click to view on Etherscan</p>
        </div>
        
        <div className="flex space-x-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Handle loading state during transaction
  if (isPending || isConfirming) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <h2 className="text-2xl font-bold text-blue-600 mb-2">
          {isPending ? 'Confirming Transaction...' : 'Processing Invoice...'}
        </h2>
        <p className="text-gray-600 mb-4">
          {isPending 
            ? 'Please confirm the transaction in your wallet.' 
            : 'Your invoice is being created on the blockchain. This may take a few moments.'}
        </p>
        
        {hash && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
            <p className="font-mono text-sm text-gray-900 break-all">{hash}</p>
          </div>
        )}
      </div>
    );
  }

  // Handle successful transaction
  if (isSuccess) {
    // If we have the token ID, update the database
    if (tokenId !== null) {
    // Update token ID in database
    const updateTokenId = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/token/${invoiceNumber}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token_id: tokenId }),
        });
        
        console.log('Token ID updated in database:', tokenId);
      } catch (error) {
        console.error('Error updating token ID:', error);
      }
    };

      updateTokenId();
    }

    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Invoice Created Successfully!</h2>
        <p className="text-gray-600 mb-4">
          Your invoice token has been created and is now available in the marketplace.
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Invoice Number:</p>
            <p className="font-mono text-lg font-bold text-blue-600">{invoiceNumber}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Token ID:</p>
            {tokenId !== null && !isNaN(tokenId) && tokenId >= 0 ? (
              <p className="font-mono text-lg font-bold text-green-600">{tokenId}</p>
            ) : (
              <p className="font-mono text-lg font-bold text-gray-500">Extracting...</p>
            )}
          </div>
        </div>
        {hash && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
            <a 
              href={`https://sepolia.etherscan.io/tx/${hash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-mono text-sm text-blue-600 hover:text-blue-800 break-all"
            >
              {hash}
            </a>
            <p className="text-xs text-gray-500 mt-2">Click to view on Etherscan</p>
          </div>
        )}
        <div className="flex space-x-4 justify-center">
          <button
            onClick={() => window.location.href = '/marketplace'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            View in Marketplace
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show message if user is not registered as business
  if (address && isBusiness === false) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-yellow-600 mb-2">Business Registration Required</h2>
        <p className="text-gray-600 mb-4">
          You must be registered as a business to create invoice tokens. You can add business registration to your existing account.
        </p>
        <div className="flex space-x-4 justify-center">
          <button
            onClick={() => window.location.href = '/register-business'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Register as a Business
          </button>
          <button
            onClick={() => window.location.href = '/marketplace'}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Browse Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Create Invoice Token</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Maturity Date</label>
            <input
              type="date"
              name="maturityDate"
              value={formData.maturityDate}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Customer Name</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Customer Email</label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Services Description</label>
          <input
            type="text"
            name="services"
            value={formData.services}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Invoice Value (USD)</label>
            <input
              type="number"
              name="invoiceValue"
              value={formData.invoiceValue}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Loan Amount Needed (USD)</label>
            <input
              type="number"
              name="loanAmount"
              value={formData.loanAmount}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Unit Value (USD)</label>
            <input
              type="number"
              name="unitValue"
              value={formData.unitValue}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Minimum investment per token (must divide evenly into invoice value)</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Campaign Duration (Days)</label>
          <input
            type="number"
            name="campaignDuration"
            value={formData.campaignDuration}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
            required
          />
          <p className="text-xs text-gray-500 mt-1">How long investors can buy tokens</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md h-20"
            placeholder="Additional details about the invoice..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Supporting Documents (Optional)</label>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="w-full p-2 border rounded-md"
            accept=".pdf,.doc,.docx,.jpg,.png"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || isPending || isConfirming}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
          {isPending && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
          {isConfirming && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
          <span>
            {isLoading ? 'Storing Data...' : 
             isPending ? 'Confirm Transaction...' : 
             isConfirming ? 'Processing...' : 
             'Create Invoice Token'}
          </span>
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 font-medium">Transaction Failed</span>
            </div>
            <p className="text-red-700 mt-1 text-sm">
              {error && typeof error === 'object' && 'message' in error 
                ? (error as Error).message 
                : 'An error occurred during invoice creation. Please try again.'}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
