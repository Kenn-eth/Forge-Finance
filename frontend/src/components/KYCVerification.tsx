'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { CONTRACTS, KYC_REGISTRY_ABI } from '@/lib/contracts';

interface KYCVerificationProps {
  userRole: 'INVESTOR' | 'BUSINESS';
  onComplete: () => void;
}

export function KYCVerification({ userRole, onComplete }: KYCVerificationProps) {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'info' | 'verify' | 'complete'>('info');

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Check current KYC status
  const { refetch: refetchKYCStatus } = useReadContract({
    address: CONTRACTS.KYC_REGISTRY,
    abi: KYC_REGISTRY_ABI,
    functionName: 'getKYCStatus',
    args: address ? [address] : undefined,
  });

  const handleVerifyKYC = async () => {
    if (!address) {
      alert('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setVerificationStep('verify');

    try {
      writeContract({
        address: CONTRACTS.KYC_REGISTRY,
        abi: KYC_REGISTRY_ABI,
        functionName: 'verifyKYC',
        args: [address],
      });
    } catch (error) {
      console.error('KYC verification error:', error);
      alert(`KYC verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setVerificationStep('info');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful transaction
  if (isSuccess && verificationStep === 'verify') {
    setVerificationStep('complete');
    refetchKYCStatus();
    setTimeout(() => {
      onComplete();
    }, 2000);
  }

  if (verificationStep === 'info') {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                KYC Verification Required
              </h3>
              <p className="text-blue-800 dark:text-blue-200 mb-4">
                To complete your {userRole.toLowerCase()} registration and access all platform features, 
                you need to complete KYC (Know Your Customer) verification.
              </p>
              <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <p>• This process is required for regulatory compliance</p>
                <p>• Your information is securely stored and encrypted</p>
                <p>• Verification typically takes a few minutes</p>
                <p>• You&apos;ll be able to access all features once verified</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">What happens next?</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300">Click &quot;Verify KYC&quot; to initiate the verification process</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300">Confirm the transaction in your wallet</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">3</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300">Wait for transaction confirmation</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-green-600 dark:text-green-400">✓</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300">Access all platform features</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleVerifyKYC}
            disabled={isLoading || isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            {isLoading || isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Verify KYC</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 dark:text-red-200 font-medium">Verification Failed</span>
            </div>
            <p className="text-red-700 dark:text-red-300 mt-1 text-sm">
              {error.message || 'An error occurred during verification. Please try again.'}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (verificationStep === 'verify') {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Verifying KYC...
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Please wait while we process your KYC verification. This may take a few moments.
          </p>
        </div>
        
        {hash && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Transaction Hash:</p>
            <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
              {hash}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (verificationStep === 'complete') {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            KYC Verification Complete!
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Your KYC verification has been successfully completed. You now have access to all platform features.
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800 dark:text-green-200 font-medium">
              Redirecting to dashboard...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
