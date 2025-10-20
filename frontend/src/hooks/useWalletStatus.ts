'use client';

import { useAccount, useBalance, useChainId } from 'wagmi';
import { useMemo } from 'react';

export function useWalletStatus() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const chainId = useChainId();

  const status = useMemo(() => {
    if (isConnecting) return 'connecting';
    if (isDisconnected) return 'disconnected';
    if (isConnected) return 'connected';
    return 'unknown';
  }, [isConnecting, isDisconnected, isConnected]);

  const isSupportedChain = useMemo(() => {
    // Supported chain IDs: mainnet, sepolia, base, base-sepolia
    const supportedChains = [1, 11155111, 8453, 84532];
    return supportedChains.includes(chainId);
  }, [chainId]);

  const shortAddress = useMemo(() => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  return {
    address,
    shortAddress,
    isConnected,
    isConnecting,
    isDisconnected,
    status,
    balance,
    chainId,
    isSupportedChain,
  };
}
