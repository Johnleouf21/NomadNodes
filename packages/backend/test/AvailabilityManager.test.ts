import { expect } from "chai";
import { network } from "hardhat";
import type {
  AvailabilityManager,
  RoomTypeNFT,
  PropertyRegistry,
  HostSBT,
} from "../types/ethers-contracts";

const { ethers, networkHelpers } = await network.connect();
const { time } = networkHelpers;

describe("AvailabilityManager", function () {
  let availabilityManager: AvailabilityManager;
  let roomTypeNFT: RoomTypeNFT;
  let propertyRegistry: PropertyRegistry;
  let hostSBT: HostSBT;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let host: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let platform: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let bookingManager: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let tokenId: bigint;

  beforeEach(async function () {
    [owner, host, platform, bookingManager] = await ethers.getSigners();

    // Deploy HostSBT
    const HostSBTFactory = await ethers.getContractFactory("HostSBT");
    hostSBT = (await HostSBTFactory.deploy()) as unknown as HostSBT;
    await hostSBT.waitForDeployment();
    await hostSBT.mint(host.address);

    // Deploy PropertyRegistry
    const PropertyRegistryFactory = await ethers.getContractFactory("PropertyRegistry");
    propertyRegistry = (await PropertyRegistryFactory.deploy(
      await hostSBT.getAddress(),
      platform.address
    )) as unknown as PropertyRegistry;
    await propertyRegistry.waitForDeployment();

    // Authorize PropertyRegistry to update HostSBT
    await hostSBT.setAuthorizedUpdater(await propertyRegistry.getAddress(), true);

    // Deploy RoomTypeNFT
    const RoomTypeNFTFactory = await ethers.getContractFactory("RoomTypeNFT");
    roomTypeNFT = (await RoomTypeNFTFactory.deploy(
      await propertyRegistry.getAddress()
    )) as unknown as RoomTypeNFT;
    await roomTypeNFT.waitForDeployment();

    // Set RoomTypeNFT in PropertyRegistry
    await propertyRegistry.setRoomTypeNFT(await roomTypeNFT.getAddress());

    // Deploy AvailabilityManager
    const AvailabilityManagerFactory = await ethers.getContractFactory("AvailabilityManager");
    availabilityManager = (await AvailabilityManagerFactory.deploy(
      await roomTypeNFT.getAddress()
    )) as unknown as AvailabilityManager;
    await availabilityManager.waitForDeployment();

    // Set AvailabilityManager in RoomTypeNFT
    await roomTypeNFT.setAvailabilityManager(await availabilityManager.getAddress());

    // Set BookingManager
    await availabilityManager.setBookingManager(bookingManager.address);

    // Create a property
    await propertyRegistry.connect(host).createProperty("ipfs://property", "hotel", "Paris");

    // Add a room type
    await roomTypeNFT.connect(host).addRoomType(
      1, // propertyId
      "Standard Room",
      "ipfs://room",
      100, // pricePerNight
      20, // cleaningFee
      2, // maxGuests
      3 // totalSupply (3 units)
    );

    // Get tokenId
    tokenId = await roomTypeNFT.encodeTokenId(1, 1);
  });

  describe("Deployment", function () {
    it("should deploy with correct RoomTypeNFT address", async function () {
      expect(await availabilityManager.roomTypeNFT()).to.equal(await roomTypeNFT.getAddress());
    });

    it("should set bookingManager address", async function () {
      expect(await availabilityManager.bookingManager()).to.equal(bookingManager.address);
    });
  });

  describe("Set Availability (Owner)", function () {
    let startDate: number;
    let endDate: number;

    beforeEach(async function () {
      const now = await time.latest();
      startDate = Math.floor(now / 86400) * 86400; // Normalize to start of day
      endDate = startDate + 86400 * 10; // 10 days
    });

    it("should set availability for date range", async function () {
      await expect(
        availabilityManager.connect(host).setAvailability(tokenId, 0, startDate, endDate, true)
      ).to.emit(availabilityManager, "AvailabilitySet");

      // Check that dates are available
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, startDate, startDate + 86400)).to
        .be.true;
      expect(
        await availabilityManager.isRoomAvailable(
          tokenId,
          0,
          startDate + 86400,
          startDate + 86400 * 2
        )
      ).to.be.true;
    });

    it("should set unavailability for date range", async function () {
      // First set as available
      await availabilityManager.connect(host).setAvailability(tokenId, 0, startDate, endDate, true);

      // Then set as unavailable
      await availabilityManager
        .connect(host)
        .setAvailability(tokenId, 0, startDate, endDate, false);

      expect(await availabilityManager.isRoomAvailable(tokenId, 0, startDate, startDate + 86400)).to
        .be.false;
    });

    it("should revert if not property owner", async function () {
      await expect(
        availabilityManager.connect(owner).setAvailability(tokenId, 0, startDate, endDate, true)
      ).to.be.revertedWith("Not property owner");
    });

    it("should handle multiple units independently", async function () {
      // Set unit 0 as available
      await availabilityManager.connect(host).setAvailability(tokenId, 0, startDate, endDate, true);

      // Set unit 1 as unavailable
      await availabilityManager
        .connect(host)
        .setAvailability(tokenId, 1, startDate, endDate, false);

      expect(await availabilityManager.isRoomAvailable(tokenId, 0, startDate, startDate + 86400)).to
        .be.true;
      expect(await availabilityManager.isRoomAvailable(tokenId, 1, startDate, startDate + 86400)).to
        .be.false;
    });
  });

  describe("Set Availability (BookingManager)", function () {
    let checkIn: number;
    let checkOut: number;

    beforeEach(async function () {
      const now = await time.latest();
      checkIn = Math.floor(now / 86400) * 86400 + 86400;
      checkOut = checkIn + 86400 * 3;

      // Set initial availability
      await availabilityManager.connect(host).setAvailability(tokenId, 0, checkIn, checkOut, true);
    });

    it("should allow BookingManager to set availability", async function () {
      await availabilityManager
        .connect(bookingManager)
        .setAvailability(tokenId, 0, checkIn, checkOut, false);

      expect(await availabilityManager.isRoomAvailable(tokenId, 0, checkIn, checkOut)).to.be.false;
    });

    it("should revert if not BookingManager", async function () {
      await expect(
        availabilityManager.connect(owner).setAvailability(tokenId, 0, checkIn, checkOut, false)
      ).to.be.revertedWith("Not property owner");
    });
  });

  describe("Check Availability", function () {
    let checkIn: number;
    let checkOut: number;

    beforeEach(async function () {
      const now = await time.latest();
      checkIn = Math.floor(now / 86400) * 86400 + 86400;
      checkOut = checkIn + 86400 * 3;
    });

    it("should return true for available room", async function () {
      await availabilityManager.connect(host).setAvailability(tokenId, 0, checkIn, checkOut, true);

      expect(await availabilityManager.isRoomAvailable(tokenId, 0, checkIn, checkOut)).to.be.true;
    });

    it("should return false for unavailable room", async function () {
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, checkIn, checkOut)).to.be.false;
    });

    it("should check entire date range", async function () {
      // Set first 2 days as available, last day as unavailable
      await availabilityManager
        .connect(host)
        .setAvailability(tokenId, 0, checkIn, checkIn + 86400 * 2, true);
      await availabilityManager
        .connect(host)
        .setAvailability(tokenId, 0, checkIn + 86400 * 2, checkOut, false);

      // Entire range should be unavailable if any day is unavailable
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, checkIn, checkOut)).to.be.false;
    });

    it("should use checkAvailability function", async function () {
      await availabilityManager.connect(host).setAvailability(tokenId, 0, checkIn, checkOut, true);

      expect(await availabilityManager.checkAvailability(tokenId, checkIn, checkOut)).to.be.true;
    });

    it("should return false from checkAvailability when no units available", async function () {
      // Don't set any availability - all units unavailable by default
      expect(await availabilityManager.checkAvailability(tokenId, checkIn, checkOut)).to.be.false;
    });

    it("should return false from checkAvailability when partially available", async function () {
      // Set first 2 days as available, last day as unavailable
      await availabilityManager
        .connect(host)
        .setAvailability(tokenId, 0, checkIn, checkIn + 86400 * 2, true);
      await availabilityManager
        .connect(host)
        .setAvailability(tokenId, 0, checkIn + 86400 * 2, checkOut, false);

      // Should return false because not ALL days are available (hits line 269-272 break)
      expect(await availabilityManager.checkAvailability(tokenId, checkIn, checkOut)).to.be.false;
    });
  });

  describe("Get Available Units", function () {
    let checkIn: number;
    let checkOut: number;

    beforeEach(async function () {
      const now = await time.latest();
      checkIn = Math.floor(now / 86400) * 86400 + 86400;
      checkOut = checkIn + 86400 * 3;
    });

    it("should return 0 when no units available", async function () {
      expect(await availabilityManager.getAvailableUnits(tokenId, checkIn, checkOut)).to.equal(0);
    });

    it("should return correct count of available units", async function () {
      // Set 2 units as available
      await availabilityManager.connect(host).setAvailability(tokenId, 0, checkIn, checkOut, true);
      await availabilityManager.connect(host).setAvailability(tokenId, 1, checkIn, checkOut, true);

      expect(await availabilityManager.getAvailableUnits(tokenId, checkIn, checkOut)).to.equal(2);
    });

    it("should return all units when all available", async function () {
      // Set all 3 units as available
      for (let i = 0; i < 3; i++) {
        await availabilityManager
          .connect(host)
          .setAvailability(tokenId, i, checkIn, checkOut, true);
      }

      const availableUnits = await availabilityManager.getAvailableUnits(
        tokenId,
        checkIn,
        checkOut
      );
      expect(Number(availableUnits)).to.equal(3); // All 3 units are available
    });
  });

  describe("Bitmap Storage Edge Cases", function () {
    it("should handle availability across multiple bitmap chunks", async function () {
      const now = await time.latest();
      const startDate = Math.floor(now / 86400) * 86400;

      // Set 300 days of availability (crosses bitmap chunk boundary at 256 days)
      const endDate = startDate + 86400 * 300;

      await availabilityManager.connect(host).setAvailability(tokenId, 0, startDate, endDate, true);

      // Check availability in first chunk
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, startDate, startDate + 86400)).to
        .be.true;

      // Check availability in second chunk (after day 256)
      const day260 = startDate + 86400 * 260;
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, day260, day260 + 86400)).to.be
        .true;
    });

    it("should handle single day availability", async function () {
      const now = await time.latest();
      const day = Math.floor(now / 86400) * 86400 + 86400;

      await availabilityManager.connect(host).setAvailability(tokenId, 0, day, day + 86400, true);

      expect(await availabilityManager.isRoomAvailable(tokenId, 0, day, day + 86400)).to.be.true;
    });
  });

  describe("Admin Functions", function () {
    it("should allow owner to set BookingManager", async function () {
      const newBookingManager = owner.address;
      await availabilityManager.setBookingManager(newBookingManager);

      expect(await availabilityManager.bookingManager()).to.equal(newBookingManager);
    });

    it("should revert if setting BookingManager to zero address", async function () {
      await expect(
        availabilityManager.setBookingManager(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(availabilityManager, "InvalidAddress");
    });

    it("should allow owner to set RoomTypeNFT", async function () {
      const newRoomTypeNFT = owner.address;
      await availabilityManager.setRoomTypeNFT(newRoomTypeNFT);

      expect(await availabilityManager.roomTypeNFT()).to.equal(newRoomTypeNFT);
    });

    it("should revert if setting RoomTypeNFT to zero address", async function () {
      await expect(
        availabilityManager.setRoomTypeNFT(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(availabilityManager, "InvalidAddress");
    });

    it("should revert if not owner", async function () {
      await expect(
        availabilityManager.connect(host).setBookingManager(host.address)
      ).to.be.revertedWithCustomError(availabilityManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("Gas Optimization Tests", function () {
    it("should efficiently handle large date ranges", async function () {
      const now = await time.latest();
      const startDate = Math.floor(now / 86400) * 86400;
      const endDate = startDate + 86400 * 365; // 1 year

      // This should complete without running out of gas
      await expect(
        availabilityManager.connect(host).setAvailability(tokenId, 0, startDate, endDate, true)
      ).to.emit(availabilityManager, "AvailabilitySet");
    });
  });

  describe("Invalid Date Range Error Coverage", function () {
    let checkIn: number;
    let checkOut: number;

    beforeEach(async function () {
      const now = await time.latest();
      checkIn = Math.floor(now / 86400) * 86400 + 86400;
      checkOut = checkIn + 86400 * 3;
    });

    it("should revert setAvailability with invalid date range", async function () {
      await expect(
        availabilityManager.connect(host).setAvailability(tokenId, 0, checkOut, checkIn, true)
      ).to.be.revertedWithCustomError(availabilityManager, "InvalidDateRange");
    });

    it("should return false from isRoomAvailable with invalid date range", async function () {
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, checkOut, checkIn)).to.be.false;
    });

    it("should return 0 from getAvailableUnits with invalid date range", async function () {
      expect(await availabilityManager.getAvailableUnits(tokenId, checkOut, checkIn)).to.equal(0);
    });

    it("should revert from getAvailableUnits with invalid token ID", async function () {
      const invalidTokenId = 999999n;
      await expect(
        availabilityManager.getAvailableUnits(invalidTokenId, checkIn, checkOut)
      ).to.be.revertedWithCustomError(roomTypeNFT, "RoomTypeNotFound");
    });

    it("should return false from checkAvailability with invalid date range", async function () {
      expect(await availabilityManager.checkAvailability(tokenId, checkOut, checkIn)).to.be.false;
    });

    it("should revert from checkAvailability with invalid token ID", async function () {
      const invalidTokenId = 999999n;
      await expect(
        availabilityManager.checkAvailability(invalidTokenId, checkIn, checkOut)
      ).to.be.revertedWithCustomError(roomTypeNFT, "RoomTypeNotFound");
    });
  });

  describe("Bulk Availability", function () {
    let startDate: number;
    let endDate: number;

    beforeEach(async function () {
      const now = await time.latest();
      startDate = Math.floor(now / 86400) * 86400 + 86400; // Normalize to start of day
      endDate = startDate + 86400 * 5; // 5 days
    });

    it("should set bulk availability for multiple units", async function () {
      // Set 2 out of 3 units as available
      await expect(
        availabilityManager.connect(host).setBulkAvailability(tokenId, 2, startDate, endDate)
      )
        .to.emit(availabilityManager, "AvailabilitySet")
        .to.emit(availabilityManager, "AvailabilitySet")
        .to.emit(availabilityManager, "AvailabilitySet");

      // Unit 0 and 1 should be available
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, startDate, endDate)).to.be.true;
      expect(await availabilityManager.isRoomAvailable(tokenId, 1, startDate, endDate)).to.be.true;

      // Unit 2 should be unavailable
      expect(await availabilityManager.isRoomAvailable(tokenId, 2, startDate, endDate)).to.be.false;
    });

    it("should set all units as available when numUnits equals totalSupply", async function () {
      // totalSupply is 3, so we can set all 3 units as available
      await availabilityManager.connect(host).setBulkAvailability(tokenId, 3, startDate, endDate);

      // All 3 units should be available
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, startDate, endDate)).to.be.true;
      expect(await availabilityManager.isRoomAvailable(tokenId, 1, startDate, endDate)).to.be.true;
      expect(await availabilityManager.isRoomAvailable(tokenId, 2, startDate, endDate)).to.be.true;
    });

    it("should set all units as unavailable when numUnits is 0", async function () {
      // First set some units as available
      await availabilityManager.connect(host).setBulkAvailability(tokenId, 1, startDate, endDate);

      // Then set all as unavailable
      await availabilityManager.connect(host).setBulkAvailability(tokenId, 0, startDate, endDate);

      // All units should be unavailable
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, startDate, endDate)).to.be.false;
      expect(await availabilityManager.isRoomAvailable(tokenId, 1, startDate, endDate)).to.be.false;
    });

    it("should revert if not property owner", async function () {
      await expect(
        availabilityManager.connect(owner).setBulkAvailability(tokenId, 2, startDate, endDate)
      ).to.be.revertedWith("Not property owner");
    });

    it("should revert with invalid date range (startDate >= endDate)", async function () {
      await expect(
        availabilityManager.connect(host).setBulkAvailability(tokenId, 2, endDate, startDate)
      ).to.be.revertedWithCustomError(availabilityManager, "InvalidDateRange");
    });

    it("should revert with invalid date range (startDate == endDate)", async function () {
      await expect(
        availabilityManager.connect(host).setBulkAvailability(tokenId, 2, startDate, startDate)
      ).to.be.revertedWithCustomError(availabilityManager, "InvalidDateRange");
    });

    it("should revert if numUnits exceeds total supply", async function () {
      // totalSupply is 3, so requesting 4 units should revert
      await expect(
        availabilityManager.connect(host).setBulkAvailability(tokenId, 4, startDate, endDate)
      ).to.be.revertedWith("Exceeds total supply");
    });

    it("should normalize dates to start of day", async function () {
      // Use non-normalized timestamps (middle of the day)
      const now = await time.latest();
      const nonNormalizedStart = now + 86400 + 3600; // +1 day +1 hour
      const nonNormalizedEnd = nonNormalizedStart + 86400 * 3 + 7200; // +3 days +2 hours

      await availabilityManager
        .connect(host)
        .setBulkAvailability(tokenId, 2, nonNormalizedStart, nonNormalizedEnd);

      // Check with normalized dates
      const normalizedStart = Math.floor(nonNormalizedStart / 86400) * 86400;
      const normalizedEnd = Math.floor(nonNormalizedEnd / 86400) * 86400;

      expect(await availabilityManager.isRoomAvailable(tokenId, 0, normalizedStart, normalizedEnd))
        .to.be.true;
      expect(await availabilityManager.isRoomAvailable(tokenId, 1, normalizedStart, normalizedEnd))
        .to.be.true;
    });

    it("should handle bulk availability across multiple days", async function () {
      // Set bulk availability for 10 days
      const longEndDate = startDate + 86400 * 10;
      await availabilityManager
        .connect(host)
        .setBulkAvailability(tokenId, 2, startDate, longEndDate);

      // Check first day
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, startDate, startDate + 86400)).to
        .be.true;

      // Check middle day
      const midDate = startDate + 86400 * 5;
      expect(await availabilityManager.isRoomAvailable(tokenId, 1, midDate, midDate + 86400)).to.be
        .true;

      // Check last day
      const lastDay = longEndDate - 86400;
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, lastDay, longEndDate)).to.be
        .true;
    });

    it("should update availability when called multiple times", async function () {
      // First, set 2 units available
      await availabilityManager.connect(host).setBulkAvailability(tokenId, 2, startDate, endDate);
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, startDate, endDate)).to.be.true;
      expect(await availabilityManager.isRoomAvailable(tokenId, 1, startDate, endDate)).to.be.true;

      // Then, set only 1 unit available
      await availabilityManager.connect(host).setBulkAvailability(tokenId, 1, startDate, endDate);
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, startDate, endDate)).to.be.true;
      expect(await availabilityManager.isRoomAvailable(tokenId, 1, startDate, endDate)).to.be.false;

      // Finally, set all units as unavailable
      await availabilityManager.connect(host).setBulkAvailability(tokenId, 0, startDate, endDate);
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, startDate, endDate)).to.be.false;
      expect(await availabilityManager.isRoomAvailable(tokenId, 1, startDate, endDate)).to.be.false;
    });
  });
});
