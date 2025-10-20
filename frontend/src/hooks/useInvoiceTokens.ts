'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACTS, INVOICE_TOKEN_ABI } from '@/lib/contracts';

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
  // Additional metadata from database
  invoiceNumber?: string;
  customerName?: string;
  customerEmail?: string;
  services?: string;
  description?: string;
  dueDate?: string;
}

interface InvoiceDetails {
  loanAmount: bigint;
  invoiceValue: bigint;
  unitValue: bigint;
  createdAt: bigint;
  createdBy: string;
  campaignDuration: bigint;
  campaignEndTime: bigint;
  maturityDate: bigint;
  tokenSupply: bigint;
  availableSupply: bigint;
  isFulfilled: boolean;
  data: string;
}

export function useInvoiceTokens() {
  const [tokens, setTokens] = useState<InvoiceTokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the current nonce to know how many tokens exist
  const { data: nonce, refetch: refetchNonce, isLoading: nonceLoading } = useReadContract({
    address: CONTRACTS.INVOICE_TOKEN,
    abi: INVOICE_TOKEN_ABI,
    functionName: 'nonce',
  });

  // Fetch token details for each token ID
  const fetchTokenDetails = async (tokenId: number): Promise<InvoiceTokenData | null> => {
    try {
      // Get invoice details from contract
      const invoiceDetails = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contract/invoice-details/${tokenId}`)
        .then(res => res.json())
        .catch(() => null);

      if (!invoiceDetails) {
        console.warn(`No contract details found for token ${tokenId}`);
        return null;
      }

      // Get metadata from database
      const metadata = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/token/${tokenId}`)
        .then(res => res.json())
        .catch(() => null);

      // Combine contract data with metadata
      const tokenData: InvoiceTokenData = {
        id: tokenId,
        loanAmount: invoiceDetails.loanAmount.toString(),
        invoiceValue: invoiceDetails.invoiceValue.toString(),
        unitValue: invoiceDetails.unitValue.toString(),
        createdAt: invoiceDetails.createdAt.toString(),
        campaignDuration: invoiceDetails.campaignDuration.toString(),
        campaignEndTime: invoiceDetails.campaignEndTime.toString(),
        maturityDate: invoiceDetails.maturityDate.toString(),
        tokenSupply: invoiceDetails.tokenSupply.toString(),
        availableSupply: invoiceDetails.availableSupply.toString(),
        isFulfilled: invoiceDetails.isFulfilled,
        owner: invoiceDetails.createdBy,
        // Add metadata if available
        invoiceNumber: metadata?.invoice_number,
        customerName: metadata?.customer_name,
        customerEmail: metadata?.customer_email,
        services: metadata?.services,
        description: metadata?.description,
        dueDate: metadata?.due_date,
      };

      return tokenData;
    } catch (error) {
      console.error(`Error fetching token ${tokenId}:`, error);
      return null;
    }
  };

  // Load all tokens when nonce changes
  useEffect(() => {
    const loadTokens = async () => {
      if (!nonce) {
        // If no nonce, just show empty tokens (backend might not be available)
        setTokens([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tokenCount = Number(nonce);
        
        // If no tokens exist, return empty array
        if (tokenCount === 0) {
          setTokens([]);
          setIsLoading(false);
          return;
        }

        const tokenPromises: Promise<InvoiceTokenData | null>[] = [];

        // Fetch details for all existing tokens (0 to nonce-1)
        for (let i = 0; i < tokenCount; i++) {
          tokenPromises.push(fetchTokenDetails(i));
        }

        const tokenResults = await Promise.all(tokenPromises);
        const validTokens = tokenResults.filter((token): token is InvoiceTokenData => token !== null);

        setTokens(validTokens);
      } catch (error) {
        console.error('Error loading tokens:', error);
        setError('Failed to load invoice tokens');
        // Set empty tokens on error so marketplace can still show mock tokens
        setTokens([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTokens();
  }, [nonce]);

  // Function to refresh tokens (useful after new invoice creation)
  const refreshTokens = useCallback(() => {
    refetchNonce();
  }, [refetchNonce]);

  return {
    tokens,
    isLoading: isLoading || nonceLoading,
    error,
    refreshTokens,
  };
}
