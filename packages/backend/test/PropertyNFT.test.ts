import { expect } from "chai";
import { network } from "hardhat";
import type { PropertyNFT, HostSBT } from "../types/ethers-contracts";

const { ethers } = await network.connect();

describe("PropertyNFT", function () {
  let propertyNFT: PropertyNFT;
  let hostSBT: HostSBT;
  let platform: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let host1: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let host2: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let traveler: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let escrowFactory: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let reviewRegistry: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  const PROPERTY_TYPE = "hotel";
  const LOCATION = "Bali, Indonesia";
  const IPFS_HASH = "ipfs://QmTest123";
  const ROOM_IPFS_HASH = "ipfs://QmRoom123";

  beforeEach(async function () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_owner, _platform, _host1, _host2, _traveler, _escrowFactory, _reviewRegistry] =
      await ethers.getSigners();
    platform = _platform;
    host1 = _host1;
    host2 = _host2;
    traveler = _traveler;
    escrowFactory = _escrowFactory;
    reviewRegistry = _reviewRegistry;

    // Deploy HostSBT
    const HostSBTFactory = await ethers.getContractFactory("HostSBT");
    hostSBT = (await HostSBTFactory.deploy()) as unknown as HostSBT;

    // Deploy PropertyNFT
    const PropertyNFTFactory = await ethers.getContractFactory("PropertyNFT");
    propertyNFT = (await PropertyNFTFactory.deploy(
      await hostSBT.getAddress(),
      platform.address
    )) as unknown as PropertyNFT;

    // Authorize PropertyNFT to update HostSBT
    await hostSBT.setAuthorizedUpdater(await propertyNFT.getAddress(), true);

    // Setup factory and registry
    await propertyNFT.setEscrowFactory(escrowFactory.address);
    await propertyNFT.setReviewRegistry(reviewRegistry.address);

    // Mint HostSBT for host1
    await hostSBT.mint(host1.address);
  });

  describe("Deployment", function () {
    it("should deploy with correct parameters", async function () {
      expect(await propertyNFT.hostSBT()).to.equal(await hostSBT.getAddress());
      expect(await propertyNFT.platform()).to.equal(platform.address);
    });
  });

  describe("Property Creation", function () {
    it("should create a property with HostSBT", async function () {
      const tx = await propertyNFT
        .connect(host1)
        .createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);

      await expect(tx)
        .to.emit(propertyNFT, "PropertyCreated")
        .withArgs(1, host1.address, await hostSBT.walletToTokenId(host1.address), IPFS_HASH);

      const property = await propertyNFT.getProperty(1);
      expect(property.propertyId).to.equal(1);
      expect(property.hostWallet).to.equal(host1.address);
      expect(property.propertyType).to.equal(PROPERTY_TYPE);
      expect(property.location).to.equal(LOCATION);
      expect(property.isActive).to.be.true;
    });

    it("should revert if user doesn't have HostSBT", async function () {
      await expect(
        propertyNFT.connect(traveler).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION)
      ).to.be.revertedWithCustomError(propertyNFT, "MustHaveHostSBT");
    });

    it("should increment property counter", async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);

      expect(await propertyNFT.totalProperties()).to.equal(2);
    });
  });

  describe("Room Types (ERC1155 Multi-Unit)", function () {
    let propertyId: number;

    beforeEach(async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      propertyId = 1;
    });

    it("should add room type and mint ERC1155 tokens", async function () {
      const maxSupply = 5;
      const tx = await propertyNFT
        .connect(host1)
        .addRoomType(propertyId, "Standard Room", maxSupply, ROOM_IPFS_HASH);

      const tokenId = await propertyNFT.encodeTokenId(propertyId, 0);

      await expect(tx)
        .to.emit(propertyNFT, "RoomTypeAdded")
        .withArgs(propertyId, tokenId, "Standard Room", maxSupply);

      // Check ERC1155 balance
      expect(await propertyNFT.balanceOf(host1.address, tokenId)).to.equal(maxSupply);

      // Check room type data
      const roomType = await propertyNFT.getRoomType(tokenId);
      expect(roomType.name).to.equal("Standard Room");
      expect(roomType.maxSupply).to.equal(maxSupply);
      expect(roomType.isActive).to.be.true;
    });

    it("should revert if not property owner", async function () {
      await expect(
        propertyNFT.connect(traveler).addRoomType(propertyId, "Standard Room", 5, ROOM_IPFS_HASH)
      ).to.be.revertedWithCustomError(propertyNFT, "NotPropertyOwner");
    });

    it("should revert if maxSupply is zero", async function () {
      await expect(
        propertyNFT.connect(host1).addRoomType(propertyId, "Standard Room", 0, ROOM_IPFS_HASH)
      ).to.be.revertedWithCustomError(propertyNFT, "InvalidSupply");
    });

    it("should create multiple room types", async function () {
      await propertyNFT.connect(host1).addRoomType(propertyId, "Standard Room", 5, ROOM_IPFS_HASH);
      await propertyNFT.connect(host1).addRoomType(propertyId, "Double Room", 10, ROOM_IPFS_HASH);
      await propertyNFT.connect(host1).addRoomType(propertyId, "Suite", 2, ROOM_IPFS_HASH);

      const roomTypes = await propertyNFT.getPropertyRoomTypes(propertyId);
      expect(roomTypes.length).to.equal(3);
    });
  });

  describe("TokenID Encoding/Decoding", function () {
    it("should correctly encode tokenId", async function () {
      const propertyId = 42;
      const roomTypeId = 1;
      const tokenId = await propertyNFT.encodeTokenId(propertyId, roomTypeId);

      // Upper 128 bits should be propertyId
      expect(tokenId >> 128n).to.equal(BigInt(propertyId));
    });

    it("should correctly decode tokenId", async function () {
      const propertyId = 42;
      const roomTypeId = 3;
      const tokenId = await propertyNFT.encodeTokenId(propertyId, roomTypeId);

      const [decodedPropertyId, decodedRoomTypeId] = await propertyNFT.decodeTokenId(tokenId);

      expect(decodedPropertyId).to.equal(propertyId);
      expect(decodedRoomTypeId).to.equal(roomTypeId);
    });
  });

  describe("Availability Bitmap", function () {
    let propertyId: number;
    let tokenId: bigint;
    const checkIn = Math.floor(Date.now() / 1000) + 86400; // Tomorrow
    const checkOut = checkIn + 86400 * 3; // 3 days

    beforeEach(async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      propertyId = 1;
      await propertyNFT.connect(host1).addRoomType(propertyId, "Standard Room", 5, ROOM_IPFS_HASH);
      tokenId = await propertyNFT.encodeTokenId(propertyId, 0);
    });

    it("should set availability for date range", async function () {
      await propertyNFT.connect(host1).setAvailability(tokenId, checkIn, checkOut, 5);

      const available = await propertyNFT.checkAvailability(tokenId, checkIn, checkOut, 1);
      expect(available).to.be.true;
    });

    it("should return false if units not available", async function () {
      await propertyNFT.connect(host1).setAvailability(tokenId, checkIn, checkOut, 2);

      // Requesting 3 units but only 2 available
      const available = await propertyNFT.checkAvailability(tokenId, checkIn, checkOut, 3);
      expect(available).to.be.false;
    });

    it("should revert if not property owner", async function () {
      await expect(
        propertyNFT.connect(traveler).setAvailability(tokenId, checkIn, checkOut, 5)
      ).to.be.revertedWithCustomError(propertyNFT, "NotPropertyOwner");
    });

    it("should revert if invalid date range", async function () {
      await expect(
        propertyNFT.connect(host1).setAvailability(tokenId, checkOut, checkIn, 5)
      ).to.be.revertedWithCustomError(propertyNFT, "InvalidDateRange");
    });

    it("should revert if units exceed maxSupply", async function () {
      await expect(
        propertyNFT.connect(host1).setAvailability(tokenId, checkIn, checkOut, 10) // maxSupply is 5
      ).to.be.revertedWithCustomError(propertyNFT, "InvalidSupply");
    });
  });

  describe("Booking Logic", function () {
    let propertyId: number;
    let tokenId: bigint;
    const checkIn = Math.floor(Date.now() / 1000) + 86400;
    const checkOut = checkIn + 86400 * 3;

    beforeEach(async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      propertyId = 1;
      await propertyNFT.connect(host1).addRoomType(propertyId, "Standard Room", 5, ROOM_IPFS_HASH);
      tokenId = await propertyNFT.encodeTokenId(propertyId, 0);
      await propertyNFT.connect(host1).setAvailability(tokenId, checkIn, checkOut, 5);
    });

    it("should book a room (only from escrowFactory)", async function () {
      const escrowId = 1;
      const tx = await propertyNFT
        .connect(escrowFactory)
        .bookRoom(tokenId, traveler.address, checkIn, checkOut, escrowId);

      await expect(tx)
        .to.emit(propertyNFT, "PropertyBooked")
        .withArgs(tokenId, traveler.address, checkIn, checkOut, escrowId);

      // Check availability decreased
      const available = await propertyNFT.checkAvailability(tokenId, checkIn, checkOut, 5);
      expect(available).to.be.false; // Only 4 left

      const available4 = await propertyNFT.checkAvailability(tokenId, checkIn, checkOut, 4);
      expect(available4).to.be.true;
    });

    it("should revert if not called by escrowFactory", async function () {
      await expect(
        propertyNFT.connect(traveler).bookRoom(tokenId, traveler.address, checkIn, checkOut, 1)
      ).to.be.revertedWithCustomError(propertyNFT, "NotAuthorized");
    });

    it("should revert if property not active", async function () {
      await propertyNFT.connect(host1).setPropertyActive(propertyId, false);

      await expect(
        propertyNFT.connect(escrowFactory).bookRoom(tokenId, traveler.address, checkIn, checkOut, 1)
      ).to.be.revertedWithCustomError(propertyNFT, "PropertyNotActive");
    });

    it("should revert if room type not active", async function () {
      await propertyNFT.connect(host1).setRoomTypeActive(tokenId, false);

      await expect(
        propertyNFT.connect(escrowFactory).bookRoom(tokenId, traveler.address, checkIn, checkOut, 1)
      ).to.be.revertedWithCustomError(propertyNFT, "RoomTypeNotActive");
    });

    it("should revert if dates not available", async function () {
      // Book all 5 units
      for (let i = 0; i < 5; i++) {
        await propertyNFT
          .connect(escrowFactory)
          .bookRoom(tokenId, traveler.address, checkIn, checkOut, i);
      }

      // 6th booking should fail
      await expect(
        propertyNFT.connect(escrowFactory).bookRoom(tokenId, traveler.address, checkIn, checkOut, 5)
      ).to.be.revertedWithCustomError(propertyNFT, "DatesNotAvailable");
    });
  });

  describe("Platform-Controlled Ownership Transfer", function () {
    let propertyId: number;
    let tokenId: bigint;

    beforeEach(async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      propertyId = 1;
      await propertyNFT.connect(host1).addRoomType(propertyId, "Standard Room", 5, ROOM_IPFS_HASH);
      tokenId = await propertyNFT.encodeTokenId(propertyId, 0);

      // Mint HostSBT for host2
      await hostSBT.mint(host2.address);
    });

    it("should transfer property ownership (platform only)", async function () {
      const tx = await propertyNFT
        .connect(platform)
        .transferPropertyOwnership(propertyId, host2.address);

      await expect(tx)
        .to.emit(propertyNFT, "PropertyOwnershipTransferred")
        .withArgs(propertyId, host1.address, host2.address);

      // Check ownership updated
      expect(await propertyNFT.propertyOwner(propertyId)).to.equal(host2.address);

      // Check ERC1155 tokens transferred
      expect(await propertyNFT.balanceOf(host1.address, tokenId)).to.equal(0);
      expect(await propertyNFT.balanceOf(host2.address, tokenId)).to.equal(5);
    });

    it("should revert if not platform", async function () {
      await expect(
        propertyNFT.connect(host1).transferPropertyOwnership(propertyId, host2.address)
      ).to.be.revertedWithCustomError(propertyNFT, "NotPlatform");
    });

    it("should revert if new owner doesn't have HostSBT", async function () {
      await expect(
        propertyNFT.connect(platform).transferPropertyOwnership(propertyId, traveler.address)
      ).to.be.revertedWithCustomError(propertyNFT, "MustHaveHostSBT");
    });
  });

  describe("Rating System", function () {
    let propertyId: number;

    beforeEach(async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      propertyId = 1;
    });

    it("should update property rating (from reviewRegistry)", async function () {
      const rating = 5;
      const tx = await propertyNFT.connect(reviewRegistry).updatePropertyRating(propertyId, rating);

      await expect(tx).to.emit(propertyNFT, "PropertyRated").withArgs(propertyId, rating, 500); // 5 * 100

      const property = await propertyNFT.getProperty(propertyId);
      expect(property.averageRating).to.equal(500);
      expect(property.totalReviewsReceived).to.equal(1);
    });

    it("should calculate weighted average rating", async function () {
      // First review: 5 stars
      await propertyNFT.connect(reviewRegistry).updatePropertyRating(propertyId, 5);
      // Second review: 3 stars
      await propertyNFT.connect(reviewRegistry).updatePropertyRating(propertyId, 3);

      const property = await propertyNFT.getProperty(propertyId);
      // Average: (500 + 300) / 2 = 400 (4.00 stars)
      expect(property.averageRating).to.equal(400);
      expect(property.totalReviewsReceived).to.equal(2);
    });

    it("should revert if not called by reviewRegistry", async function () {
      await expect(
        propertyNFT.connect(traveler).updatePropertyRating(propertyId, 5)
      ).to.be.revertedWithCustomError(propertyNFT, "NotAuthorized");
    });

    it("should revert if rating invalid", async function () {
      await expect(
        propertyNFT.connect(reviewRegistry).updatePropertyRating(propertyId, 0)
      ).to.be.revertedWithCustomError(propertyNFT, "InvalidRating");

      await expect(
        propertyNFT.connect(reviewRegistry).updatePropertyRating(propertyId, 6)
      ).to.be.revertedWithCustomError(propertyNFT, "InvalidRating");
    });
  });

  describe("Transfer Restrictions", function () {
    let propertyId: number;
    let tokenId: bigint;

    beforeEach(async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      propertyId = 1;
      await propertyNFT.connect(host1).addRoomType(propertyId, "Standard Room", 5, ROOM_IPFS_HASH);
      tokenId = await propertyNFT.encodeTokenId(propertyId, 0);
    });

    it("should block regular transfers (only platform)", async function () {
      await expect(
        propertyNFT.connect(host1).safeTransferFrom(host1.address, host2.address, tokenId, 1, "0x")
      ).to.be.revertedWithCustomError(propertyNFT, "NotPlatform");
    });

    it("should block batch transfers (only platform)", async function () {
      await expect(
        propertyNFT
          .connect(host1)
          .safeBatchTransferFrom(host1.address, host2.address, [tokenId], [1], "0x")
      ).to.be.revertedWithCustomError(propertyNFT, "NotPlatform");
    });
  });

  describe("Metadata Updates", function () {
    let propertyId: number;
    let tokenId: bigint;

    beforeEach(async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      propertyId = 1;
      await propertyNFT.connect(host1).addRoomType(propertyId, "Standard Room", 5, ROOM_IPFS_HASH);
      tokenId = await propertyNFT.encodeTokenId(propertyId, 0);
    });

    it("should update property metadata", async function () {
      const newHash = "ipfs://new-property-hash";
      await propertyNFT.connect(host1).updateProperty(propertyId, newHash);

      const property = await propertyNFT.getProperty(propertyId);
      expect(property.ipfsMetadataHash).to.equal(newHash);
    });

    it("should revert if not property owner (updateProperty)", async function () {
      await expect(
        propertyNFT.connect(host2).updateProperty(propertyId, "ipfs://new")
      ).to.be.revertedWithCustomError(propertyNFT, "NotPropertyOwner"); // Line 341
    });

    it("should update room type metadata", async function () {
      const newHash = "ipfs://new-room-hash";
      await propertyNFT.connect(host1).updateRoomType(tokenId, newHash);

      const roomType = await propertyNFT.getRoomType(tokenId);
      expect(roomType.ipfsMetadataHash).to.equal(newHash);
    });

    it("should revert if not property owner (updateRoomType)", async function () {
      await expect(
        propertyNFT.connect(host2).updateRoomType(tokenId, "ipfs://new")
      ).to.be.revertedWithCustomError(propertyNFT, "NotPropertyOwner"); // Line 354
    });

    it("should activate property", async function () {
      // First deactivate
      await propertyNFT.connect(host1).setPropertyActive(propertyId, false);

      // Then reactivate (line 367-369)
      await expect(propertyNFT.connect(host1).setPropertyActive(propertyId, true))
        .to.emit(propertyNFT, "PropertyActivated")
        .withArgs(propertyId);

      const property = await propertyNFT.getProperty(propertyId);
      expect(property.isActive).to.be.true;
    });

    it("should revert if not property owner (setPropertyActive)", async function () {
      await expect(
        propertyNFT.connect(host2).setPropertyActive(propertyId, false)
      ).to.be.revertedWithCustomError(propertyNFT, "NotPropertyOwner"); // Line 363
    });

    it("should activate room type", async function () {
      // First deactivate
      await propertyNFT.connect(host1).setRoomTypeActive(tokenId, false);

      // Then reactivate (lines 383-385)
      await expect(propertyNFT.connect(host1).setRoomTypeActive(tokenId, true))
        .to.emit(propertyNFT, "RoomTypeActivated")
        .withArgs(tokenId);

      const roomType = await propertyNFT.getRoomType(tokenId);
      expect(roomType.isActive).to.be.true;
    });

    it("should deactivate room type", async function () {
      await expect(propertyNFT.connect(host1).setRoomTypeActive(tokenId, false))
        .to.emit(propertyNFT, "RoomTypeDeactivated")
        .withArgs(tokenId);

      const roomType = await propertyNFT.getRoomType(tokenId);
      expect(roomType.isActive).to.be.false;
    });

    it("should revert if not property owner (setRoomTypeActive)", async function () {
      await expect(
        propertyNFT.connect(host2).setRoomTypeActive(tokenId, false)
      ).to.be.revertedWithCustomError(propertyNFT, "NotPropertyOwner"); // Line 379
    });
  });

  describe("Booking Management", function () {
    let propertyId: number;
    let tokenId: bigint;
    let checkIn: number;
    let checkOut: number;

    beforeEach(async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      propertyId = 1;
      await propertyNFT.connect(host1).addRoomType(propertyId, "Standard Room", 5, ROOM_IPFS_HASH);
      tokenId = await propertyNFT.encodeTokenId(propertyId, 0);

      const now = Math.floor(Date.now() / 1000);
      checkIn = now + 86400;
      checkOut = checkIn + 86400 * 2;

      await propertyNFT.connect(host1).setAvailability(tokenId, checkIn, checkOut, 5);
    });

    it("should revert if checkIn >= checkOut", async function () {
      const invalidCheckOut = checkIn; // Same as checkIn

      await expect(
        propertyNFT
          .connect(escrowFactory)
          .bookRoom(tokenId, traveler.address, checkIn, invalidCheckOut, 1)
      ).to.be.revertedWithCustomError(propertyNFT, "InvalidDateRange"); // Line 470
    });

    it("should confirm booking from property owner", async function () {
      // Create booking
      await propertyNFT
        .connect(escrowFactory)
        .bookRoom(tokenId, traveler.address, checkIn, checkOut, 1);

      // Confirm from owner (line 507-511)
      await propertyNFT.connect(host1).confirmBooking(tokenId, 0);

      const booking = await propertyNFT.getBooking(tokenId, 0);
      expect(booking.status).to.equal(1); // Confirmed
    });

    it("should confirm booking from escrowFactory", async function () {
      // Create booking
      await propertyNFT
        .connect(escrowFactory)
        .bookRoom(tokenId, traveler.address, checkIn, checkOut, 1);

      // Confirm from factory (line 507-511)
      await propertyNFT.connect(escrowFactory).confirmBooking(tokenId, 0);

      const booking = await propertyNFT.getBooking(tokenId, 0);
      expect(booking.status).to.equal(1); // Confirmed
    });

    it("should revert if not authorized to confirm", async function () {
      await propertyNFT
        .connect(escrowFactory)
        .bookRoom(tokenId, traveler.address, checkIn, checkOut, 1);

      await expect(
        propertyNFT.connect(traveler).confirmBooking(tokenId, 0)
      ).to.be.revertedWithCustomError(propertyNFT, "NotAuthorized"); // Line 508
    });

    it("should complete booking from escrowFactory", async function () {
      await propertyNFT
        .connect(escrowFactory)
        .bookRoom(tokenId, traveler.address, checkIn, checkOut, 1);

      // Complete from factory (line 518-524)
      await expect(propertyNFT.connect(escrowFactory).completeBooking(tokenId, 0))
        .to.emit(propertyNFT, "BookingCompleted")
        .withArgs(tokenId, 0);

      const booking = await propertyNFT.getBooking(tokenId, 0);
      expect(booking.status).to.equal(3); // Completed
    });

    it("should complete booking from reviewRegistry", async function () {
      await propertyNFT
        .connect(escrowFactory)
        .bookRoom(tokenId, traveler.address, checkIn, checkOut, 1);

      // Complete from registry (line 518-524)
      await propertyNFT.connect(reviewRegistry).completeBooking(tokenId, 0);

      const booking = await propertyNFT.getBooking(tokenId, 0);
      expect(booking.status).to.equal(3); // Completed
    });

    it("should revert if not authorized to complete", async function () {
      await propertyNFT
        .connect(escrowFactory)
        .bookRoom(tokenId, traveler.address, checkIn, checkOut, 1);

      await expect(
        propertyNFT.connect(traveler).completeBooking(tokenId, 0)
      ).to.be.revertedWithCustomError(propertyNFT, "NotAuthorized"); // Line 519
    });

    it("should cancel booking from traveler", async function () {
      await propertyNFT
        .connect(escrowFactory)
        .bookRoom(tokenId, traveler.address, checkIn, checkOut, 1);

      // Cancel from traveler (line 535-550)
      await expect(propertyNFT.connect(traveler).cancelBooking(tokenId, 0))
        .to.emit(propertyNFT, "BookingCancelled")
        .withArgs(tokenId, 0);

      const booking = await propertyNFT.getBooking(tokenId, 0);
      expect(booking.status).to.equal(4); // Cancelled
    });

    it("should cancel booking from property owner", async function () {
      await propertyNFT
        .connect(escrowFactory)
        .bookRoom(tokenId, traveler.address, checkIn, checkOut, 1);

      // Cancel from owner (line 536-550)
      await propertyNFT.connect(host1).cancelBooking(tokenId, 0);

      const booking = await propertyNFT.getBooking(tokenId, 0);
      expect(booking.status).to.equal(4); // Cancelled
    });

    it("should cancel booking from escrowFactory", async function () {
      await propertyNFT
        .connect(escrowFactory)
        .bookRoom(tokenId, traveler.address, checkIn, checkOut, 1);

      // Cancel from factory (line 537-550)
      await propertyNFT.connect(escrowFactory).cancelBooking(tokenId, 0);

      const booking = await propertyNFT.getBooking(tokenId, 0);
      expect(booking.status).to.equal(4); // Cancelled
    });

    it("should revert if not authorized to cancel", async function () {
      await propertyNFT
        .connect(escrowFactory)
        .bookRoom(tokenId, traveler.address, checkIn, checkOut, 1);

      await expect(
        propertyNFT.connect(host2).cancelBooking(tokenId, 0)
      ).to.be.revertedWithCustomError(propertyNFT, "NotAuthorized"); // Line 539
    });
  });

  describe("Admin Functions", function () {
    it("should set platform address", async function () {
      const newPlatform = host2.address;
      await propertyNFT.setPlatform(newPlatform);

      expect(await propertyNFT.platform()).to.equal(newPlatform);
    });

    it("should allow platform to transfer", async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      await propertyNFT.connect(host1).addRoomType(1, "Standard Room", 5, ROOM_IPFS_HASH);

      const tokenId = await propertyNFT.encodeTokenId(1, 0);

      // Host approves platform to transfer
      await propertyNFT.connect(host1).setApprovalForAll(platform.address, true);

      // Transfer from platform (line 595-596)
      await propertyNFT
        .connect(platform)
        .safeTransferFrom(host1.address, host2.address, tokenId, 1, "0x");

      const balance = await propertyNFT.balanceOf(host2.address, tokenId);
      expect(balance).to.equal(1);
    });

    it("should allow platform batch transfer", async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      await propertyNFT.connect(host1).addRoomType(1, "Standard Room", 5, ROOM_IPFS_HASH);

      const tokenId = await propertyNFT.encodeTokenId(1, 0);

      // Host approves platform to transfer
      await propertyNFT.connect(host1).setApprovalForAll(platform.address, true);

      // Batch transfer from platform (line 608-609)
      await propertyNFT
        .connect(platform)
        .safeBatchTransferFrom(host1.address, host2.address, [tokenId], [1], "0x");

      const balance = await propertyNFT.balanceOf(host2.address, tokenId);
      expect(balance).to.equal(1);
    });
  });

  describe("View Functions", function () {
    it("should return properties by host", async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);

      const properties = await propertyNFT.getPropertiesByHost(host1.address);
      expect(properties.length).to.equal(2);
    });

    it("should return correct URI for room type", async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      await propertyNFT.connect(host1).addRoomType(1, "Standard Room", 5, ROOM_IPFS_HASH);

      const tokenId = await propertyNFT.encodeTokenId(1, 0);
      const uri = await propertyNFT.uri(tokenId);

      expect(uri).to.equal(ROOM_IPFS_HASH);
    });

    it("should return property URI for non-existent room type", async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);

      // Create a tokenId that doesn't exist as a room type
      const fakeTokenId = await propertyNFT.encodeTokenId(1, 999);
      const uri = await propertyNFT.uri(fakeTokenId);

      // Should fallback to property metadata (lines 694-696)
      expect(uri).to.equal(IPFS_HASH);
    });

    it("should revert when getting invalid booking", async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      await propertyNFT.connect(host1).addRoomType(1, "Standard Room", 5, ROOM_IPFS_HASH);

      const tokenId = await propertyNFT.encodeTokenId(1, 0);

      await expect(propertyNFT.getBooking(tokenId, 999)).to.be.revertedWithCustomError(
        propertyNFT,
        "BookingNotFound"
      ); // Line 652
    });

    it("should return empty bookings array", async function () {
      await propertyNFT.connect(host1).createProperty(IPFS_HASH, PROPERTY_TYPE, LOCATION);
      await propertyNFT.connect(host1).addRoomType(1, "Standard Room", 5, ROOM_IPFS_HASH);

      const tokenId = await propertyNFT.encodeTokenId(1, 0);
      const bookings = await propertyNFT.getBookings(tokenId);

      expect(bookings.length).to.equal(0); // Line 645
    });
  });
});
