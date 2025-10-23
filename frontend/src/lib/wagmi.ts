import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia, sepolia, mainnet } from 'wagmi/chains';
import { http } from 'viem';

export const config = getDefaultConfig({
  appName: 'Forge Finance',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
  chains: [
    baseSepolia,  // Base testnet - good for testing
    base,         // Base mainnet - for production
    sepolia,      // Ethereum testnet - alternative testing
    mainnet       // Ethereum mainnet - for production
  ],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,
  batch: {
    multicall: {
      wait: 50, // Batch requests for better performance
    },
  },
});
