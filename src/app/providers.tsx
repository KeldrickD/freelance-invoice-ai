use client;

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, fallback } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { baseSepolia } from "viem/chains";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import "@rainbow-me/rainbowkit/styles.css";

// Enhanced config with MiniKit support
const config = createConfig(
  getDefaultConfig({
    appName: "Freelance Invoice AI",
    projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // Replace with your WalletConnect Project ID
    chains: [baseSepolia],
    connectors:      // Prioritize Coinbase Wallet for better UX
      coinbaseWallet({
        appName: "Freelance Invoice AI",
        jsonRpcUrl: "https://sepolia.base.org",
      }),
      // Removed WalletConnect for cleaner, more native experience
    ],
    transports: {
      [baseSepolia.id]: fallback([
        http("https://sepolia.base.org"),       http("https://base-sepolia.publicnode.com"),
        // Add Alchemy RPC for better reliability and gasless features
        http("https://base-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"),
      ]),
    },
  })
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
    },
  },
});

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY || "YOUR_CDP_API_KEY"}
      chain={baseSepolia}
      projectId="freelance-invoice-ai"
      notificationProxyUrl="/api/notification"
    >
      <WagmiProvider config={config}>
        <RainbowKitProvider 
          chains={[baseSepolia]}
          locale="en-US"
          showRecentTransactions={true}
          coolMode={true}
          theme={{
            accentColor: "#0052FF",
            borderRadius: "medium",
            fontStack: "system",
          }}
        >
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </MiniKitProvider>
  );
} 