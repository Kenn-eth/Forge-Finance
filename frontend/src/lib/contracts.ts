import { Address } from 'viem';

// Contract addresses - Anvil deployment addresses
export const CONTRACTS = {
  KYC_REGISTRY: process.env.NEXT_PUBLIC_KYC_CONTRACT_ADDRESS as Address || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  BUSINESS_WALLET_FACTORY: process.env.NEXT_PUBLIC_BUSINESS_WALLET_FACTORY_ADDRESS as Address || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
} as const;

// Contract ABIs - these should match your deployed contracts
export const KYC_REGISTRY_ABI = [
  {
    "inputs": [
      {
        "internalType": "enum IKYCRegistry.Role",
        "name": "role",
        "type": "uint8"
      }
    ],
    "name": "registerUser",
    "outputs": [
      {
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "isVerified",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserRole",
    "outputs": [
      {
        "internalType": "enum IKYCRegistry.Role",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Role enum values matching the contract
export const USER_ROLES = {
  NONE: 0,
  INVESTOR: 1,
  BUSINESS: 2,
} as const;
