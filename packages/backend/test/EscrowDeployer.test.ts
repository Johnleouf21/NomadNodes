import { expect } from "chai";
import { network } from "hardhat";
import type {
  EscrowDeployer,
  MockERC20,
  PropertyNFTAdapter,
  PropertyRegistry,
  RoomTypeNFT,
  AvailabilityManager,
  BookingManager,
  HostSBT,
  TravelerSBT,
} from "../types/ethers-contracts";

const { ethers, networkHelpers } = await network.connect();
const { time } = networkHelpers;

describe("EscrowDeployer", function () {
  let escrowDeployer: EscrowDeployer;
  let usdc: MockERC20;
  let propertyNFTAdapter: PropertyNFTAdapter;
  let propertyRegistry: PropertyRegistry;
  let roomTypeNFT: RoomTypeNFT;
  let availabilityManager: AvailabilityManager;
  let bookingManager: BookingManager;
  let hostSBT: HostSBT;
  let travelerSBT: TravelerSBT;

  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let platform: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let admin: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let host: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let traveler: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let factory: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let backendSigner: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  let tokenId: bigint;
  let checkIn: number;
  let checkOut: number;

  beforeEach(async function () {
    [owner, platform, admin, host, traveler, factory, backendSigner] = await ethers.getSigners();

    // Deploy mock token
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    usdc = (await MockERC20Factory.deploy("USDC", "USDC", 6)) as unknown as MockERC20;
    await usdc.waitForDeployment();

    // Deploy SBTs
    const TravelerSBTFactory = await ethers.getContractFactory("TravelerSBT");
    travelerSBT = (await TravelerSBTFactory.deploy()) as unknown as TravelerSBT;
    await travelerSBT.waitForDeployment();

    const HostSBTFactory = await ethers.getContractFactory("HostSBT");
    hostSBT = (await HostSBTFactory.deploy()) as unknown as HostSBT;
    await hostSBT.waitForDeployment();

    await travelerSBT.mint(traveler.address);
    await hostSBT.mint(host.address);

    // Deploy property system
    const PropertyRegistryFactory = await ethers.getContractFactory("PropertyRegistry");
    propertyRegistry = (await PropertyRegistryFactory.deploy(
      await hostSBT.getAddress(),
      platform.address
    )) as unknown as PropertyRegistry;
    await propertyRegistry.waitForDeployment();

    await hostSBT.setAuthorizedUpdater(await propertyRegistry.getAddress(), true);

    const RoomTypeNFTFactory = await ethers.getContractFactory("RoomTypeNFT");
    roomTypeNFT = (await RoomTypeNFTFactory.deploy(
      await propertyRegistry.getAddress()
    )) as unknown as RoomTypeNFT;
    await roomTypeNFT.waitForDeployment();

    const AvailabilityManagerFactory = await ethers.getContractFactory("AvailabilityManager");
    availabilityManager = (await AvailabilityManagerFactory.deploy(
      await roomTypeNFT.getAddress()
    )) as unknown as AvailabilityManager;
    await availabilityManager.waitForDeployment();

    const BookingManagerFactory = await ethers.getContractFactory("BookingManager");
    bookingManager = (await BookingManagerFactory.deploy(
      await propertyRegistry.getAddress(),
      await roomTypeNFT.getAddress(),
      await availabilityManager.getAddress(),
      await travelerSBT.getAddress()
    )) as unknown as BookingManager;
    await bookingManager.waitForDeployment();

    const PropertyNFTAdapterFactory = await ethers.getContractFactory("PropertyNFTAdapter");
    propertyNFTAdapter = (await PropertyNFTAdapterFactory.deploy(
      await propertyRegistry.getAddress(),
      await roomTypeNFT.getAddress(),
      await availabilityManager.getAddress(),
      await bookingManager.getAddress()
    )) as unknown as PropertyNFTAdapter;
    await propertyNFTAdapter.waitForDeployment();

    // Wire up contracts
    await propertyRegistry.setRoomTypeNFT(await roomTypeNFT.getAddress());
    await propertyRegistry.setBookingManager(await bookingManager.getAddress());
    await roomTypeNFT.setAvailabilityManager(await availabilityManager.getAddress());
    await roomTypeNFT.setBookingManager(await bookingManager.getAddress());
    await availabilityManager.setBookingManager(await bookingManager.getAddress());
    await travelerSBT.setAuthorizedUpdater(await bookingManager.getAddress(), true);
    await bookingManager.setPropertyNFTAdapter(await propertyNFTAdapter.getAddress());

    // Deploy EscrowDeployer
    const EscrowDeployerFactory = await ethers.getContractFactory("EscrowDeployer");
    escrowDeployer = (await EscrowDeployerFactory.deploy()) as unknown as EscrowDeployer;
    await escrowDeployer.waitForDeployment();

    // Set factory address
    await escrowDeployer.setEscrowFactory(factory.address);

    // Create property and room
    await propertyRegistry.connect(host).createProperty("ipfs://property", "hotel", "Paris");
    await roomTypeNFT.connect(host).addRoomType(
      1,
      "Standard Room",
      "ipfs://room",
      100_000000, // 100 USDC (6 decimals)
      20_000000,
      2,
      3
    );

    tokenId = await roomTypeNFT.encodeTokenId(1, 1);

    // Set availability
    const now = await time.latest();
    checkIn = Math.floor(now / 86400) * 86400 + 86400;
    checkOut = checkIn + 86400 * 3;

    await availabilityManager.connect(host).setAvailability(tokenId, 0, checkIn, checkOut, true);
  });

  describe("Deployment", function () {
    it("should deploy with correct owner", async function () {
      expect(await escrowDeployer.owner()).to.equal(owner.address);
    });

    it("should have escrow factory set", async function () {
      expect(await escrowDeployer.escrowFactory()).to.equal(factory.address);
    });
  });

  describe("Admin Functions", function () {
    it("should allow owner to set escrow factory", async function () {
      const newFactory = traveler.address;
      await escrowDeployer.setEscrowFactory(newFactory);
      expect(await escrowDeployer.escrowFactory()).to.equal(newFactory);
    });

    it("should emit event when setting escrow factory", async function () {
      const newFactory = traveler.address;
      await expect(escrowDeployer.setEscrowFactory(newFactory))
        .to.emit(escrowDeployer, "EscrowFactoryUpdated")
        .withArgs(factory.address, newFactory);
    });

    it("should revert if setting zero address", async function () {
      await expect(
        escrowDeployer.setEscrowFactory(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(escrowDeployer, "InvalidAddress");
    });

    it("should revert if non-owner tries to set factory", async function () {
      await expect(
        escrowDeployer.connect(traveler).setEscrowFactory(traveler.address)
      ).to.be.revertedWithCustomError(escrowDeployer, "OwnableUnauthorizedAccount");
    });
  });

  describe("Deploy Escrow", function () {
    it("should deploy escrow when called by factory", async function () {
      const amount = BigInt(320_000000);
      const platformFee = BigInt(24_000000);

      const tx = await escrowDeployer.connect(factory).deployEscrow(
        traveler.address,
        host.address,
        await usdc.getAddress(),
        amount,
        platformFee,
        platform.address,
        admin.address,
        backendSigner.address,
        await propertyNFTAdapter.getAddress(),
        tokenId,
        0, // bookingIndex
        checkIn,
        checkOut
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should emit EscrowDeployed event", async function () {
      const amount = BigInt(320_000000);
      const platformFee = BigInt(24_000000);

      await expect(
        escrowDeployer
          .connect(factory)
          .deployEscrow(
            traveler.address,
            host.address,
            await usdc.getAddress(),
            amount,
            platformFee,
            platform.address,
            admin.address,
            backendSigner.address,
            await propertyNFTAdapter.getAddress(),
            tokenId,
            0,
            checkIn,
            checkOut
          )
      ).to.emit(escrowDeployer, "EscrowDeployed");
    });

    it("should revert if called by non-factory", async function () {
      const amount = BigInt(320_000000);
      const platformFee = BigInt(24_000000);

      await expect(
        escrowDeployer
          .connect(traveler)
          .deployEscrow(
            traveler.address,
            host.address,
            await usdc.getAddress(),
            amount,
            platformFee,
            platform.address,
            admin.address,
            backendSigner.address,
            await propertyNFTAdapter.getAddress(),
            tokenId,
            0,
            checkIn,
            checkOut
          )
      ).to.be.revertedWithCustomError(escrowDeployer, "OnlyEscrowFactory");
    });

    it("should deploy with correct parameters", async function () {
      const amount = BigInt(320_000000);
      const platformFee = BigInt(24_000000);

      const escrowAddress = await escrowDeployer
        .connect(factory)
        .deployEscrow.staticCall(
          traveler.address,
          host.address,
          await usdc.getAddress(),
          amount,
          platformFee,
          platform.address,
          admin.address,
          backendSigner.address,
          await propertyNFTAdapter.getAddress(),
          tokenId,
          0,
          checkIn,
          checkOut
        );

      expect(escrowAddress).to.not.equal(ethers.ZeroAddress);

      // Deploy for real
      await escrowDeployer
        .connect(factory)
        .deployEscrow(
          traveler.address,
          host.address,
          await usdc.getAddress(),
          amount,
          platformFee,
          platform.address,
          admin.address,
          backendSigner.address,
          await propertyNFTAdapter.getAddress(),
          tokenId,
          0,
          checkIn,
          checkOut
        );

      // Get the TravelEscrow contract
      const TravelEscrowFactory = await ethers.getContractFactory("TravelEscrow");
      const escrow = TravelEscrowFactory.attach(escrowAddress);

      // Verify parameters
      expect(await escrow.traveler()).to.equal(traveler.address);
      expect(await escrow.host()).to.equal(host.address);
      expect(await escrow.token()).to.equal(await usdc.getAddress());
      expect(await escrow.amount()).to.equal(amount);
      expect(await escrow.platformFee()).to.equal(platformFee);
    });
  });
});
