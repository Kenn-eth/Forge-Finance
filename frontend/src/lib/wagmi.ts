import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia, localhost } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Crowdfunding DApp',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
  chains: [localhost, base, baseSepolia],
  ssr: true,
});
