'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { RainbowKitProvider, getDefaultConfig, lightTheme } from '@rainbow-me/rainbowkit';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import '@rainbow-me/rainbowkit/styles.css';

const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  connectors: getDefaultConfig({
    appName: 'Freelance Invoice AI',
    projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
    chains: [baseSepolia],
  }).connectors,
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY || 'YOUR_CDP_API_KEY'}
      chain={baseSepolia}
      projectId="freelance-invoice-ai"
      notificationProxyUrl="/api/notification"
    >
      <WagmiProvider config={config}>
        <RainbowKitProvider theme={lightTheme()} coolMode showRecentTransactions locale="en-US">
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </MiniKitProvider>
  );
} 