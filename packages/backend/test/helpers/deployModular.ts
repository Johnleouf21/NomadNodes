import { network } from "hardhat";
import type {
  PropertyRegistry,
  RoomTypeNFT,
  AvailabilityManager,
  BookingManager,
  HostSBT,
  TravelerSBT,
} from "../../types/ethers-contracts";

const { ethers } = await network.connect();

export interface DeployedModularContracts {
  propertyRegistry: PropertyRegistry;
  roomTypeNFT: RoomTypeNFT;
  availabilityManager: AvailabilityManager;
  bookingManager: BookingManager;
}

/**
 * Deploy the modular property management architecture
 * @param hostSBT HostSBT contract instance
 * @param travelerSBT TravelerSBT contract instance
 * @param platform Platform wallet address
 * @param escrowFactory EscrowFactory address (optional)
 * @param reviewRegistry ReviewRegistry address (optional)
 * @returns Deployed contracts
 */
export async function deployModularArchitecture(
  hostSBT: HostSBT,
  travelerSBT: TravelerSBT,
  platform: string,
  escrowFactory?: string,
  reviewRegistry?: string
): Promise<DeployedModularContracts> {
  // 1. Deploy PropertyRegistry
  const PropertyRegistryFactory = await ethers.getContractFactory("PropertyRegistry");
  const propertyRegistry = (await PropertyRegistryFactory.deploy(
    await hostSBT.getAddress(),
    platform
  )) as unknown as PropertyRegistry;
  await propertyRegistry.waitForDeployment();

  // 2. Deploy RoomTypeNFT
  const RoomTypeNFTFactory = await ethers.getContractFactory("RoomTypeNFT");
  const roomTypeNFT = (await RoomTypeNFTFactory.deploy(
    await propertyRegistry.getAddress()
  )) as unknown as RoomTypeNFT;
  await roomTypeNFT.waitForDeployment();

  // 3. Deploy AvailabilityManager
  const AvailabilityManagerFactory = await ethers.getContractFactory("AvailabilityManager");
  const availabilityManager = (await AvailabilityManagerFactory.deploy(
    await roomTypeNFT.getAddress()
  )) as unknown as AvailabilityManager;
  await availabilityManager.waitForDeployment();

  // 4. Deploy BookingManager
  const BookingManagerFactory = await ethers.getContractFactory("BookingManager");
  const bookingManager = (await BookingManagerFactory.deploy(
    await propertyRegistry.getAddress(),
    await roomTypeNFT.getAddress(),
    await availabilityManager.getAddress(),
    await travelerSBT.getAddress()
  )) as unknown as BookingManager;
  await bookingManager.waitForDeployment();

  // 5. Wire up contract references
  await propertyRegistry.setRoomTypeNFT(await roomTypeNFT.getAddress());
  await propertyRegistry.setBookingManager(await bookingManager.getAddress());

  await roomTypeNFT.setAvailabilityManager(await availabilityManager.getAddress());
  await roomTypeNFT.setBookingManager(await bookingManager.getAddress());

  await availabilityManager.setBookingManager(await bookingManager.getAddress());

  // 6. Authorize BookingManager to update TravelerSBT
  await travelerSBT.setAuthorizedUpdater(await bookingManager.getAddress(), true);

  // 7. Set optional addresses
  if (escrowFactory) {
    await bookingManager.setEscrowFactory(escrowFactory);
  }

  if (reviewRegistry) {
    await propertyRegistry.setReviewRegistry(reviewRegistry);
    await bookingManager.setReviewRegistry(reviewRegistry);
  }

  return {
    propertyRegistry,
    roomTypeNFT,
    availabilityManager,
    bookingManager,
  };
}

/**
 * Helper to get all contract addresses as a simple object
 */
export async function getModularAddresses(contracts: DeployedModularContracts) {
  return {
    propertyRegistry: await contracts.propertyRegistry.getAddress(),
    roomTypeNFT: await contracts.roomTypeNFT.getAddress(),
    availabilityManager: await contracts.availabilityManager.getAddress(),
    bookingManager: await contracts.bookingManager.getAddress(),
  };
}
