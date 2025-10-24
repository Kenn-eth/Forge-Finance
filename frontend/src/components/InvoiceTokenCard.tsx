'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { CONTRACTS, INVOICE_TOKEN_ABI, ERC20_ABI } from '@/lib/contracts';

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
  const { openConnectModal } = useConnectModal();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  // Amounts from chain/DB are in USDC base units (6 decimals). Convert for UI.
  const formatCurrency = (amountBaseUnits: string) => {
    const usd = parseFloat(amountBaseUnits) / 1_000_000;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(usd);
  };

  // Price per token should equal unitValue (both are the same concept in this design)
  const pricePerToken = () => (parseFloat(token.unitValue) / 1_000_000);

  const calculateTotalPrice = () => pricePerToken() * quantity;

  // Read current allowance to decide if approval is needed
  const { data: allowanceData } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.INVOICE_TOKEN] : undefined,
    query: { enabled: Boolean(address && CONTRACTS.USDC && CONTRACTS.INVOICE_TOKEN) }
  });

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
      openConnectModal?.();
      return;
    }

    if (!CONTRACTS.USDC || !CONTRACTS.INVOICE_TOKEN) {
      alert('Missing contract addresses. Please set NEXT_PUBLIC_USDC_CONTRACT_ADDRESS and NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS.');
      return;
    }

    setIsLoading(true);
    try {
      // Compute total cost using unitValue (base units) * quantity
      const unitValueBase = BigInt(parseInt(token.unitValue));
      const totalCostBaseUnits = unitValueBase * BigInt(quantity);

      // Current allowance (default to 0 if undefined)
      let currentAllowance = BigInt(0);
      try {
        if (allowanceData !== undefined && allowanceData !== null) {
          currentAllowance = BigInt(allowanceData as unknown as string);
        }
      } catch {}

      // Approve if insufficient allowance
      if (currentAllowance < totalCostBaseUnits) {
        await writeContract({
          address: CONTRACTS.USDC,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACTS.INVOICE_TOKEN, totalCostBaseUnits],
        });
      }

      // Call buyInvoiceTokens(id, quantity)
      await writeContract({
        address: CONTRACTS.INVOICE_TOKEN,
        abi: INVOICE_TOKEN_ABI,
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
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-gray-900 leading-tight">
              {token.invoiceNumber || `Invoice #${token.id}`}
            </h3>
            {isRealToken ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                ✓ Live
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                Demo
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-snug">
            {token.customerName || 'Customer details loading...'}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="space-y-2 mb-3">
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
          <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(pricePerToken())}</span>
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

      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-1">Services:</p>
        <p className="text-sm text-gray-800 leading-snug">
          {token.services || 'Service details loading...'}
        </p>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-1">Description:</p>
        <p className="text-sm text-gray-800 leading-snug line-clamp-2">
          {token.description || 'No additional description provided'}
        </p>
      </div>

      {isCampaignActive() && parseInt(token.availableSupply) > 0 && (
        <div className="border-t pt-3">
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
            <span className="font-semibold text-base">{formatCurrency(calculateTotalPrice().toString())}</span>
          </div>

          <button
            onClick={handleBuyTokens}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {address ? (isLoading ? 'Buying...' : 'Buy Tokens') : 'Connect Wallet'}
          </button>
        </div>
      )}

      {!isCampaignActive() && (
        <div className="border-t pt-3">
          <p className="text-sm text-gray-500 text-center">
            Campaign has ended
          </p>
        </div>
      )}

      {parseInt(token.availableSupply) === 0 && (
        <div className="border-t pt-3">
          <p className="text-sm text-gray-500 text-center">
            All tokens have been sold
          </p>
        </div>
      )}
    </div>
  );
}
