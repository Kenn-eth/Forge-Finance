'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { CONTRACTS, KYC_REGISTRY_ABI } from '@/lib/contracts';
// IPFS helpers removed; metadata is mocked locally and hash generation simplified
import { WalletDashboard } from './WalletDashboard';

interface RegistrationFormProps {
  onComplete?: (role: 'INVESTOR' | 'BUSINESS') => void;
  forceShowForm?: boolean; // If true, always show the form regardless of registration status
}

export function RegistrationForm({ onComplete, forceShowForm = false }: RegistrationFormProps = {}) {
  const { address } = useAccount();
  const [role, setRole] = useState<'INVESTOR' | 'BUSINESS'>('INVESTOR');
  const [isLoading, setIsLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    nationality: '',
    residentialAddress: '',
    dateOfBirth: '',
    governmentIdNumber: '',
    occupation: '',
    // Business specific fields
    businessName: '',
    registrationNumber: '',
    businessType: '',
    taxId: '',
    website: '',
    jurisdiction: '',
    sector: '',
    description: '',
    numberOfEmployees: '',
    annualRevenue: '',
    legalStructure: '',
  });

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle successful registration
  if (isSuccess && !showDashboard) {
    setShowDashboard(true);
    if (onComplete) {
      onComplete(role);
    }
  }

  // Check if user is already registered
  const { data: isBusiness, refetch: refetchIsBusiness } = useReadContract({
    address: CONTRACTS.KYC_REGISTRY,
    abi: KYC_REGISTRY_ABI,
    functionName: 'isBusiness',
    args: address ? [address] : undefined,
  });

  const { data: isInvestor, refetch: refetchIsInvestor } = useReadContract({
    address: CONTRACTS.KYC_REGISTRY,
    abi: KYC_REGISTRY_ABI,
    functionName: 'isInvestor',
    args: address ? [address] : undefined,
  });

  // Type the boolean values properly
  const isBusinessRegistered: boolean = Boolean(isBusiness);
  const isInvestorRegistered: boolean = Boolean(isInvestor);

  const { } = useReadContract({
    address: CONTRACTS.KYC_REGISTRY,
    abi: KYC_REGISTRY_ABI,
    functionName: 'isKYCVerified',
    args: address ? [address] : undefined,
  });

  // Auto-select the available role if only one is left
  useEffect(() => {
    if (isBusinessRegistered && !isInvestorRegistered) {
      setRole('INVESTOR');
    } else if (isInvestorRegistered && !isBusinessRegistered) {
      setRole('BUSINESS');
    }
  }, [isBusinessRegistered, isInvestorRegistered]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRegistrationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Validate required fields based on role
      if (role === 'BUSINESS') {
        if (!registrationData.businessName || !registrationData.businessType) {
          throw new Error('Business name and type are required');
        }
      } else {
        if (!registrationData.fullName || !registrationData.email) {
          throw new Error('Full name and email are required');
        }
      }

      // 1. Prepare document metadata
      const documentMetadata = {
        name: `${role.toLowerCase()}_registration_${Date.now()}`,
        fileType: 'application/json',
        size: JSON.stringify(registrationData).length,
        uploadedAt: new Date().toISOString(),
        userAddress: address,
        role: role,
        ...registrationData
      };

      // 2. Previously uploaded to IPFS; now skip and generate a simple hash
      const combined = JSON.stringify({ documentMetadata, registrationData });
      const docHash = `0x${Array.from(new TextEncoder().encode(combined))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 64)}`;

      // 4. Call the KYC contract's registration function
      const functionName = role === 'INVESTOR' ? 'registerInvestor' : 'registerBusiness';
      
      writeContract({
        address: CONTRACTS.KYC_REGISTRY,
        abi: KYC_REGISTRY_ABI,
        functionName: functionName,
        args: [],
      });

      console.log('Registration submitted:', { userAddress: address, role: role, docHash });
      
    } catch (error) {
      console.error('Registration error:', error);
      alert(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Show dashboard only after successful registration, not if already registered
  if (showDashboard) {
    return <WalletDashboard />;
  }

  // If user is already registered as both, show dashboard (unless forceShowForm is true)
  if (isBusinessRegistered && isInvestorRegistered && !forceShowForm) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Registration Complete!</h2>
        <p className="text-gray-600 mb-4">
          You are registered as both an Investor and Business. You can now access all features of the platform.
        </p>
        <div className="flex justify-center space-x-4 mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            ✓ Investor Registered
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            ✓ Business Registered
          </span>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isBusinessRegistered || isInvestorRegistered ? 'Add Additional Role' : 'Complete Your Registration'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {isBusinessRegistered || isInvestorRegistered 
              ? 'You can register for additional roles to access more features'
              : 'Choose your role and provide the required information to get started'
            }
          </p>
          
          {/* Show current registration status */}
          {(isBusinessRegistered || isInvestorRegistered) && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Current Registration Status:</h3>
              <div className="flex justify-center space-x-4">
                {isBusinessRegistered && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                    ✓ Business Registered
                  </span>
                )}
                {isInvestorRegistered && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                    ✓ Investor Registered
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200 text-sm">
              ✅ <strong>Live Mode:</strong> Connected to Anvil local blockchain. Real smart contracts deployed!
            </p>
          </div>
        </div>

        {/* Role Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            I want to register as:
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => !isInvestorRegistered && setRole('INVESTOR')}
              disabled={isInvestorRegistered}
              className={`p-4 rounded-lg border-2 transition-colors ${
                role === 'INVESTOR'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : isInvestorRegistered
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/20 cursor-not-allowed'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  isInvestorRegistered 
                    ? 'bg-green-100 dark:bg-green-900' 
                    : 'bg-green-100 dark:bg-green-900'
                }`}>
                  {isInvestorRegistered ? (
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Investor {isInvestorRegistered && '✓'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {isInvestorRegistered ? 'Already registered' : 'Invest in projects'}
                </p>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => !isBusinessRegistered && setRole('BUSINESS')}
              disabled={isBusinessRegistered}
              className={`p-4 rounded-lg border-2 transition-colors ${
                role === 'BUSINESS'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : isBusinessRegistered
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/20 cursor-not-allowed'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  isBusinessRegistered 
                    ? 'bg-green-100 dark:bg-green-900' 
                    : 'bg-blue-100 dark:bg-blue-900'
                }`}>
                  {isBusinessRegistered ? (
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Business {isBusinessRegistered && '✓'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {isBusinessRegistered ? 'Already registered' : 'Raise funds'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Common Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={registrationData.fullName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={registrationData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={registrationData.phoneNumber}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nationality *
              </label>
              <input
                type="text"
                name="nationality"
                value={registrationData.nationality}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Residential Address *
            </label>
            <textarea
              name="residentialAddress"
              value={registrationData.residentialAddress}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={registrationData.dateOfBirth}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Government ID Number *
              </label>
              <input
                type="text"
                name="governmentIdNumber"
                value={registrationData.governmentIdNumber}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Occupation *
            </label>
            <input
              type="text"
              name="occupation"
              value={registrationData.occupation}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Business-specific fields */}
          {role === 'BUSINESS' && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Business Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={registrationData.businessName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={registrationData.registrationNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Business Type *
                    </label>
                    <select
                      name="businessType"
                      value={registrationData.businessType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select business type</option>
                      <option value="LLC">LLC</option>
                      <option value="Corporation">Corporation</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                      <option value="Non-Profit">Non-Profit</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tax ID *
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      value={registrationData.taxId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={registrationData.website}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Jurisdiction *
                    </label>
                    <input
                      type="text"
                      name="jurisdiction"
                      value={registrationData.jurisdiction}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sector *
                    </label>
                    <select
                      name="sector"
                      value={registrationData.sector}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select sector</option>
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Education">Education</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Legal Structure *
                    </label>
                    <select
                      name="legalStructure"
                      value={registrationData.legalStructure}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select legal structure</option>
                      <option value="LLC">LLC</option>
                      <option value="Corporation">Corporation</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Number of Employees
                    </label>
                    <input
                      type="number"
                      name="numberOfEmployees"
                      value={registrationData.numberOfEmployees}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Annual Revenue (USD)
                    </label>
                    <input
                      type="number"
                      name="annualRevenue"
                      value={registrationData.annualRevenue}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business Description *
                  </label>
                  <textarea
                    name="description"
                    value={registrationData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Describe your business, products, services, and goals..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading || isPending || isConfirming}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading || isPending || isConfirming ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isConfirming ? 'Confirming...' : 'Processing...'}
                </div>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">
                Error: {error.message}
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-600 dark:text-green-400 text-sm mb-3">
                Registration successful! Your account has been created.
              </p>
              <button
                onClick={() => {
                  if (onComplete) {
                    onComplete(role);
                  } else {
                    setShowDashboard(true);
                    refetchIsBusiness();
                    refetchIsInvestor();
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                {onComplete ? 'Continue to KYC Verification' : 'View Dashboard'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
