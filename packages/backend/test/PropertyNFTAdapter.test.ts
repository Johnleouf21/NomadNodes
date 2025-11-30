import { expect } from "chai";
import { network } from "hardhat";
import type {
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

describe("PropertyNFTAdapter", function () {
  let propertyNFTAdapter: PropertyNFTAdapter;
  let propertyRegistry: PropertyRegistry;
  let roomTypeNFT: RoomTypeNFT;
  let availabilityManager: AvailabilityManager;
  let bookingManager: BookingManager;
  let hostSBT: HostSBT;
  let travelerSBT: TravelerSBT;
  let host: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let traveler: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let platform: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let tokenId: bigint;
  let checkIn: number;
  let checkOut: number;

  beforeEach(async function () {
    [, host, traveler, platform] = await ethers.getSigners();

    // Deploy SBTs
    const TravelerSBTFactory = await ethers.getContractFactory("TravelerSBT");
    travelerSBT = (await TravelerSBTFactory.deploy()) as unknown as TravelerSBT;
    await travelerSBT.waitForDeployment();

    const HostSBTFactory = await ethers.getContractFactory("HostSBT");
    hostSBT = (await HostSBTFactory.deploy()) as unknown as HostSBT;
    await hostSBT.waitForDeployment();

    await travelerSBT.mint(traveler.address);
    await hostSBT.mint(host.address);

    // Deploy PropertyRegistry
    const PropertyRegistryFactory = await ethers.getContractFactory("PropertyRegistry");
    propertyRegistry = (await PropertyRegistryFactory.deploy(
      await hostSBT.getAddress(),
      platform.address
    )) as unknown as PropertyRegistry;
    await propertyRegistry.waitForDeployment();

    await hostSBT.setAuthorizedUpdater(await propertyRegistry.getAddress(), true);

    // Deploy RoomTypeNFT
    const RoomTypeNFTFactory = await ethers.getContractFactory("RoomTypeNFT");
    roomTypeNFT = (await RoomTypeNFTFactory.deploy(
      await propertyRegistry.getAddress()
    )) as unknown as RoomTypeNFT;
    await roomTypeNFT.waitForDeployment();

    // Deploy AvailabilityManager
    const AvailabilityManagerFactory = await ethers.getContractFactory("AvailabilityManager");
    availabilityManager = (await AvailabilityManagerFactory.deploy(
      await roomTypeNFT.getAddress()
    )) as unknown as AvailabilityManager;
    await availabilityManager.waitForDeployment();

    // Deploy BookingManager
    const BookingManagerFactory = await ethers.getContractFactory("BookingManager");
    bookingManager = (await BookingManagerFactory.deploy(
      await propertyRegistry.getAddress(),
      await roomTypeNFT.getAddress(),
      await availabilityManager.getAddress(),
      await travelerSBT.getAddress()
    )) as unknown as BookingManager;
    await bookingManager.waitForDeployment();

    // Deploy PropertyNFTAdapter
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

    // Create property and room type
    await propertyRegistry.connect(host).createProperty("ipfs://property", "hotel", "Paris");
    await roomTypeNFT.connect(host).addRoomType(
      1, // propertyId
      "Standard Room",
      "ipfs://room",
      100, // pricePerNight
      20, // cleaningFee
      2, // maxGuests
      3 // totalSupply
    );

    tokenId = await roomTypeNFT.encodeTokenId(1, 1);

    // Set availability
    const now = await time.latest();
    checkIn = Math.floor(now / 86400) * 86400 + 86400;
    checkOut = checkIn + 86400 * 3;

    await availabilityManager.connect(host).setAvailability(tokenId, 0, checkIn, checkOut, true);
  });

  describe("Deployment", function () {
    it("should deploy with correct immutable addresses", async function () {
      expect(await propertyNFTAdapter.propertyRegistry()).to.equal(
        await propertyRegistry.getAddress()
      );
      expect(await propertyNFTAdapter.roomTypeNFT()).to.equal(await roomTypeNFT.getAddress());
      expect(await propertyNFTAdapter.availabilityManager()).to.equal(
        await availabilityManager.getAddress()
      );
      expect(await propertyNFTAdapter.bookingManager()).to.equal(await bookingManager.getAddress());
    });
  });

  describe("Property Functions (delegate to PropertyRegistry)", function () {
    it("should get property owner", async function () {
      const propertyOwnerAddress = await propertyNFTAdapter.propertyOwner(1);
      expect(propertyOwnerAddress).to.equal(host.address);
    });
  });

  describe("TokenId Functions", function () {
    it("should decode tokenId", async function () {
      const [propertyId, roomTypeId] = await propertyNFTAdapter.decodeTokenId(tokenId);
      expect(propertyId).to.equal(1);
      expect(roomTypeId).to.equal(1);
    });
  });

  describe("Availability Functions (delegate to AvailabilityManager)", function () {
    it("should check availability", async function () {
      expect(await propertyNFTAdapter.checkAvailability(tokenId, checkIn, checkOut)).to.be.true;

      // Make unavailable
      await availabilityManager.connect(host).setAvailability(tokenId, 0, checkIn, checkOut, false);

      expect(await propertyNFTAdapter.checkAvailability(tokenId, checkIn, checkOut)).to.be.false;
    });
  });

  describe("Booking Functions (delegate to BookingManager)", function () {
    beforeEach(async function () {
      // Set PropertyNFTAdapter as escrowFactory to allow it to call booking functions
      await bookingManager.setEscrowFactory(await propertyNFTAdapter.getAddress());
    });

    it("should book room via adapter", async function () {
      // Note: bookRoom checks msg.sender == propertyNFTAdapter and uses tx.origin as traveler
      await expect(
        propertyNFTAdapter
          .connect(traveler)
          .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress)
      ).to.emit(bookingManager, "BookingCreated");

      const booking = await propertyNFTAdapter.getBooking(tokenId, 0);
      expect(booking.traveler).to.equal(traveler.address);
      expect(booking.checkInDate).to.equal(checkIn);
    });

    it("should get booking via adapter", async function () {
      await propertyNFTAdapter
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);

      const booking = await propertyNFTAdapter.getBooking(tokenId, 0);
      expect(booking.tokenId).to.equal(tokenId);
      expect(booking.traveler).to.equal(traveler.address);
      expect(booking.totalPrice).to.equal(320); // (100*3) + 20
      expect(booking.status).to.equal(0); // Pending
    });

    it("should set escrow address via adapter", async function () {
      await propertyNFTAdapter
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);

      await propertyNFTAdapter.setEscrowAddress(tokenId, 0, platform.address);

      const booking = await propertyNFTAdapter.getBooking(tokenId, 0);
      expect(booking.escrowAddress).to.equal(platform.address);
    });

    it("should confirm booking via adapter", async function () {
      await propertyNFTAdapter
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);

      await expect(propertyNFTAdapter.confirmBooking(tokenId, 0)).to.emit(
        bookingManager,
        "BookingConfirmed"
      );

      const booking = await propertyNFTAdapter.getBooking(tokenId, 0);
      expect(booking.status).to.equal(1); // Confirmed
    });

    it("should complete booking via adapter", async function () {
      await propertyNFTAdapter
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);
      await propertyNFTAdapter.confirmBooking(tokenId, 0);
      await bookingManager.connect(host).checkInBooking(tokenId, 0);

      await expect(propertyNFTAdapter.completeBooking(tokenId, 0)).to.emit(
        bookingManager,
        "BookingCompleted"
      );

      const booking = await propertyNFTAdapter.getBooking(tokenId, 0);
      expect(booking.status).to.equal(3); // Completed
    });

    it("should cancel booking via adapter", async function () {
      await propertyNFTAdapter
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);

      await expect(propertyNFTAdapter.connect(traveler).cancelBooking(tokenId, 0)).to.emit(
        bookingManager,
        "BookingCancelled"
      );

      const booking = await propertyNFTAdapter.getBooking(tokenId, 0);
      expect(booking.status).to.equal(4); // Cancelled
    });
  });

  describe("Rating Functions (delegate to PropertyRegistry)", function () {
    it("should update property rating via adapter", async function () {
      // Set PropertyNFTAdapter as reviewRegistry to allow it to update ratings
      await propertyRegistry.setReviewRegistry(await propertyNFTAdapter.getAddress());

      await expect(propertyNFTAdapter.updatePropertyRating(1, 5)).to.emit(
        propertyRegistry,
        "PropertyRated"
      );

      const property = await propertyRegistry.getProperty(1);
      expect(property.averageRating).to.equal(500); // 5.00 * 100
    });
  });
});
