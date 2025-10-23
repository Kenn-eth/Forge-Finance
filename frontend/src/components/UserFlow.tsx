'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACTS, KYC_REGISTRY_ABI } from '@/lib/contracts';
import dynamic from 'next/dynamic';
const RegistrationForm = dynamic(() => import('./RegistrationForm').then(m => m.RegistrationForm), { ssr: false, loading: () => <div className="h-32 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" /> });
const KYCVerification = dynamic(() => import('./KYCVerification').then(m => m.KYCVerification), { ssr: false, loading: () => <div className="h-24 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" /> });
const WalletDashboard = dynamic(() => import('./WalletDashboard').then(m => m.WalletDashboard), { ssr: false, loading: () => <div className="h-48 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" /> });

type FlowStep = 'connect' | 'register' | 'verify' | 'complete';

export function UserFlow() {
  const { isConnected, address } = useAccount();
  const [currentStep, setCurrentStep] = useState<FlowStep>('connect');
  const [userRole, setUserRole] = useState<'INVESTOR' | 'BUSINESS' | null>(null);

  // Check if user is already registered
  const { data: isBusiness } = useReadContract({
    address: CONTRACTS.KYC_REGISTRY,
    abi: KYC_REGISTRY_ABI,
    functionName: 'isBusiness',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(isConnected && address), staleTime: 30000 },
  });

  const { data: isInvestor } = useReadContract({
    address: CONTRACTS.KYC_REGISTRY,
    abi: KYC_REGISTRY_ABI,
    functionName: 'isInvestor',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(isConnected && address), staleTime: 30000 },
  });

  const { data: isKYCVerified } = useReadContract({
    address: CONTRACTS.KYC_REGISTRY,
    abi: KYC_REGISTRY_ABI,
    functionName: 'getKYCStatus',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(isConnected && address), staleTime: 30000 },
  });

  // Determine current step based on user status
  useEffect(() => {
    if (!isConnected) {
      setCurrentStep('connect');
    } else if (isKYCVerified) {
      setCurrentStep('complete');
    } else if (isBusiness || isInvestor) {
      setCurrentStep('verify');
      setUserRole(isBusiness ? 'BUSINESS' : 'INVESTOR');
    } else {
      setCurrentStep('register');
    }
  }, [isConnected, isBusiness, isInvestor, isKYCVerified]);

  const handleRegistrationComplete = (role: 'INVESTOR' | 'BUSINESS') => {
    setUserRole(role);
    setCurrentStep('verify');
  };

  const handleVerificationComplete = () => {
    setCurrentStep('complete');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'connect':
        return (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Connect your wallet to get started with invoice financing. You&apos;ll need to complete registration and KYC verification to access all features.
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          </div>
        );

      case 'register':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Complete Registration
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Fill out your registration details to get started. Choose your role as either an Investor or Business.
                </p>
              </div>
              <RegistrationForm onComplete={handleRegistrationComplete} />
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  KYC Verification
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Complete your KYC verification to access all platform features. This is required for compliance and security.
                </p>
              </div>
              <KYCVerification 
                userRole={userRole!} 
                onComplete={handleVerificationComplete} 
              />
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Forge Finance!
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Your account is fully verified and ready to use. You can now access all platform features.
              </p>
            </div>
            <WalletDashboard />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to Forge Finance
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            The future of invoice financing is here. Connect businesses with investors through 
            blockchain-powered invoice tokens, enabling faster funding and better returns for everyone.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                For Businesses
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Convert your outstanding invoices into tradeable tokens and get immediate funding without waiting for payment terms.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                For Investors
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Access a new asset class with predictable returns by investing in verified business invoices with transparent terms.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Secure & Transparent
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Built on blockchain technology with KYC verification, smart contracts, and full transaction transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <div className="max-w-lg mx-auto mb-8">
          <div className="flex items-center justify-between relative">
            {[
              { step: 'connect', label: 'Connect' },
              { step: 'register', label: 'Register' },
              { step: 'verify', label: 'Verify' },
              { step: 'complete', label: 'Complete' }
            ].map((item) => {
              const isActive = currentStep === item.step;
              const isCompleted = ['connect', 'register', 'verify'].indexOf(currentStep) > ['connect', 'register', 'verify'].indexOf(item.step);
              
              const renderIcon = () => {
                const iconColor = isCompleted ? 'text-white' : isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500';
                
                if (item.step === 'connect') {
                  return (
                    <svg className={`w-4 h-4 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  );
                } else if (item.step === 'register') {
                  return (
                    <svg className={`w-4 h-4 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  );
                } else if (item.step === 'verify') {
                  return (
                    <svg className={`w-4 h-4 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  );
                } else {
                  return (
                    <svg className={`w-4 h-4 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  );
                }
              };
              
              return (
                <div key={item.step} className="flex flex-col items-center relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-500' 
                      : isActive 
                        ? 'bg-blue-500' 
                        : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {renderIcon()}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
            
            {/* Progress Line */}
            <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ 
                  width: currentStep === 'connect' ? '0%' :
                         currentStep === 'register' ? '33%' :
                         currentStep === 'verify' ? '66%' : '100%'
                }}
              />
            </div>
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}
      </main>
    </div>
  );
}
