import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia, sepolia, mainnet } from 'wagmi/chains';
import { http } from 'viem';

// Use a valid WalletConnect Project ID
// Get one for free at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'c5b4f0a8c8f1d7e8a9c0f2b3d8e1f4a7';

export const config = getDefaultConfig({
  appName: 'Forge Finance',
  projectId,
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
