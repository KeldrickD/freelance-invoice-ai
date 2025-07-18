'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import '@rainbow-me/rainbowkit/styles.css';

// Create a query client
const queryClient = new QueryClient();

// Wagmi configuration with Base chain
const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});

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