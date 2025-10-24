'use client';

import { useState, useEffect, useMemo } from 'react';
// import { useReadContract } from 'wagmi';
import { InvoiceTokenCard } from './InvoiceTokenCard';
import { WalletGuard } from './WalletGuard';
// import { useInvoiceTokens } from '@/hooks/useInvoiceTokens';
// import { useInvoiceEvents } from '@/hooks/useInvoiceEvents';
import { useMarketplaceInvoices } from '@/hooks/useMarketplaceInvoices';

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
  invoiceNumber?: string;
  customerName?: string;
  services?: string;
  description?: string;
}

interface FilterOptions {
  status: 'all' | 'active' | 'matured' | 'fulfilled';
  minValue: string;
  maxValue: string;
  sortBy: 'newest' | 'oldest' | 'value_high' | 'value_low' | 'maturity_soon';
}

// Mock data defined outside component to prevent recreating on every render
const MOCK_TOKENS: InvoiceTokenData[] = [
  {
    id: 1,
    loanAmount: '50000',
    invoiceValue: '75000',
    unitValue: '100',
    createdAt: '1700000000',
    campaignDuration: '2592000', // 30 days
    campaignEndTime: '1702592000',
    maturityDate: '1705000000',
    tokenSupply: '750',
    availableSupply: '500',
    isFulfilled: false,
    owner: '0x123...',
    invoiceNumber: 'INV-2024-001',
    customerName: 'TechCorp Inc.',
    services: 'Software Development Services',
    description: 'Custom web application development for enterprise client'
  },
  {
    id: 2,
    loanAmount: '25000',
    invoiceValue: '40000',
    unitValue: '100',
    createdAt: '1699000000',
    campaignDuration: '2592000',
    campaignEndTime: '1701592000',
    maturityDate: '1704000000',
    tokenSupply: '400',
    availableSupply: '0',
    isFulfilled: false,
    owner: '0x456...',
    invoiceNumber: 'INV-2024-002',
    customerName: 'Manufacturing Co.',
    services: 'Equipment Supply',
    description: 'Industrial equipment supply and installation'
  },
  {
    id: 3,
    loanAmount: '100000',
    invoiceValue: '150000',
    unitValue: '100',
    createdAt: '1698000000',
    campaignDuration: '2592000',
    campaignEndTime: '1700592000',
    maturityDate: '1703000000',
    tokenSupply: '1500',
    availableSupply: '200',
    isFulfilled: true,
    owner: '0x789...',
    invoiceNumber: 'INV-2024-003',
    customerName: 'Construction Ltd.',
    services: 'Building Construction',
    description: 'Commercial building construction project'
  }
];

export function Marketplace() {
  const [filteredTokens, setFilteredTokens] = useState<InvoiceTokenData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    minValue: '',
    maxValue: '',
    sortBy: 'newest'
  });

  // Import the useMarketplaceInvoices hook at the top
  const { invoices: realTokens, isLoading: realTokensLoading, error: realTokensError, refresh: refreshTokens } = useMarketplaceInvoices();
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 Marketplace Debug:', {
      realTokensLength: realTokens.length,
      isLoading: realTokensLoading,
      error: realTokensError,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      contractAddress: process.env.NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS,
      usdcAddress: process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS,
      kycAddress: process.env.NEXT_PUBLIC_KYC_REGISTRY_CONTRACT_ADDRESS,
      walletConnectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ? 'Set' : 'Not set'
    });
  }, [realTokens, realTokensLoading, realTokensError]);

  // Only real tokens; if none, show empty state
  const allTokens = useMemo(() => realTokens, [realTokens]);
  const isLoading = realTokensLoading;

  useEffect(() => {
    console.log('Marketplace useEffect triggered', { allTokensLength: allTokens.length, searchTerm, filters });
    
    // Skip if no tokens to avoid unnecessary processing
    if (allTokens.length === 0) {
      setFilteredTokens([]);
      return;
    }
    
    let filtered = [...allTokens];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(token =>
        token.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.services?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      const now = Math.floor(Date.now() / 1000);
      filtered = filtered.filter(token => {
        switch (filters.status) {
          case 'active':
            return parseInt(token.campaignEndTime) > now && !token.isFulfilled;
          case 'matured':
            return parseInt(token.maturityDate) <= now && !token.isFulfilled;
          case 'fulfilled':
            return token.isFulfilled;
          default:
            return true;
        }
      });
    }

    // Value range filter
    // Values are in base units (1e6). Convert for comparisons with USD inputs.
    if (filters.minValue) {
      const min = parseFloat(filters.minValue) * 1_000_000;
      filtered = filtered.filter(token => 
        parseFloat(token.invoiceValue) >= min
      );
    }
    if (filters.maxValue) {
      const max = parseFloat(filters.maxValue) * 1_000_000;
      filtered = filtered.filter(token => 
        parseFloat(token.invoiceValue) <= max
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return parseInt(b.createdAt) - parseInt(a.createdAt);
        case 'oldest':
          return parseInt(a.createdAt) - parseInt(b.createdAt);
        case 'value_high':
          return parseFloat(b.invoiceValue) - parseFloat(a.invoiceValue);
        case 'value_low':
          return parseFloat(a.invoiceValue) - parseFloat(b.invoiceValue);
        case 'maturity_soon':
          return parseInt(a.maturityDate) - parseInt(b.maturityDate);
        default:
          return 0;
      }
    });

    setFilteredTokens(filtered);
  }, [allTokens, searchTerm, filters]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      status: 'all',
      minValue: '',
      maxValue: '',
      sortBy: 'newest'
    });
  };

  const handleRefreshTokens = () => {
    refreshTokens();
  };

  return (
    <WalletGuard requireConnection={false}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Token Marketplace</h1>
              <p className="text-gray-600">
                Discover and invest in invoice tokens from verified businesses
              </p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>Real tokens: {realTokens.length}</span>
                <span>Demo tokens: {MOCK_TOKENS.length}</span>
                <span>Total: {allTokens.length}</span>
                {realTokensError && (
                  <span className="text-red-500">⚠️ Error loading real tokens</span>
                )}
                {!process.env.NEXT_PUBLIC_API_URL && (
                  <span className="text-yellow-600">⚠️ API URL not configured</span>
                )}
                {!process.env.NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS && (
                  <span className="text-yellow-600">⚠️ Contract address not configured</span>
                )}
              </div>
            </div>
            <button
              onClick={handleRefreshTokens}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="matured">Matured</option>
                <option value="fulfilled">Fulfilled</option>
              </select>
            </div>

            {/* Min Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Value ($)
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minValue}
                onChange={(e) => handleFilterChange('minValue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Value ($)
              </label>
              <input
                type="number"
                placeholder="No limit"
                value={filters.maxValue}
                onChange={(e) => handleFilterChange('maxValue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="value_high">Highest Value</option>
                <option value="value_low">Lowest Value</option>
                <option value="maturity_soon">Maturity Soon</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefreshTokens}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredTokens.length} of {allTokens.length} invoice tokens
          </p>
        </div>

        {/* Token Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading invoice tokens...</h3>
            <p className="text-gray-600">
              Fetching the latest invoice tokens from the blockchain.
            </p>
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tokens found</h3>
            <p className="text-gray-600">
              {realTokensError ? 
                'Error loading tokens. Please check your connection and try refreshing.' :
                'Try adjusting your search criteria or check back later for new listings.'
              }
            </p>
            {realTokensError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 font-medium">Error Details:</p>
                <p className="text-sm text-red-600">{realTokensError}</p>
                <div className="mt-2 text-xs text-gray-500">
                  <p>API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
                  <p>Contract: {process.env.NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS || 'Not set'}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTokens.map((token) => {
              // Determine if this is a real token (from contract) or mock token
              const isRealToken = realTokens.some(realToken => realToken.id === token.id);
              
              return (
                <InvoiceTokenCard
                  key={`${token.id}-${token.owner}-${token.invoiceNumber || ''}`}
                  token={token}
                  onBuySuccess={handleRefreshTokens}
                  isRealToken={isRealToken}
                />
              );
            })}
          </div>
        )}
        </div>
      </div>
    </WalletGuard>
  );
}
