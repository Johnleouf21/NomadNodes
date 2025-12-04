"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { wagmiAdapter, projectId } from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { sepolia } from "@reown/appkit/networks";
import { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";

// Set up queryClient with optimized defaults
const queryClient = new QueryClient({
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

// Set up metadata
const metadata = {
  name: "NomadNodes",
  description: "Decentralized vacation rental platform powered by blockchain",
  url: typeof window !== "undefined" ? window.location.origin : "https://nomadnodes.com",
  icons: ["https://nomadnodes.com/logo.png"], // TODO: Update with actual logo URL
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
