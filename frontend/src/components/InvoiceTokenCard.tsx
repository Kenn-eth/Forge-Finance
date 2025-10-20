'use client';

import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';

interface InvoiceTokenData {
  id: number;
  loanAmount: string;
  invoiceValue: string;
  unitValue: string;
  createdAt: string;
  campaignDuration: string;
  campaignEndTime: string;
  maturityDate: string;
  tokenSupply: string;
  availableSupply: string;
  isFulfilled: boolean;
  owner: string;
  // Additional metadata
  invoiceNumber?: string;
  customerName?: string;
  services?: string;
  description?: string;
}

interface InvoiceTokenCardProps {
  token: InvoiceTokenData;
  onBuySuccess?: () => void;
  isRealToken?: boolean;
}

export function InvoiceTokenCard({ token, onBuySuccess, isRealToken = false }: InvoiceTokenCardProps) {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  const calculatePricePerToken = () => {
    const loanAmount = parseFloat(token.loanAmount);
    const tokenSupply = parseFloat(token.tokenSupply);
    return loanAmount / tokenSupply;
  };

  const calculateTotalPrice = () => {
    return calculatePricePerToken() * quantity;
  };

  const isCampaignActive = () => {
    const now = Math.floor(Date.now() / 1000);
    return parseInt(token.campaignEndTime) > now;
  };

  const isMatured = () => {
    const now = Math.floor(Date.now() / 1000);
    return parseInt(token.maturityDate) <= now;
  };

  const getStatusColor = () => {
    if (token.isFulfilled) return 'bg-green-100 text-green-800';
    if (isMatured()) return 'bg-yellow-100 text-yellow-800';
    if (isCampaignActive()) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = () => {
    if (token.isFulfilled) return 'Fulfilled';
    if (isMatured()) return 'Matured';
    if (isCampaignActive()) return 'Active';
    return 'Expired';
  };

  const handleBuyTokens = async () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      writeContract({
        address: process.env.NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000',
        abi: [], // Add your contract ABI
        functionName: 'buyInvoiceTokens',
        args: [token.id, quantity],
      });
      
      onBuySuccess?.();
    } catch (error) {
      console.error('Buy tokens error:', error);
      alert(`Failed to buy tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const maxQuantity = Math.min(parseInt(token.availableSupply), 100); // Limit to 100 for UI

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {token.invoiceNumber || `Invoice #${token.id}`}
            </h3>
            {isRealToken ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Live
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Demo
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {token.customerName || 'Anonymous Customer'}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Invoice Value:</span>
          <span className="font-medium">{formatCurrency(token.invoiceValue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Loan Amount:</span>
          <span className="font-medium">{formatCurrency(token.loanAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Unit Value:</span>
          <span className="font-medium">{formatCurrency(token.unitValue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Available Supply:</span>
          <span className="font-medium">{token.availableSupply} / {token.tokenSupply}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Price per Token:</span>
          <span className="font-medium">{formatCurrency(calculatePricePerToken().toString())}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Maturity Date:</span>
          <span className="font-medium">{formatDate(token.maturityDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Campaign Ends:</span>
          <span className="font-medium">{formatDate(token.campaignEndTime)}</span>
        </div>
      </div>

      {token.services && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Services:</p>
          <p className="text-sm text-gray-800">{token.services}</p>
        </div>
      )}

      {token.description && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Description:</p>
          <p className="text-sm text-gray-800 line-clamp-2">{token.description}</p>
        </div>
      )}

      {isCampaignActive() && parseInt(token.availableSupply) > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <label className="text-sm font-medium text-gray-700">Quantity:</label>
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-xs text-gray-500">Max: {maxQuantity}</span>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600">Total Cost:</span>
            <span className="font-semibold text-lg">{formatCurrency(calculateTotalPrice().toString())}</span>
          </div>

          <button
            onClick={handleBuyTokens}
            disabled={isLoading || !address}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Buying...' : 'Buy Tokens'}
          </button>
        </div>
      )}

      {!isCampaignActive() && (
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500 text-center">
            Campaign has ended
          </p>
        </div>
      )}

      {parseInt(token.availableSupply) === 0 && (
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500 text-center">
            All tokens have been sold
          </p>
        </div>
      )}
    </div>
  );
}
