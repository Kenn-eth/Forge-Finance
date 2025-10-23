'use client';

import { RegistrationForm } from '@/components/RegistrationForm';
import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { CONTRACTS, KYC_REGISTRY_ABI } from '@/lib/contracts';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RegisterBusinessPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  // Check if user is already registered as business
  const { data: isBusiness, isLoading: isLoadingBusiness } = useReadContract({
    address: CONTRACTS.KYC_REGISTRY,
    abi: KYC_REGISTRY_ABI,
    functionName: 'isBusiness',
    args: address ? [address] : undefined,
  });

  // Check if user is registered as investor
  const { data: isInvestor, isLoading: isLoadingInvestor } = useReadContract({
    address: CONTRACTS.KYC_REGISTRY,
    abi: KYC_REGISTRY_ABI,
    functionName: 'isInvestor',
    args: address ? [address] : undefined,
  });

  // Type the boolean values properly
  const isBusinessRegistered: boolean = Boolean(isBusiness);
  const isInvestorRegistered: boolean = Boolean(isInvestor);

  // Redirect if not connected or already registered as business
  useEffect(() => {
    // Only redirect if we have confirmed data (not loading and not undefined)
    if (!isLoadingBusiness && !isLoadingInvestor) {
      if (!isConnected) {
        router.push('/');
      } else if (isBusinessRegistered === true) {
        router.push('/create');
      } else if (isInvestorRegistered === false) {
        router.push('/');
      }
    }
  }, [isConnected, isBusinessRegistered, isInvestorRegistered, isLoadingBusiness, isLoadingInvestor, router]);

  // Show loading while checking registration status
  if (!isConnected || isLoadingBusiness || isLoadingInvestor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading if user is already registered as business or not registered as investor
  if (isBusiness === true || isInvestor === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Register as a Business</h1>
          <p className="text-gray-600">
            Add business registration to your existing investor account to create invoice tokens
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Complete Business Registration
            </h2>
            <p className="text-gray-600">
              You&apos;re already registered as an investor. Complete your business registration to start creating invoice tokens.
            </p>
          </div>
          
          <RegistrationForm onComplete={() => router.push('/create')} forceShowForm={true} />
        </div>
      </div>
    </div>
  );
}
