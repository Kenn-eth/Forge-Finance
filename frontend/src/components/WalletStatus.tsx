'use client';

import { useWalletStatus } from '@/hooks/useWalletStatus';
import { useAccount } from 'wagmi';

export function WalletStatus() {
  const { address, isConnected, balance, chainId, isSupportedChain } = useWalletStatus();
  const { isConnecting } = useAccount();

  if (isConnecting) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Connecting wallet...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-800">Wallet Not Connected</p>
            <p className="text-xs text-yellow-600">Connect your wallet to access all features</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Wallet Connected</p>
            <p className="text-xs text-gray-500 font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
          </div>
        </div>
        
        <div className="text-right">
          {balance && (
            <p className="text-sm font-medium text-gray-900">
              {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
            </p>
          )}
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isSupportedChain ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <p className="text-xs text-gray-500">
              {chainId === 1 ? 'Ethereum' : 
               chainId === 11155111 ? 'Sepolia' :
               chainId === 8453 ? 'Base' :
               chainId === 84532 ? 'Base Sepolia' :
               `Chain ${chainId}`}
            </p>
          </div>
        </div>
      </div>
      
      {!isSupportedChain && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-xs text-red-600">
            ⚠️ Unsupported network. Please switch to a supported network.
          </p>
        </div>
      )}
    </div>
  );
}
