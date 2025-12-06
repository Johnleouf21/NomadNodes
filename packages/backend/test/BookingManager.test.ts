import { expect } from "chai";
import { network } from "hardhat";
import type {
  BookingManager,
  PropertyRegistry,
  RoomTypeNFT,
  AvailabilityManager,
  TravelerSBT,
  HostSBT,
} from "../types/ethers-contracts";

const { ethers, networkHelpers } = await network.connect();
const { time } = networkHelpers;

describe("BookingManager", function () {
  let bookingManager: BookingManager;
  let propertyRegistry: PropertyRegistry;
  let roomTypeNFT: RoomTypeNFT;
  let availabilityManager: AvailabilityManager;
  let travelerSBT: TravelerSBT;
  let hostSBT: HostSBT;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let host: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let traveler: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let platform: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let tokenId: bigint;
  let checkIn: number;
  let checkOut: number;

  beforeEach(async function () {
    [owner, host, traveler, platform] = await ethers.getSigners();

    // Deploy SBTs
    const TravelerSBTFactory = await ethers.getContractFactory("TravelerSBT");
    travelerSBT = (await TravelerSBTFactory.deploy()) as unknown as TravelerSBT;
    await travelerSBT.waitForDeployment();

    const HostSBTFactory = await ethers.getContractFactory("HostSBT");
    hostSBT = (await HostSBTFactory.deploy()) as unknown as HostSBT;
    await hostSBT.waitForDeployment();

    // Mint SBTs
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

    // Wire up contracts
    await propertyRegistry.setRoomTypeNFT(await roomTypeNFT.getAddress());
    await propertyRegistry.setBookingManager(await bookingManager.getAddress());
    await roomTypeNFT.setAvailabilityManager(await availabilityManager.getAddress());
    await roomTypeNFT.setBookingManager(await bookingManager.getAddress());
    await availabilityManager.setBookingManager(await bookingManager.getAddress());
    await travelerSBT.setAuthorizedUpdater(await bookingManager.getAddress(), true);
    await bookingManager.setEscrowFactory(owner.address); // Use owner as mock escrow factory

    // Create property and room type
    await propertyRegistry.connect(host).createProperty("ipfs://property", "hotel", "Paris");
    await roomTypeNFT.connect(host).addRoomType(
      1, // propertyId
      "Standard Room",
      "ipfs://room",
      100, // pricePerNight
      20, // cleaningFee
      2, // maxGuests
      5 // totalSupply
    );

    tokenId = await roomTypeNFT.encodeTokenId(1, 1);

    // Set availability for next 30 days
    const now = await time.latest();
    const startDate = Math.floor(now / 86400) * 86400;
    const endDate = startDate + 86400 * 30;

    for (let i = 0; i < 5; i++) {
      await availabilityManager.connect(host).setAvailability(tokenId, i, startDate, endDate, true);
    }

    // Set check-in/out dates
    checkIn = startDate + 86400; // Tomorrow
    checkOut = checkIn + 86400 * 3; // 3 days
  });

  describe("Deployment", function () {
    it("should deploy with correct addresses", async function () {
      expect(await bookingManager.propertyRegistry()).to.equal(await propertyRegistry.getAddress());
      expect(await bookingManager.roomTypeNFT()).to.equal(await roomTypeNFT.getAddress());
      expect(await bookingManager.availabilityManager()).to.equal(
        await availabilityManager.getAddress()
      );
      expect(await bookingManager.travelerSBT()).to.equal(await travelerSBT.getAddress());
    });

    it("should set escrowFactory", async function () {
      expect(await bookingManager.escrowFactory()).to.equal(owner.address);
    });
  });

  describe("Book Room", function () {
    it("should create a booking", async function () {
      await expect(
        bookingManager.connect(traveler).bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress)
      )
        .to.emit(bookingManager, "BookingCreated")
        .withArgs(tokenId, 0, traveler.address, checkIn, checkOut, 320); // (100*3) + 20 = 320

      const booking = await bookingManager.getBooking(tokenId, 0);
      expect(booking.traveler).to.equal(traveler.address);
      expect(booking.checkInDate).to.equal(checkIn);
      expect(booking.checkOutDate).to.equal(checkOut);
      expect(booking.totalPrice).to.equal(320);
      expect(booking.status).to.equal(0); // Pending
    });

    it("should revert if traveler has no SBT", async function () {
      await expect(
        bookingManager.connect(owner).bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(bookingManager, "MustHaveTravelerSBT");
    });

    it("should revert if room type is inactive", async function () {
      await roomTypeNFT.connect(host).setRoomTypeActive(tokenId, false);

      await expect(
        bookingManager.connect(traveler).bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(bookingManager, "RoomTypeNotActive");
    });

    it("should revert if no units available", async function () {
      // Book all 5 available units
      for (let i = 0; i < 5; i++) {
        await bookingManager
          .connect(traveler)
          .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);
      }

      // 6th booking should fail (no more units available)
      await expect(
        bookingManager.connect(traveler).bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(bookingManager, "NoAvailableUnits");
    });

    it("should revert if invalid date range", async function () {
      await expect(
        bookingManager.connect(traveler).bookRoom(tokenId, checkOut, checkIn, 2, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidDateRange");
    });

    it("should mark unit as unavailable after booking", async function () {
      await bookingManager
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);

      // Unit 0 should now be unavailable
      expect(await availabilityManager.isRoomAvailable(tokenId, 0, checkIn, checkOut)).to.be.false;
    });

    it("should increment property booking count", async function () {
      await bookingManager
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);

      const property = await propertyRegistry.getProperty(1);
      expect(property.totalBookings).to.equal(1);
    });

    it("should link booking to traveler SBT", async function () {
      await expect(
        bookingManager.connect(traveler).bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress)
      ).to.emit(travelerSBT, "BookingLinked");
    });
  });

  describe("Confirm Booking", function () {
    beforeEach(async function () {
      await bookingManager
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);
    });

    it("should confirm pending booking", async function () {
      await expect(bookingManager.connect(owner).confirmBooking(tokenId, 0))
        .to.emit(bookingManager, "BookingConfirmed")
        .withArgs(tokenId, 0);

      const booking = await bookingManager.getBooking(tokenId, 0);
      expect(booking.status).to.equal(1); // Confirmed
    });

    it("should revert if not escrowFactory", async function () {
      await expect(
        bookingManager.connect(traveler).confirmBooking(tokenId, 0)
      ).to.be.revertedWithCustomError(bookingManager, "NotEscrowFactory");
    });

    it("should revert if booking not pending", async function () {
      await bookingManager.connect(owner).confirmBooking(tokenId, 0);

      await expect(
        bookingManager.connect(owner).confirmBooking(tokenId, 0)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidBookingStatus");
    });
  });

  describe("Check-in Booking", function () {
    beforeEach(async function () {
      await bookingManager
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);
      await bookingManager.connect(owner).confirmBooking(tokenId, 0);
    });

    it("should allow property owner to check in", async function () {
      await expect(bookingManager.connect(host).checkInBooking(tokenId, 0))
        .to.emit(bookingManager, "BookingCheckedIn")
        .withArgs(tokenId, 0);

      const booking = await bookingManager.getBooking(tokenId, 0);
      expect(booking.status).to.equal(2); // CheckedIn
    });

    it("should allow traveler to check in", async function () {
      await expect(bookingManager.connect(traveler).checkInBooking(tokenId, 0)).to.emit(
        bookingManager,
        "BookingCheckedIn"
      );

      const booking = await bookingManager.getBooking(tokenId, 0);
      expect(booking.status).to.equal(2); // CheckedIn
    });

    it("should revert if not owner or traveler", async function () {
      await expect(
        bookingManager.connect(owner).checkInBooking(tokenId, 0)
      ).to.be.revertedWithCustomError(bookingManager, "NotPropertyOwner");
    });

    it("should revert if booking not confirmed", async function () {
      await bookingManager
        .connect(traveler)
        .bookRoom(tokenId, checkIn + 86400 * 10, checkOut + 86400 * 10, 2, ethers.ZeroAddress);

      await expect(
        bookingManager.connect(host).checkInBooking(tokenId, 1)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidBookingStatus");
    });
  });

  describe("Complete Booking", function () {
    beforeEach(async function () {
      await bookingManager
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);
      await bookingManager.connect(owner).confirmBooking(tokenId, 0);
      await bookingManager.connect(host).checkInBooking(tokenId, 0);
    });

    it("should allow property owner to complete", async function () {
      await expect(bookingManager.connect(host).completeBooking(tokenId, 0))
        .to.emit(bookingManager, "BookingCompleted")
        .withArgs(tokenId, 0);

      const booking = await bookingManager.getBooking(tokenId, 0);
      expect(booking.status).to.equal(3); // Completed
    });

    it("should allow escrowFactory to complete", async function () {
      await expect(bookingManager.connect(owner).completeBooking(tokenId, 0)).to.emit(
        bookingManager,
        "BookingCompleted"
      );
    });

    it("should revert if not owner or escrow", async function () {
      await expect(
        bookingManager.connect(traveler).completeBooking(tokenId, 0)
      ).to.be.revertedWithCustomError(bookingManager, "NotPropertyOwner");
    });

    it("should revert if not checked in", async function () {
      await bookingManager
        .connect(traveler)
        .bookRoom(tokenId, checkIn + 86400 * 10, checkOut + 86400 * 10, 2, ethers.ZeroAddress);
      await bookingManager.connect(owner).confirmBooking(tokenId, 1);

      await expect(
        bookingManager.connect(host).completeBooking(tokenId, 1)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidBookingStatus");
    });
  });

  describe("Cancel Booking", function () {
    beforeEach(async function () {
      await bookingManager
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);
    });

    it("should allow traveler to cancel", async function () {
      await expect(bookingManager.connect(traveler).cancelBooking(tokenId, 0))
        .to.emit(bookingManager, "BookingCancelled")
        .withArgs(tokenId, 0);

      const booking = await bookingManager.getBooking(tokenId, 0);
      expect(booking.status).to.equal(4); // Cancelled
    });

    it("should allow property owner to cancel", async function () {
      await expect(bookingManager.connect(host).cancelBooking(tokenId, 0)).to.emit(
        bookingManager,
        "BookingCancelled"
      );
    });

    it("should release availability when confirmed booking is cancelled", async function () {
      await bookingManager.connect(owner).confirmBooking(tokenId, 0);
      const booking = await bookingManager.getBooking(tokenId, 0);
      const unitIndex = booking.unitIndex;

      await bookingManager.connect(traveler).cancelBooking(tokenId, 0);

      // Unit should be available again
      expect(await availabilityManager.isRoomAvailable(tokenId, unitIndex, checkIn, checkOut)).to.be
        .true;
    });

    it("should release availability for pending booking", async function () {
      const booking = await bookingManager.getBooking(tokenId, 0);
      const unitIndex = booking.unitIndex;

      await bookingManager.connect(traveler).cancelBooking(tokenId, 0);

      // Unit should be available again (availability is released regardless of booking status)
      expect(await availabilityManager.isRoomAvailable(tokenId, unitIndex, checkIn, checkOut)).to.be
        .true;
    });

    it("should revert if booking completed", async function () {
      await bookingManager.connect(owner).confirmBooking(tokenId, 0);
      await bookingManager.connect(host).checkInBooking(tokenId, 0);
      await bookingManager.connect(host).completeBooking(tokenId, 0);

      await expect(
        bookingManager.connect(traveler).cancelBooking(tokenId, 0)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidBookingStatus");
    });

    it("should revert if not authorized", async function () {
      await expect(
        bookingManager.connect(platform).cancelBooking(tokenId, 0)
      ).to.be.revertedWithCustomError(bookingManager, "NotTraveler");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await bookingManager
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);
      await bookingManager
        .connect(traveler)
        .bookRoom(tokenId, checkIn + 86400 * 10, checkOut + 86400 * 10, 2, ethers.ZeroAddress);
    });

    it("should get all bookings for tokenId", async function () {
      const bookings = await bookingManager.getBookings(tokenId);
      expect(bookings.length).to.equal(2);
    });

    it("should get specific booking", async function () {
      const booking = await bookingManager.getBooking(tokenId, 0);
      expect(booking.traveler).to.equal(traveler.address);
      expect(booking.checkInDate).to.equal(checkIn);
    });

    it("should check if has active bookings", async function () {
      expect(await bookingManager.hasActiveBookings(tokenId)).to.be.true;

      // Cancel all bookings
      await bookingManager.connect(traveler).cancelBooking(tokenId, 0);
      await bookingManager.connect(traveler).cancelBooking(tokenId, 1);

      expect(await bookingManager.hasActiveBookings(tokenId)).to.be.false;
    });
  });

  describe("Admin Functions", function () {
    it("should set escrowFactory", async function () {
      await bookingManager.setEscrowFactory(platform.address);
      expect(await bookingManager.escrowFactory()).to.equal(platform.address);
    });

    it("should set reviewRegistry", async function () {
      await bookingManager.setReviewRegistry(platform.address);
      expect(await bookingManager.reviewRegistry()).to.equal(platform.address);
    });

    it("should set propertyRegistry", async function () {
      await bookingManager.setPropertyRegistry(platform.address);
      expect(await bookingManager.propertyRegistry()).to.equal(platform.address);
    });

    it("should set roomTypeNFT", async function () {
      await bookingManager.setRoomTypeNFT(platform.address);
      expect(await bookingManager.roomTypeNFT()).to.equal(platform.address);
    });

    it("should set availabilityManager", async function () {
      await bookingManager.setAvailabilityManager(platform.address);
      expect(await bookingManager.availabilityManager()).to.equal(platform.address);
    });

    it("should set travelerSBT", async function () {
      await bookingManager.setTravelerSBT(platform.address);
      expect(await bookingManager.travelerSBT()).to.equal(platform.address);
    });

    it("should set propertyNFTAdapter", async function () {
      await bookingManager.setPropertyNFTAdapter(platform.address);
      expect(await bookingManager.propertyNFTAdapter()).to.equal(platform.address);
    });

    it("should revert if not owner", async function () {
      await expect(
        bookingManager.connect(traveler).setEscrowFactory(platform.address)
      ).to.be.revertedWithCustomError(bookingManager, "OwnableUnauthorizedAccount");
    });

    it("should revert if setting zero address", async function () {
      await expect(
        bookingManager.setEscrowFactory(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidAddress");
    });
  });

  describe("Set Escrow Address", function () {
    beforeEach(async function () {
      await bookingManager
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);
    });

    it("should set escrow address", async function () {
      await bookingManager.connect(owner).setEscrowAddress(tokenId, 0, platform.address);

      const booking = await bookingManager.getBooking(tokenId, 0);
      expect(booking.escrowAddress).to.equal(platform.address);
    });

    it("should revert if not escrowFactory", async function () {
      await expect(
        bookingManager.connect(traveler).setEscrowAddress(tokenId, 0, platform.address)
      ).to.be.revertedWithCustomError(bookingManager, "NotEscrowFactory");
    });

    it("should revert if zero address", async function () {
      await expect(
        bookingManager.connect(owner).setEscrowAddress(tokenId, 0, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidAddress");
    });
  });

  describe("Update Property Rating", function () {
    beforeEach(async function () {
      // Set platform as review registry in BookingManager
      await bookingManager.setReviewRegistry(platform.address);
      // Set BookingManager as review registry in PropertyRegistry
      await propertyRegistry.setReviewRegistry(await bookingManager.getAddress());
    });

    it("should allow review registry to update property rating", async function () {
      const tx = await bookingManager.connect(platform).updatePropertyRating(tokenId, 5);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should revert if not review registry", async function () {
      await expect(
        bookingManager.connect(traveler).updatePropertyRating(tokenId, 5)
      ).to.be.revertedWithCustomError(bookingManager, "NotPropertyOwner");
    });
  });

  describe("Invalid Booking Index Errors", function () {
    it("should revert confirmBooking with invalid booking index", async function () {
      await expect(bookingManager.confirmBooking(tokenId, 999)).to.be.revertedWithCustomError(
        bookingManager,
        "InvalidBookingIndex"
      );
    });

    it("should revert completeBooking with invalid booking index", async function () {
      await expect(bookingManager.completeBooking(tokenId, 999)).to.be.revertedWithCustomError(
        bookingManager,
        "InvalidBookingIndex"
      );
    });

    it("should revert cancelBooking with invalid booking index", async function () {
      await expect(
        bookingManager.connect(traveler).cancelBooking(tokenId, 999)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidBookingIndex");
    });

    it("should revert checkInBooking with invalid booking index", async function () {
      await expect(
        bookingManager.connect(host).checkInBooking(tokenId, 999)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidBookingIndex");
    });

    it("should revert getBooking with invalid booking index", async function () {
      await expect(bookingManager.getBooking(tokenId, 999)).to.be.revertedWithCustomError(
        bookingManager,
        "InvalidBookingIndex"
      );
    });
  });

  describe("Invalid Token ID Error", function () {
    it("should revert bookRoom with invalid token ID", async function () {
      const invalidTokenId = 999999n;
      await expect(
        bookingManager
          .connect(traveler)
          .bookRoom(invalidTokenId, checkIn, checkOut, 2, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(roomTypeNFT, "RoomTypeNotFound");
    });
  });

  describe("Admin Setter Zero Address Errors", function () {
    it("should revert setEscrowFactory with zero address", async function () {
      await expect(
        bookingManager.setEscrowFactory(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidAddress");
    });

    it("should revert setReviewRegistry with zero address", async function () {
      await expect(
        bookingManager.setReviewRegistry(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidAddress");
    });

    it("should revert setPropertyRegistry with zero address", async function () {
      await expect(
        bookingManager.setPropertyRegistry(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidAddress");
    });

    it("should revert setRoomTypeNFT with zero address", async function () {
      await expect(bookingManager.setRoomTypeNFT(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        bookingManager,
        "InvalidAddress"
      );
    });

    it("should revert setAvailabilityManager with zero address", async function () {
      await expect(
        bookingManager.setAvailabilityManager(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidAddress");
    });

    it("should revert setTravelerSBT with zero address", async function () {
      await expect(bookingManager.setTravelerSBT(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        bookingManager,
        "InvalidAddress"
      );
    });

    it("should revert setPropertyNFTAdapter with zero address", async function () {
      await expect(
        bookingManager.setPropertyNFTAdapter(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidAddress");
    });
  });

  describe("Set Escrow Address Error Coverage", function () {
    it("should revert setEscrowAddress with invalid booking index", async function () {
      await bookingManager.setEscrowFactory(owner.address);

      await expect(
        bookingManager.setEscrowAddress(tokenId, 999, platform.address)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidBookingIndex");
    });

    it("should revert setEscrowAddress with zero address", async function () {
      // First create a booking
      await bookingManager
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);

      await bookingManager.setEscrowFactory(owner.address);

      await expect(
        bookingManager.setEscrowAddress(tokenId, 0, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(bookingManager, "InvalidAddress");
    });

    it("should revert setEscrowAddress if not escrow factory", async function () {
      await bookingManager
        .connect(traveler)
        .bookRoom(tokenId, checkIn, checkOut, 2, ethers.ZeroAddress);

      await expect(
        bookingManager.connect(traveler).setEscrowAddress(tokenId, 0, platform.address)
      ).to.be.revertedWithCustomError(bookingManager, "NotEscrowFactory");
    });
  });
});
