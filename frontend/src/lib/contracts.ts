// Contract integration utilities for Invoice Token Marketplace
import KYCRegistryABI from '../contracts/KYCRegistry.json';
import InvoiceTokenABI from '../contracts/InvoiceTokenVault.json';

export const INVOICE_TOKEN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS || '';
export const KYC_REGISTRY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_KYC_REGISTRY_CONTRACT_ADDRESS || '';

// Contract addresses
export const CONTRACTS = {
  KYC_REGISTRY: KYC_REGISTRY_CONTRACT_ADDRESS as `0x${string}`,
  INVOICE_TOKEN: INVOICE_TOKEN_CONTRACT_ADDRESS as `0x${string}`,
};

// User roles enum
export const USER_ROLES = {
  NONE: 0,
  INVESTOR: 1,
  BUSINESS: 2,
} as const;

// Contract ABI - Imported from contract artifacts
export const INVOICE_TOKEN_ABI = InvoiceTokenABI.abi;

// KYC Registry ABI - Imported from contract artifacts
export const KYC_REGISTRY_ABI = KYCRegistryABI.abi;

// Types for contract data
export interface InvoiceDetails {
  loanAmount: bigint;
  invoiceValue: bigint;
  unitValue: bigint;
  createdAt: bigint;
  campaignDuration: bigint;
  campaignEndTime: bigint;
  maturityDate: bigint;
  tokenSupply: bigint;
  availableSupply: bigint;
  isFulfilled: boolean;
  data: string;
}

export interface InvoiceTokenData {
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
  // Additional metadata that might be stored in data field
  invoiceNumber?: string;
  customerName?: string;
  services?: string;
  description?: string;
}

// Utility functions for contract interaction
export const parseInvoiceDetails = (details: InvoiceDetails, id: number, owner: string): InvoiceTokenData => {
  // Parse additional metadata from the data field if needed
  let metadata = {};
  try {
    if (details.data && details.data !== '0x') {
      // Assuming metadata is stored as JSON string in the data field
      const metadataString = Buffer.from(details.data.slice(2), 'hex').toString();
      metadata = JSON.parse(metadataString);
    }
  } catch (error) {
    console.warn('Failed to parse metadata for token', id, error);
  }

  return {
    id,
    loanAmount: details.loanAmount.toString(),
    invoiceValue: details.invoiceValue.toString(),
    unitValue: details.unitValue.toString(),
    createdAt: details.createdAt.toString(),
    campaignDuration: details.campaignDuration.toString(),
    campaignEndTime: details.campaignEndTime.toString(),
    maturityDate: details.maturityDate.toString(),
    tokenSupply: details.tokenSupply.toString(),
    availableSupply: details.availableSupply.toString(),
    isFulfilled: details.isFulfilled,
    owner,
    ...metadata
  };
};

// Contract interaction hooks (to be used with wagmi)
export const useInvoiceTokens = () => {
  // This would be implemented with wagmi hooks
  // For now, return mock data
  return {
    tokens: [],
    isLoading: false,
    error: null,
    refetch: () => {}
  };
};

export const useBuyInvoiceTokens = () => {
  // This would be implemented with wagmi hooks
  return {
    buyTokens: async (id: number, quantity: number) => {
      console.log('Buying tokens:', id, quantity);
    },
    isLoading: false,
    error: null
  };
};

export const useClaimProfit = () => {
  // This would be implemented with wagmi hooks
  return {
    claimProfit: async (id: number, quantity: number) => {
      console.log('Claiming profit:', id, quantity);
    },
    isLoading: false,
    error: null
  };
};