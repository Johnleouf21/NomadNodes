/**
 * Contract ABIs
 * Auto-generated from Hardhat artifacts
 */

// Core Property System
import propertyRegistryAbi from "./abis/PropertyRegistry.json";
import roomTypeNFTAbi from "./abis/RoomTypeNFT.json";
import availabilityManagerAbi from "./abis/AvailabilityManager.json";
import bookingManagerAbi from "./abis/BookingManager.json";
import propertyNFTAdapterAbi from "./abis/PropertyNFTAdapter.json";

// Escrow System
import escrowFactoryAbi from "./abis/EscrowFactory.json";
import escrowRegistryAbi from "./abis/EscrowRegistry.json";
import escrowDeployerAbi from "./abis/EscrowDeployer.json";
import travelEscrowAbi from "./abis/TravelEscrow.json";

// SBT System
import hostSBTAbi from "./abis/HostSBT.json";
import travelerSBTAbi from "./abis/TravelerSBT.json";

// Review System
import reviewRegistryAbi from "./abis/ReviewRegistry.json";
import reviewValidatorAbi from "./abis/ReviewValidator.json";

// Mock Tokens
import mockERC20Abi from "./abis/MockERC20.json";

export const ABIS = {
  // Core Property System
  propertyRegistry: propertyRegistryAbi,
  roomTypeNFT: roomTypeNFTAbi,
  availabilityManager: availabilityManagerAbi,
  bookingManager: bookingManagerAbi,
  propertyNFTAdapter: propertyNFTAdapterAbi,

  // Escrow System
  escrowFactory: escrowFactoryAbi,
  escrowRegistry: escrowRegistryAbi,
  escrowDeployer: escrowDeployerAbi,
  travelEscrow: travelEscrowAbi,

  // SBT System
  hostSBT: hostSBTAbi,
  travelerSBT: travelerSBTAbi,

  // Review System
  reviewRegistry: reviewRegistryAbi,
  reviewValidator: reviewValidatorAbi,

  // Mock Tokens
  mockERC20: mockERC20Abi,
} as const;

export type ContractABIs = typeof ABIS;
