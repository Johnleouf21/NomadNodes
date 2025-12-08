"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { wagmiAdapter, projectId } from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { sepolia } from "@reown/appkit/networks";
import { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";

// Set up queryClient with optimized defaults
// Exported for manual cache invalidation after transactions
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus by default - reduces unnecessary requests
      refetchOnWindowFocus: false,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Consider data fresh for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Retry failed requests only twice
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Set up metadata for Reown/WalletConnect
const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL || "https://nomadnodes.com";
};

// Production URL for logo (works with Reown modal)
const LOGO_URL = "https://nomad-nodes-frontend.vercel.app/logo.svg";

const metadata = {
  name: "NomadNodes",
  description: "Decentralized vacation rental platform powered by blockchain",
  url: getBaseUrl(),
  icons: [LOGO_URL],
};

// Create the modal
const _modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [sepolia],
  defaultNetwork: sepolia,
  metadata: metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
});

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;
