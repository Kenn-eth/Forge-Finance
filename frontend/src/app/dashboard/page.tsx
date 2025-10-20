'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

interface UserToken {
  id: number;
  quantity: number;
  invoiceValue: string;
  maturityDate: string;
  isFulfilled: boolean;
  canClaim: boolean;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [userTokens, setUserTokens] = useState<UserToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      // TODO: Fetch user's tokens from contract
      // For now, using mock data
      const mockTokens: UserToken[] = [
        {
          id: 1,
          quantity: 50,
          invoiceValue: '75000',
          maturityDate: '1705000000',
          isFulfilled: false,
          canClaim: false
        },
        {
          id: 3,
          quantity: 100,
          invoiceValue: '150000',
          maturityDate: '1703000000',
          isFulfilled: true,
          canClaim: true
        }
      ];
      setUserTokens(mockTokens);
      setIsLoading(false);
    }
  }, [isConnected, address]);

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  const handleClaimProfit = async (tokenId: number) => {
    // TODO: Implement claim profit functionality
    console.log('Claiming profit for token:', tokenId);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
            <p className="text-gray-600">Please connect your wallet to view your dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Dashboard</h1>
          <p className="text-gray-600">
            Manage your invoice token investments
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Investments</h3>
            <p className="text-2xl font-bold text-gray-900">
              {userTokens.length}
            </p>
            <p className="text-sm text-gray-500">Active positions</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Available to Claim</h3>
            <p className="text-2xl font-bold text-green-600">
              {userTokens.filter(t => t.canClaim).length}
            </p>
            <p className="text-sm text-gray-500">Matured investments</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Value</h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(
                userTokens
                  .reduce((sum, token) => sum + parseFloat(token.invoiceValue) * (token.quantity / 100), 0)
                  .toString()
              )}
            </p>
            <p className="text-sm text-gray-500">Portfolio value</p>
          </div>
        </div>

        {/* Token Holdings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Token Holdings</h2>
          </div>
          
          {userTokens.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💼</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No investments yet</h3>
              <p className="text-gray-600 mb-4">
                Start investing in invoice tokens from the marketplace.
              </p>
              <a
                href="/marketplace"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Marketplace
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {userTokens.map((token) => (
                <div key={token.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Invoice Token #{token.id}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Quantity: {token.quantity} tokens
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Invoice Value</p>
                          <p className="font-medium">{formatCurrency(token.invoiceValue)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Maturity Date</p>
                          <p className="font-medium">{formatDate(token.maturityDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            token.isFulfilled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {token.isFulfilled ? 'Fulfilled' : 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {token.canClaim && (
                      <button
                        onClick={() => handleClaimProfit(token.id)}
                        className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Claim Profit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

