import { expect } from "chai";
import { network } from "hardhat";
import type { RoomTypeNFT, PropertyRegistry, HostSBT } from "../types/ethers-contracts";

const { ethers } = await network.connect();

describe("RoomTypeNFT", function () {
  let roomTypeNFT: RoomTypeNFT;
  let propertyRegistry: PropertyRegistry;
  let hostSBT: HostSBT;
  let host: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let platform: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  beforeEach(async function () {
    [, host, platform, user] = await ethers.getSigners();

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

    // Create a property
    await propertyRegistry.connect(host).createProperty("QmProp1", "villa", "Paris");
  });

  describe("Deployment", function () {
    it("Should set the correct PropertyRegistry address", async function () {
      expect(await roomTypeNFT.propertyRegistry()).to.equal(await propertyRegistry.getAddress());
    });
  });

  describe("Add Room Type", function () {
    it("Should add room type successfully", async function () {
      const tx = await roomTypeNFT.connect(host).addRoomType(
        1, // propertyId
        "Deluxe Room",
        "QmRoom1",
        100, // pricePerNight
        20, // cleaningFee
        2, // maxGuests
        5 // maxSupply
      );

      const tokenId = (1n << 128n) | 1n; // propertyId=1, roomTypeId=1

      // Verify event with all arguments including ipfsHash
      await expect(tx)
        .to.emit(roomTypeNFT, "RoomTypeAdded")
        .withArgs(1, 1, tokenId, "Deluxe Room", "QmRoom1", 100, 5);

      const roomType = await roomTypeNFT.getRoomType(tokenId);

      expect(roomType.roomTypeId).to.equal(1);
      expect(roomType.propertyId).to.equal(1);
      expect(roomType.name).to.equal("Deluxe Room");
      expect(roomType.ipfsMetadataHash).to.equal("QmRoom1");
      expect(roomType.pricePerNight).to.equal(100);
      expect(roomType.totalSupply).to.equal(5);
      expect(roomType.isActive).to.be.true;
    });

    it("Should mint tokens to property owner", async function () {
      await roomTypeNFT.connect(host).addRoomType(1, "Deluxe Room", "QmRoom1", 100, 20, 2, 5);

      const tokenId = (1n << 128n) | 1n;
      expect(await roomTypeNFT.balanceOf(host.address, tokenId)).to.equal(5);
    });

    it("Should increment room type ID", async function () {
      await roomTypeNFT.connect(host).addRoomType(1, "Room 1", "Qm1", 100, 20, 2, 5);
      await roomTypeNFT.connect(host).addRoomType(1, "Room 2", "Qm2", 150, 30, 4, 3);

      const tokenId1 = (1n << 128n) | 1n;
      const tokenId2 = (1n << 128n) | 2n;

      const roomType1 = await roomTypeNFT.getRoomType(tokenId1);
      const roomType2 = await roomTypeNFT.getRoomType(tokenId2);

      expect(roomType1.roomTypeId).to.equal(1);
      expect(roomType2.roomTypeId).to.equal(2);
    });

    it("Should revert if not property owner", async function () {
      await expect(
        roomTypeNFT.connect(user).addRoomType(1, "Room", "Qm", 100, 20, 2, 5)
      ).to.be.revertedWithCustomError(roomTypeNFT, "NotPropertyOwner");
    });

    it("Should revert if max supply is 0", async function () {
      await expect(
        roomTypeNFT.connect(host).addRoomType(1, "Room", "Qm", 100, 20, 2, 0)
      ).to.be.revertedWithCustomError(roomTypeNFT, "InvalidSupply");
    });
  });

  describe("Update Room Type Settings", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      await roomTypeNFT.connect(host).addRoomType(1, "Room", "Qm", 100, 20, 2, 5);
      tokenId = (1n << 128n) | 1n;
    });

    it("Should update price and cleaning fee", async function () {
      await expect(roomTypeNFT.connect(host).updateRoomTypeSettings(tokenId, 150, 30)).to.emit(
        roomTypeNFT,
        "RoomTypeUpdated"
      );

      const roomType = await roomTypeNFT.getRoomType(tokenId);
      expect(roomType.pricePerNight).to.equal(150);
      expect(roomType.cleaningFee).to.equal(30);
    });

    it("Should revert if not property owner", async function () {
      await expect(
        roomTypeNFT.connect(user).updateRoomTypeSettings(tokenId, 150, 30)
      ).to.be.revertedWithCustomError(roomTypeNFT, "NotPropertyOwner");
    });
  });

  describe("Update Room Type Metadata", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      await roomTypeNFT.connect(host).addRoomType(1, "Room", "QmOldHash", 100, 20, 2, 5);
      tokenId = (1n << 128n) | 1n;
    });

    it("Should update metadata IPFS hash", async function () {
      const newIpfsHash = "QmNewMetadataHash123";

      await expect(roomTypeNFT.connect(host).updateRoomTypeMetadata(tokenId, newIpfsHash))
        .to.emit(roomTypeNFT, "RoomTypeMetadataUpdated")
        .withArgs(tokenId, newIpfsHash);

      const roomType = await roomTypeNFT.getRoomType(tokenId);
      expect(roomType.ipfsMetadataHash).to.equal(newIpfsHash);
    });

    it("Should revert if not property owner", async function () {
      await expect(
        roomTypeNFT.connect(user).updateRoomTypeMetadata(tokenId, "QmNew")
      ).to.be.revertedWithCustomError(roomTypeNFT, "NotPropertyOwner");
    });

    it("Should revert if room type not found", async function () {
      const nonExistentTokenId = (1n << 128n) | 999n;
      await expect(
        roomTypeNFT.connect(host).updateRoomTypeMetadata(nonExistentTokenId, "QmNew")
      ).to.be.revertedWithCustomError(roomTypeNFT, "RoomTypeNotFound");
    });
  });

  describe("Update Room Type Supply", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      await roomTypeNFT.connect(host).addRoomType(1, "Room", "Qm", 100, 20, 2, 5);
      tokenId = (1n << 128n) | 1n;
    });

    it("Should increase supply", async function () {
      await expect(roomTypeNFT.connect(host).updateRoomTypeSupply(tokenId, 10))
        .to.emit(roomTypeNFT, "RoomTypeSupplyIncreased")
        .withArgs(tokenId, 5, 10);

      const roomType = await roomTypeNFT.getRoomType(tokenId);
      expect(roomType.totalSupply).to.equal(10);
      expect(await roomTypeNFT.balanceOf(host.address, tokenId)).to.equal(10);
    });

    it("Should revert if trying to reduce supply", async function () {
      await expect(
        roomTypeNFT.connect(host).updateRoomTypeSupply(tokenId, 3)
      ).to.be.revertedWithCustomError(roomTypeNFT, "CannotReduceSupply");
    });
  });

  describe("Delete Room Type", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      await roomTypeNFT.connect(host).addRoomType(1, "Room", "Qm", 100, 20, 2, 5);
      tokenId = (1n << 128n) | 1n;
    });

    it("Should delete room type", async function () {
      await expect(roomTypeNFT.connect(host).deleteRoomType(tokenId))
        .to.emit(roomTypeNFT, "RoomTypeDeleted")
        .withArgs(tokenId);

      await expect(roomTypeNFT.getRoomType(tokenId)).to.be.revertedWithCustomError(
        roomTypeNFT,
        "RoomTypeNotFound"
      );
    });

    it("Should remove from property room types array", async function () {
      await roomTypeNFT.connect(host).addRoomType(1, "Room 2", "Qm2", 150, 30, 4, 3);
      const tokenId2 = (1n << 128n) | 2n;

      await roomTypeNFT.connect(host).deleteRoomType(tokenId);

      const roomTypes = await roomTypeNFT.getPropertyRoomTypes(1);
      expect(roomTypes.length).to.equal(1);
      expect(roomTypes[0]).to.equal(tokenId2);
    });
  });

  describe("Set Room Type Active", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      await roomTypeNFT.connect(host).addRoomType(1, "Room", "Qm", 100, 20, 2, 5);
      tokenId = (1n << 128n) | 1n;
    });

    it("Should deactivate room type", async function () {
      await expect(roomTypeNFT.connect(host).setRoomTypeActive(tokenId, false))
        .to.emit(roomTypeNFT, "RoomTypeDeactivated")
        .withArgs(tokenId);

      const roomType = await roomTypeNFT.getRoomType(tokenId);
      expect(roomType.isActive).to.be.false;
    });

    it("Should reactivate room type", async function () {
      await roomTypeNFT.connect(host).setRoomTypeActive(tokenId, false);

      await expect(roomTypeNFT.connect(host).setRoomTypeActive(tokenId, true))
        .to.emit(roomTypeNFT, "RoomTypeActivated")
        .withArgs(tokenId);

      const roomType = await roomTypeNFT.getRoomType(tokenId);
      expect(roomType.isActive).to.be.true;
    });
  });

  describe("Token ID Encoding/Decoding", function () {
    it("Should encode token ID correctly", async function () {
      const tokenId = await roomTypeNFT.encodeTokenId(42, 7);
      expect(tokenId).to.equal((42n << 128n) | 7n);
    });

    it("Should decode token ID correctly", async function () {
      const tokenId = (42n << 128n) | 7n;
      const [propertyId, roomTypeId] = await roomTypeNFT.decodeTokenId(tokenId);
      expect(propertyId).to.equal(42);
      expect(roomTypeId).to.equal(7);
    });
  });

  describe("Get Property Room Types", function () {
    it("Should return all room types for a property", async function () {
      await roomTypeNFT.connect(host).addRoomType(1, "Room 1", "Qm1", 100, 20, 2, 5);
      await roomTypeNFT.connect(host).addRoomType(1, "Room 2", "Qm2", 150, 30, 4, 3);
      await roomTypeNFT.connect(host).addRoomType(1, "Room 3", "Qm3", 200, 40, 6, 2);

      const roomTypes = await roomTypeNFT.getPropertyRoomTypes(1);
      expect(roomTypes.length).to.equal(3);
    });
  });

  describe("URI", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      await roomTypeNFT.connect(host).addRoomType(1, "Room", "QmRoom123", 100, 20, 2, 5);
      tokenId = (1n << 128n) | 1n;
    });

    it("Should return correct URI", async function () {
      const uri = await roomTypeNFT.uri(tokenId);
      expect(uri).to.include("ipfs://");
      expect(uri).to.include("QmProp1");
      expect(uri).to.include("QmRoom123");
    });
  });

  describe("Error Path Coverage", function () {
    it("Should revert updateRoomTypeSettings if room type not found", async function () {
      const nonExistentTokenId = (1n << 128n) | 999n;
      await expect(
        roomTypeNFT.connect(host).updateRoomTypeSettings(nonExistentTokenId, 150, 30)
      ).to.be.revertedWithCustomError(roomTypeNFT, "RoomTypeNotFound");
    });

    it("Should revert updateRoomTypeSupply if room type not found", async function () {
      const nonExistentTokenId = (1n << 128n) | 999n;
      await expect(
        roomTypeNFT.connect(host).updateRoomTypeSupply(nonExistentTokenId, 10)
      ).to.be.revertedWithCustomError(roomTypeNFT, "RoomTypeNotFound");
    });

    it("Should return early if new supply equals old supply", async function () {
      await propertyRegistry.connect(host).createProperty("QmProp1", "hotel", "Paris");
      await roomTypeNFT.connect(host).addRoomType(1, "Room", "QmRoom123", 100, 20, 2, 5);
      const tokenId = (1n << 128n) | 1n;

      // Try to update to same supply (should return without error or event)
      await expect(roomTypeNFT.connect(host).updateRoomTypeSupply(tokenId, 5)).to.not.emit(
        roomTypeNFT,
        "RoomTypeSupplyIncreased"
      );
    });

    it("Should revert deleteRoomType if room type not found", async function () {
      const nonExistentTokenId = (1n << 128n) | 999n;
      await expect(
        roomTypeNFT.connect(host).deleteRoomType(nonExistentTokenId)
      ).to.be.revertedWithCustomError(roomTypeNFT, "RoomTypeNotFound");
    });

    it("Should allow owner to set property registry", async function () {
      const newRegistry = user.address;
      await roomTypeNFT.setPropertyRegistry(newRegistry);
      expect(await roomTypeNFT.propertyRegistry()).to.equal(newRegistry);
    });

    it("Should revert setPropertyRegistry if zero address", async function () {
      await expect(
        roomTypeNFT.setPropertyRegistry(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(roomTypeNFT, "InvalidAddress");
    });

    it("Should revert setRoomTypeActive if not property owner", async function () {
      await propertyRegistry.connect(host).createProperty("QmProp1", "hotel", "Paris");
      await roomTypeNFT.connect(host).addRoomType(1, "Room", "QmRoom123", 100, 20, 2, 5);
      const tokenId = (1n << 128n) | 1n;

      await expect(
        roomTypeNFT.connect(user).setRoomTypeActive(tokenId, false)
      ).to.be.revertedWithCustomError(roomTypeNFT, "NotPropertyOwner");
    });

    it("Should revert setRoomTypeActive if room type not found", async function () {
      const nonExistentTokenId = (1n << 128n) | 999n;
      await expect(
        roomTypeNFT.connect(host).setRoomTypeActive(nonExistentTokenId, false)
      ).to.be.revertedWithCustomError(roomTypeNFT, "RoomTypeNotFound");
    });

    it("Should revert updateRoomTypeSupply if not property owner", async function () {
      await propertyRegistry.connect(host).createProperty("QmProp1", "hotel", "Paris");
      await roomTypeNFT.connect(host).addRoomType(1, "Room", "QmRoom123", 100, 20, 2, 5);
      const tokenId = (1n << 128n) | 1n;

      await expect(
        roomTypeNFT.connect(user).updateRoomTypeSupply(tokenId, 10)
      ).to.be.revertedWithCustomError(roomTypeNFT, "NotPropertyOwner");
    });

    it("Should revert deleteRoomType if not property owner", async function () {
      await propertyRegistry.connect(host).createProperty("QmProp1", "hotel", "Paris");
      await roomTypeNFT.connect(host).addRoomType(1, "Room", "QmRoom123", 100, 20, 2, 5);
      const tokenId = (1n << 128n) | 1n;

      await expect(roomTypeNFT.connect(user).deleteRoomType(tokenId)).to.be.revertedWithCustomError(
        roomTypeNFT,
        "NotPropertyOwner"
      );
    });

    it("Should revert uri() if invalid token ID", async function () {
      const nonExistentTokenId = (1n << 128n) | 999n;
      await expect(roomTypeNFT.uri(nonExistentTokenId)).to.be.revertedWithCustomError(
        roomTypeNFT,
        "InvalidTokenId"
      );
    });

    it("Should revert setAvailabilityManager if zero address", async function () {
      await expect(
        roomTypeNFT.setAvailabilityManager(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(roomTypeNFT, "InvalidAddress");
    });

    it("Should revert setBookingManager if zero address", async function () {
      await expect(roomTypeNFT.setBookingManager(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        roomTypeNFT,
        "InvalidAddress"
      );
    });

    it("Should delete room type even when booking manager is set (no active bookings)", async function () {
      // Set booking manager to a valid address (user has no hasActiveBookings function, so staticcall fails gracefully)
      await roomTypeNFT.setBookingManager(user.address);

      await roomTypeNFT.connect(host).addRoomType(1, "Room", "Qm", 100, 20, 2, 5);
      const tokenId = (1n << 128n) | 1n;

      // Should succeed because staticcall will fail or return false
      await expect(roomTypeNFT.connect(host).deleteRoomType(tokenId))
        .to.emit(roomTypeNFT, "RoomTypeDeleted")
        .withArgs(tokenId);
    });

    it("Should revert deleteRoomType when has active bookings", async function () {
      // Deploy mock booking manager that returns true for hasActiveBookings
      const MockBookingManagerFactory = await ethers.getContractFactory(
        "MockBookingManagerWithActiveBookings"
      );
      const mockBookingManager = await MockBookingManagerFactory.deploy();
      await mockBookingManager.waitForDeployment();

      await roomTypeNFT.setBookingManager(await mockBookingManager.getAddress());

      await roomTypeNFT.connect(host).addRoomType(1, "Room", "Qm", 100, 20, 2, 5);
      const tokenId = (1n << 128n) | 1n;

      // Should revert because hasActiveBookings returns true
      await expect(roomTypeNFT.connect(host).deleteRoomType(tokenId)).to.be.revertedWithCustomError(
        roomTypeNFT,
        "HasActiveBookings"
      );
    });
  });
});
