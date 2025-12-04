/**
 * Smart Contract Addresses
 * Loaded from environment variables
 * Network: Localhost (31337) or Sepolia (11155111)
 */

export const CONTRACT_ADDRESSES = {
  // Core Property System
  propertyRegistry: (process.env.NEXT_PUBLIC_PROPERTY_REGISTRY_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  roomTypeNFT: (process.env.NEXT_PUBLIC_ROOM_TYPE_NFT_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  availabilityManager: (process.env.NEXT_PUBLIC_AVAILABILITY_MANAGER_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  bookingManager: (process.env.NEXT_PUBLIC_BOOKING_MANAGER_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  propertyNFTAdapter: (process.env.NEXT_PUBLIC_PROPERTY_NFT_ADAPTER_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,

  // Escrow System
  escrowFactory: (process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  escrowRegistry: (process.env.NEXT_PUBLIC_ESCROW_REGISTRY_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  escrowDeployer: (process.env.NEXT_PUBLIC_ESCROW_DEPLOYER_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,

  // SBT System
  hostSBT: (process.env.NEXT_PUBLIC_HOST_SBT_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  travelerSBT: (process.env.NEXT_PUBLIC_TRAVELER_SBT_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,

  // Review System
  reviewRegistry: (process.env.NEXT_PUBLIC_REVIEW_REGISTRY_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  reviewValidator: (process.env.NEXT_PUBLIC_REVIEW_VALIDATOR_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,

  // Stablecoins (Mock)
  usdc: (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  eurc: (process.env.NEXT_PUBLIC_EURC_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

export type ContractAddresses = typeof CONTRACT_ADDRESSES;
