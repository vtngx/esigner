'use client';

import { WagmiProvider } from 'wagmi';
import { ReactNode, useEffect } from 'react';
import { queryClient } from '../lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';

import { mainnet, sepolia } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: 'esigner',
  projectId: '754b687969692e9e8afd7ba4e637bb78',
  chains: [mainnet, sepolia],
});

export function Providers({ children }: { children: ReactNode }) {
  // prefetch user info once when the app loads; the hook used on pages will
  // pull from cache instead of re-fetching immediately
  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: ['user'] });
  }, []);

  return <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        {children}
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
}
