import { cookieStorage, createStorage, http, fallback } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "@reown/appkit/networks";

// Get projectId from https://dashboard.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Get RPC URL from env (fallback to public if not set)
const alchemyUrl = process.env.NEXT_PUBLIC_RPC_URL;
const infuraUrl = process.env.NEXT_PUBLIC_INFURA_URL;

// Configure HTTP transport with rate limiting and retry options
const createOptimizedTransport = (url: string) =>
  http(url, {
    batch: {
      batchSize: 50, // Batch multiple calls together
      wait: 100, // Wait 100ms to collect calls before sending batch (reduces request count)
    },
    retryCount: 2, // Reduced retries
    retryDelay: 2000, // Wait 2 seconds between retries
    timeout: 15000, // 15 second timeout (faster failover)
  });

// Use fallback transport with multiple RPC providers for resilience
const transports = [];

if (alchemyUrl) {
  transports.push(createOptimizedTransport(alchemyUrl));
}

if (infuraUrl) {
  transports.push(createOptimizedTransport(infuraUrl));
}

// Add multiple public RPCs as fallbacks for better reliability
transports.push(createOptimizedTransport("https://ethereum-sepolia-rpc.publicnode.com"));
transports.push(createOptimizedTransport("https://rpc.sepolia.org"));
transports.push(createOptimizedTransport("https://sepolia.gateway.tenderly.co"));
transports.push(createOptimizedTransport("https://1rpc.io/sepolia"));
transports.push(createOptimizedTransport("https://rpc2.sepolia.org"));

export const networks = [sepolia];

//Set up the Wagmi Adapter (Config) with optimized RPC
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [sepolia.id]: fallback(transports, {
      rank: false, // Disabled - ranking causes continuous RPC polling
      retryCount: 2,
    }),
  },
});

export const config = wagmiAdapter.wagmiConfig;
