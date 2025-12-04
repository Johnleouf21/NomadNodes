/**
 * NomadNodes Smart Contracts
 * Centralized export for contract addresses and ABIs
 */

export { CONTRACT_ADDRESSES, type ContractAddresses } from "./addresses";
export { ABIS, type ContractABIs } from "./abis";

// Contract configurations for Wagmi
import { CONTRACT_ADDRESSES } from "./addresses";
import { ABIS } from "./abis";

export const CONTRACTS = {
  // Core Property System
  propertyRegistry: {
    address: CONTRACT_ADDRESSES.propertyRegistry,
    abi: ABIS.propertyRegistry,
  },
  roomTypeNFT: {
    address: CONTRACT_ADDRESSES.roomTypeNFT,
    abi: ABIS.roomTypeNFT,
  },
  availabilityManager: {
    address: CONTRACT_ADDRESSES.availabilityManager,
    abi: ABIS.availabilityManager,
  },
  bookingManager: {
    address: CONTRACT_ADDRESSES.bookingManager,
    abi: ABIS.bookingManager,
  },
  propertyNFTAdapter: {
    address: CONTRACT_ADDRESSES.propertyNFTAdapter,
    abi: ABIS.propertyNFTAdapter,
  },

  // Escrow System
  escrowFactory: {
    address: CONTRACT_ADDRESSES.escrowFactory,
    abi: ABIS.escrowFactory,
  },
  escrowRegistry: {
    address: CONTRACT_ADDRESSES.escrowRegistry,
    abi: ABIS.escrowRegistry,
  },
  escrowDeployer: {
    address: CONTRACT_ADDRESSES.escrowDeployer,
    abi: ABIS.escrowDeployer,
  },
  travelEscrow: {
    // Note: TravelEscrow is created dynamically by EscrowFactory
    // Address will be provided at runtime
    abi: ABIS.travelEscrow,
  },

  // SBT System
  hostSBT: {
    address: CONTRACT_ADDRESSES.hostSBT,
    abi: ABIS.hostSBT,
  },
  travelerSBT: {
    address: CONTRACT_ADDRESSES.travelerSBT,
    abi: ABIS.travelerSBT,
  },

  // Review System
  reviewRegistry: {
    address: CONTRACT_ADDRESSES.reviewRegistry,
    abi: ABIS.reviewRegistry,
  },
  reviewValidator: {
    address: CONTRACT_ADDRESSES.reviewValidator,
    abi: ABIS.reviewValidator,
  },

  // Mock Tokens
  mockERC20: {
    abi: ABIS.mockERC20,
  },
} as const;
