import { expect } from "chai";
import { network } from "hardhat";
import type { PropertyRegistry, HostSBT } from "../types/ethers-contracts";

const { ethers } = await network.connect();

describe("PropertyRegistry", function () {
  let propertyRegistry: PropertyRegistry;
  let hostSBT: HostSBT;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let host: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let platform: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let bookingManager: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let reviewRegistry: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  beforeEach(async function () {
    [owner, host, platform, bookingManager, reviewRegistry] = await ethers.getSigners();

    // Deploy HostSBT
    const HostSBTFactory = await ethers.getContractFactory("HostSBT");
    hostSBT = (await HostSBTFactory.deploy()) as unknown as HostSBT;
    await hostSBT.waitForDeployment();

    // Mint HostSBT for host
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

    // Set BookingManager and ReviewRegistry
    await propertyRegistry.setBookingManager(bookingManager.address);
    await propertyRegistry.setReviewRegistry(reviewRegistry.address);
  });

  describe("Deployment", function () {
    it("Should set the correct HostSBT address", async function () {
      expect(await propertyRegistry.hostSBT()).to.equal(await hostSBT.getAddress());
    });

    it("Should set the correct platform address", async function () {
      expect(await propertyRegistry.platform()).to.equal(platform.address);
    });

    it("Should start with property counter at 1", async function () {
      expect(await propertyRegistry.totalProperties()).to.equal(0);
    });
  });

  describe("Create Property", function () {
    it("Should create a property successfully", async function () {
      const tx = await propertyRegistry
        .connect(host)
        .createProperty("QmTest123", "villa", "Paris, France");

      await expect(tx).to.emit(propertyRegistry, "PropertyCreated");

      expect(await propertyRegistry.totalProperties()).to.equal(1);
      expect(await propertyRegistry.propertyOwner(1)).to.equal(host.address);
    });

    it("Should increment property counter", async function () {
      await propertyRegistry.connect(host).createProperty("QmTest1", "villa", "Paris");
      await propertyRegistry.connect(host).createProperty("QmTest2", "apartment", "London");

      expect(await propertyRegistry.totalProperties()).to.equal(2);
    });

    it("Should store property details correctly", async function () {
      await propertyRegistry.connect(host).createProperty("QmTest123", "villa", "Paris, France");

      const property = await propertyRegistry.getProperty(1);
      expect(property.propertyId).to.equal(1);
      expect(property.hostWallet).to.equal(host.address);
      expect(property.isActive).to.equal(true);
      expect(property.propertyType).to.equal("villa");
      expect(property.location).to.equal("Paris, France");
      expect(property.ipfsMetadataHash).to.equal("QmTest123");
    });

    it("Should revert if caller doesn't have HostSBT", async function () {
      await expect(
        propertyRegistry.connect(owner).createProperty("QmTest", "villa", "Paris")
      ).to.be.revertedWithCustomError(propertyRegistry, "MustHaveHostSBT");
    });
  });

  describe("Property Ownership", function () {
    beforeEach(async function () {
      await propertyRegistry.connect(host).createProperty("QmTest", "villa", "Paris");
    });

    it("Should verify property owner correctly", async function () {
      expect(await propertyRegistry.isPropertyOwner(1, host.address)).to.be.true;
      expect(await propertyRegistry.isPropertyOwner(1, owner.address)).to.be.false;
    });

    it("Should return correct property owner", async function () {
      expect(await propertyRegistry.propertyOwner(1)).to.equal(host.address);
    });
  });

  describe("Property Active Status", function () {
    beforeEach(async function () {
      await propertyRegistry.connect(host).createProperty("QmTest", "villa", "Paris");
    });

    it("Should deactivate property", async function () {
      await expect(propertyRegistry.connect(host).setPropertyActive(1, false))
        .to.emit(propertyRegistry, "PropertyDeactivated")
        .withArgs(1);

      const property = await propertyRegistry.getProperty(1);
      expect(property.isActive).to.be.false;
    });

    it("Should reactivate property", async function () {
      await propertyRegistry.connect(host).setPropertyActive(1, false);

      await expect(propertyRegistry.connect(host).setPropertyActive(1, true))
        .to.emit(propertyRegistry, "PropertyActivated")
        .withArgs(1);

      const property = await propertyRegistry.getProperty(1);
      expect(property.isActive).to.be.true;
    });

    it("Should revert if not property owner", async function () {
      await expect(
        propertyRegistry.connect(owner).setPropertyActive(1, false)
      ).to.be.revertedWithCustomError(propertyRegistry, "NotPropertyOwner");
    });
  });

  describe("Transfer Property Ownership", function () {
    let newOwner: Awaited<ReturnType<typeof ethers.getSigners>>[0];

    beforeEach(async function () {
      [, , , , , , newOwner] = await ethers.getSigners();
      await hostSBT.mint(newOwner.address);
      await propertyRegistry.connect(host).createProperty("QmTest", "villa", "Paris");
    });

    it("Should transfer ownership (platform only)", async function () {
      await expect(
        propertyRegistry.connect(platform).transferPropertyOwnership(1, newOwner.address)
      )
        .to.emit(propertyRegistry, "PropertyOwnershipTransferred")
        .withArgs(1, host.address, newOwner.address);

      expect(await propertyRegistry.propertyOwner(1)).to.equal(newOwner.address);
    });

    it("Should revert if not platform", async function () {
      await expect(
        propertyRegistry.connect(host).transferPropertyOwnership(1, newOwner.address)
      ).to.be.revertedWithCustomError(propertyRegistry, "NotPlatform");
    });

    it("Should revert if new owner has no HostSBT", async function () {
      await expect(
        propertyRegistry.connect(platform).transferPropertyOwnership(1, owner.address)
      ).to.be.revertedWithCustomError(propertyRegistry, "MustHaveHostSBT");
    });
  });

  describe("Booking Count", function () {
    beforeEach(async function () {
      await propertyRegistry.connect(host).createProperty("QmTest", "villa", "Paris");
    });

    it("Should increment booking count (BookingManager only)", async function () {
      await propertyRegistry.connect(bookingManager).incrementBookingCount(1);

      const property = await propertyRegistry.getProperty(1);
      expect(property.totalBookings).to.equal(1);
    });

    it("Should revert if not BookingManager", async function () {
      await expect(
        propertyRegistry.connect(host).incrementBookingCount(1)
      ).to.be.revertedWithCustomError(propertyRegistry, "NotAuthorized");
    });
  });

  describe("Update Property Rating", function () {
    beforeEach(async function () {
      await propertyRegistry.connect(host).createProperty("QmTest", "villa", "Paris");
    });

    it("Should update rating (ReviewRegistry only)", async function () {
      await expect(propertyRegistry.connect(reviewRegistry).updatePropertyRating(1, 5)).to.emit(
        propertyRegistry,
        "PropertyRated"
      );

      const property = await propertyRegistry.getProperty(1);
      expect(property.averageRating).to.equal(500); // Rating is scaled by 100
      expect(property.totalReviewsReceived).to.equal(1);
    });

    it("Should calculate average rating correctly", async function () {
      await propertyRegistry.connect(reviewRegistry).updatePropertyRating(1, 5);
      await propertyRegistry.connect(reviewRegistry).updatePropertyRating(1, 3);

      const property = await propertyRegistry.getProperty(1);
      expect(property.averageRating).to.equal(400); // (500 + 300) / 2 = 400
    });

    it("Should revert if not ReviewRegistry", async function () {
      await expect(
        propertyRegistry.connect(host).updatePropertyRating(1, 5)
      ).to.be.revertedWithCustomError(propertyRegistry, "NotAuthorized");
    });
  });

  describe("Admin Functions", function () {
    it("Should set platform (owner only)", async function () {
      const newPlatform = owner.address;
      await propertyRegistry.setPlatform(newPlatform);
      expect(await propertyRegistry.platform()).to.equal(newPlatform);
    });

    it("Should set BookingManager (owner only)", async function () {
      const newManager = owner.address;
      await propertyRegistry.setBookingManager(newManager);
      expect(await propertyRegistry.bookingManager()).to.equal(newManager);
    });

    it("Should revert admin functions if not owner", async function () {
      await expect(
        propertyRegistry.connect(host).setPlatform(owner.address)
      ).to.be.revertedWithCustomError(propertyRegistry, "OwnableUnauthorizedAccount");
    });
  });

  describe("Admin Setter Zero Address and Rating Errors", function () {
    it("should revert setPlatform with zero address", async function () {
      await expect(propertyRegistry.setPlatform(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        propertyRegistry,
        "InvalidAddress"
      );
    });

    it("should revert setRoomTypeNFT with zero address", async function () {
      await expect(
        propertyRegistry.setRoomTypeNFT(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(propertyRegistry, "InvalidAddress");
    });

    it("should revert setBookingManager with zero address", async function () {
      await expect(
        propertyRegistry.setBookingManager(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(propertyRegistry, "InvalidAddress");
    });

    it("should revert setReviewRegistry with zero address", async function () {
      await expect(
        propertyRegistry.setReviewRegistry(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(propertyRegistry, "InvalidAddress");
    });

    it("should revert updatePropertyRating with rating < 1", async function () {
      await propertyRegistry.connect(host).createProperty("QmHash", "apartment", "Paris");
      await propertyRegistry.setReviewRegistry(owner.address);

      await expect(propertyRegistry.updatePropertyRating(1, 0)).to.be.revertedWithCustomError(
        propertyRegistry,
        "InvalidRating"
      );
    });

    it("should revert updatePropertyRating with rating > 5", async function () {
      await propertyRegistry.connect(host).createProperty("QmHash", "apartment", "Paris");
      await propertyRegistry.setReviewRegistry(owner.address);

      await expect(propertyRegistry.updatePropertyRating(1, 6)).to.be.revertedWithCustomError(
        propertyRegistry,
        "InvalidRating"
      );
    });
  });
});
