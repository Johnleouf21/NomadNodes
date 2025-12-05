import { createConfig } from "ponder";

import {
  PropertyRegistryAbi,
  RoomTypeNFTAbi,
  BookingManagerAbi,
  EscrowFactoryAbi,
  ReviewRegistryAbi,
  TravelerSBTAbi,
  HostSBTAbi,
} from "./abis";

// Default to sepolia for production, localhost for development
const chainName = (process.env.PONDER_CHAIN || "sepolia") as "localhost" | "sepolia";

// Debug: Log all env vars to verify they're loaded
console.log("🔍 DEBUG - Environment variables:");
console.log("  PONDER_CHAIN:", process.env.PONDER_CHAIN);
console.log(
  "  PONDER_RPC_URL_11155111:",
  process.env.PONDER_RPC_URL_11155111 ? "SET ✅" : "NOT SET ❌"
);
console.log(
  "  PONDER_RPC_URL_INFURA:",
  process.env.PONDER_RPC_URL_INFURA ? "SET ✅" : "NOT SET ❌"
);
console.log("  DATABASE_SCHEMA:", process.env.DATABASE_SCHEMA);

// RPC URLs with fallback for rate limit resilience
const alchemyUrl = process.env.PONDER_RPC_URL_11155111;
const infuraUrl = process.env.PONDER_RPC_URL_INFURA;

// Validate RPC configuration
if (!alchemyUrl && !infuraUrl) {
  throw new Error(
    "❌ No RPC URL configured! Set PONDER_RPC_URL_11155111 or PONDER_RPC_URL_INFURA environment variable."
  );
}

// Build RPC array with fallback support (Ponder handles failover automatically)
const sepoliaRpcs: string[] = [];
if (alchemyUrl) {
  console.log(`✅ Adding Alchemy RPC: ${alchemyUrl.substring(0, 50)}...`);
  sepoliaRpcs.push(alchemyUrl);
}
if (infuraUrl) {
  console.log(`✅ Adding Infura RPC: ${infuraUrl.substring(0, 50)}...`);
  sepoliaRpcs.push(infuraUrl);
}

// Define chain configurations using Ponder's native API
const chainConfigs = {
  sepolia: {
    id: 11155111,
    rpc: sepoliaRpcs, // Ponder will use these RPCs with automatic fallback
    pollingInterval: 5000, // 5 seconds to reduce RPC load
    maxRequestsPerSecond: 50, // Alchemy/Infura rate limit
  },
  localhost: {
    id: 31337,
    rpc: process.env.PONDER_RPC_URL_31337 ?? "http://127.0.0.1:8545",
    pollingInterval: 1000, // Poll every 1 second for local dev
  },
} as const;

export default createConfig({
  chains: {
    // Only include the selected chain
    [chainName]: chainConfigs[chainName],
  },
  contracts: {
    // PropertyRegistry - tracks property creation and ownership
    PropertyRegistry: {
      chain: chainName,
      abi: PropertyRegistryAbi,
      address: process.env.PROPERTY_REGISTRY_ADDRESS as `0x${string}`,
      startBlock: parseInt(process.env.START_BLOCK || "0"),
    },
    // RoomTypeNFT - tracks room types (ERC1155)
    RoomTypeNFT: {
      chain: chainName,
      abi: RoomTypeNFTAbi,
      address: process.env.ROOM_TYPE_NFT_ADDRESS as `0x${string}`,
      startBlock: parseInt(process.env.START_BLOCK || "0"),
    },
    // BookingManager - tracks all bookings
    BookingManager: {
      chain: chainName,
      abi: BookingManagerAbi,
      address: process.env.BOOKING_MANAGER_ADDRESS as `0x${string}`,
      startBlock: parseInt(process.env.START_BLOCK || "0"),
    },
    // EscrowFactory - tracks escrow creation for payments
    EscrowFactory: {
      chain: chainName,
      abi: EscrowFactoryAbi,
      address: process.env.ESCROW_FACTORY_ADDRESS as `0x${string}`,
      startBlock: parseInt(process.env.START_BLOCK || "0"),
    },
    // ReviewRegistry - tracks reviews
    ReviewRegistry: {
      chain: chainName,
      abi: ReviewRegistryAbi,
      address: process.env.REVIEW_REGISTRY_ADDRESS as `0x${string}`,
      startBlock: parseInt(process.env.START_BLOCK || "0"),
    },
    // TravelerSBT - tracks traveler soulbound tokens and reputation
    TravelerSBT: {
      chain: chainName,
      abi: TravelerSBTAbi,
      address: process.env.TRAVELER_SBT_ADDRESS as `0x${string}`,
      startBlock: parseInt(process.env.START_BLOCK || "0"),
    },
    // HostSBT - tracks host soulbound tokens and reputation
    HostSBT: {
      chain: chainName,
      abi: HostSBTAbi,
      address: process.env.HOST_SBT_ADDRESS as `0x${string}`,
      startBlock: parseInt(process.env.START_BLOCK || "0"),
    },
  },
});
