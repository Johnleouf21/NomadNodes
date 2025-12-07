import { expect } from "chai";
import { network } from "hardhat";
import type { HostSBT } from "../types/ethers-contracts";

const { ethers } = await network.connect();

describe("HostSBT", function () {
  let hostSBT: HostSBT;
  let host1: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let host2: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let authorizedUpdater: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  beforeEach(async function () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_owner, _host1, _host2, _authorizedUpdater] = await ethers.getSigners();
    host1 = _host1;
    host2 = _host2;
    authorizedUpdater = _authorizedUpdater;

    const HostSBTFactory = await ethers.getContractFactory("HostSBT");
    hostSBT = (await HostSBTFactory.deploy()) as unknown as HostSBT;

    // Authorize updater
    await hostSBT.setAuthorizedUpdater(authorizedUpdater.address, true);
  });

  describe("Deployment", function () {
    it("should deploy with correct name and symbol", async function () {
      expect(await hostSBT.name()).to.equal("Host SBT");
      expect(await hostSBT.symbol()).to.equal("HOST");
    });

    it("should start with tokenId counter at 1", async function () {
      await hostSBT.mint(host1.address);
      expect(await hostSBT.walletToTokenId(host1.address)).to.equal(1);
    });
  });

  describe("Minting SBT", function () {
    it("should mint SBT to new host", async function () {
      await expect(hostSBT.mint(host1.address))
        .to.emit(hostSBT, "HostMinted")
        .withArgs(host1.address, 1);

      expect(await hostSBT.balanceOf(host1.address)).to.equal(1);
      expect(await hostSBT.ownerOf(1)).to.equal(host1.address);
      expect(await hostSBT.hasSBT(host1.address)).to.be.true;
    });

    it("should revert if user already has SBT", async function () {
      await hostSBT.mint(host1.address);

      await expect(hostSBT.mint(host1.address)).to.be.revertedWithCustomError(
        hostSBT,
        "AlreadyHasSBT"
      );
    });

    it("should increment token counter", async function () {
      await hostSBT.mint(host1.address);
      await hostSBT.mint(host2.address);

      expect(await hostSBT.walletToTokenId(host1.address)).to.equal(1);
      expect(await hostSBT.walletToTokenId(host2.address)).to.equal(2);
    });

    it("should initialize profile correctly", async function () {
      await hostSBT.mint(host1.address);

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.totalPropertiesListed).to.equal(0);
      expect(profile.totalBookingsReceived).to.equal(0);
      expect(profile.completedBookings).to.equal(0);
      expect(profile.averageRating).to.equal(0);
      expect(profile.totalReviewsReceived).to.equal(0);
      expect(profile.positiveReviews).to.equal(0);
      expect(profile.averageResponseTime).to.equal(0);
      expect(profile.acceptanceRate).to.equal(10000); // 100%
      expect(profile.cancellationsByHost).to.equal(0);
      expect(profile.superHost).to.be.false;
      expect(profile.suspended).to.be.false;
      expect(profile.timesReportedByTravelers).to.equal(0);
    });
  });

  describe("Soulbound Transfer Restrictions", function () {
    beforeEach(async function () {
      await hostSBT.mint(host1.address);
    });

    it("should block regular transfers", async function () {
      await expect(
        hostSBT.connect(host1).transferFrom(host1.address, host2.address, 1)
      ).to.be.revertedWithCustomError(hostSBT, "SoulboundToken");
    });

    it("should block safeTransferFrom", async function () {
      await expect(
        hostSBT
          .connect(host1)
          ["safeTransferFrom(address,address,uint256)"](host1.address, host2.address, 1)
      ).to.be.revertedWithCustomError(hostSBT, "SoulboundToken");
    });
  });

  describe("Property Linking", function () {
    beforeEach(async function () {
      await hostSBT.mint(host1.address);
    });

    it("should link property from authorized updater", async function () {
      const tokenId = await hostSBT.walletToTokenId(host1.address);
      const propertyId = 1;

      await expect(hostSBT.connect(authorizedUpdater).linkProperty(host1.address, propertyId))
        .to.emit(hostSBT, "PropertyLinked")
        .withArgs(tokenId, propertyId);

      const properties = await hostSBT.getHostProperties(host1.address);
      expect(properties.length).to.equal(1);
      expect(properties[0]).to.equal(propertyId);

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.totalPropertiesListed).to.equal(1);
    });

    it("should unlink property from authorized updater", async function () {
      const tokenId = await hostSBT.walletToTokenId(host1.address);
      const propertyId = 1;

      await hostSBT.connect(authorizedUpdater).linkProperty(host1.address, propertyId);

      await expect(hostSBT.connect(authorizedUpdater).unlinkProperty(host1.address, propertyId))
        .to.emit(hostSBT, "PropertyUnlinked")
        .withArgs(tokenId, propertyId);

      const properties = await hostSBT.getHostProperties(host1.address);
      expect(properties.length).to.equal(0);
    });

    it("should revert if not authorized", async function () {
      await expect(
        hostSBT.connect(host2).linkProperty(host1.address, 1)
      ).to.be.revertedWithCustomError(hostSBT, "NotAuthorized");
    });

    it("should revert if linking property to non-existent SBT", async function () {
      await expect(
        hostSBT.connect(authorizedUpdater).linkProperty(host2.address, 1)
      ).to.be.revertedWithCustomError(hostSBT, "NoSBT"); // Line 254
    });

    it("should revert if unlinking property from non-existent SBT", async function () {
      await expect(
        hostSBT.connect(authorizedUpdater).unlinkProperty(host2.address, 1)
      ).to.be.revertedWithCustomError(hostSBT, "NoSBT"); // Line 273
    });

    it("should revert if not authorized to unlink", async function () {
      await hostSBT.connect(authorizedUpdater).linkProperty(host1.address, 1);

      await expect(
        hostSBT.connect(host2).unlinkProperty(host1.address, 1)
      ).to.be.revertedWithCustomError(hostSBT, "NotAuthorized"); // Line 270
    });

    it("should handle multiple properties", async function () {
      await hostSBT.connect(authorizedUpdater).linkProperty(host1.address, 1);
      await hostSBT.connect(authorizedUpdater).linkProperty(host1.address, 2);
      await hostSBT.connect(authorizedUpdater).linkProperty(host1.address, 3);

      const properties = await hostSBT.getHostProperties(host1.address);
      expect(properties.length).to.equal(3);
      expect(properties).to.deep.equal([1n, 2n, 3n]);
    });
  });

  describe("Booking Count Functions", function () {
    beforeEach(async function () {
      await hostSBT.mint(host1.address);
    });

    it("should increment booking received count", async function () {
      await hostSBT.connect(authorizedUpdater).incrementBookingReceived(host1.address);

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.totalBookingsReceived).to.equal(1);
    });

    it("should increment completed bookings", async function () {
      await hostSBT.connect(authorizedUpdater).incrementCompletedBooking(host1.address);

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.completedBookings).to.equal(1);
    });

    it("should revert incrementBookingReceived if not authorized", async function () {
      await expect(
        hostSBT.connect(host2).incrementBookingReceived(host1.address)
      ).to.be.revertedWithCustomError(hostSBT, "NotAuthorized");
    });

    it("should revert incrementBookingReceived if no SBT", async function () {
      await expect(
        hostSBT.connect(authorizedUpdater).incrementBookingReceived(host2.address)
      ).to.be.revertedWithCustomError(hostSBT, "NoSBT");
    });

    it("should revert incrementBookingReceived if suspended", async function () {
      await hostSBT.suspendHost(host1.address);

      await expect(
        hostSBT.connect(authorizedUpdater).incrementBookingReceived(host1.address)
      ).to.be.revertedWithCustomError(hostSBT, "HostIsSuspended");
    });

    it("should revert incrementCompletedBooking if not authorized", async function () {
      await expect(
        hostSBT.connect(host2).incrementCompletedBooking(host1.address)
      ).to.be.revertedWithCustomError(hostSBT, "NotAuthorized");
    });

    it("should revert incrementCompletedBooking if no SBT", async function () {
      await expect(
        hostSBT.connect(authorizedUpdater).incrementCompletedBooking(host2.address)
      ).to.be.revertedWithCustomError(hostSBT, "NoSBT");
    });

    it("should revert incrementCompletedBooking if suspended", async function () {
      await hostSBT.suspendHost(host1.address);

      await expect(
        hostSBT.connect(authorizedUpdater).incrementCompletedBooking(host1.address)
      ).to.be.revertedWithCustomError(hostSBT, "HostIsSuspended");
    });

    it("should update tier when booking count changes", async function () {
      // Add 7 bookings to reach Experienced tier
      for (let i = 0; i < 7; i++) {
        await hostSBT.connect(authorizedUpdater).incrementBookingReceived(host1.address);
      }

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.tier).to.equal(1); // Experienced
    });
  });

  describe("Reputation System", function () {
    beforeEach(async function () {
      await hostSBT.mint(host1.address);
    });

    it("should update reputation after review (without incrementing bookings)", async function () {
      const rating = 5; // 5 stars
      const responseTime = 30; // 30 minutes

      await expect(
        hostSBT.connect(authorizedUpdater).updateReputation(host1.address, rating, responseTime)
      ).to.emit(hostSBT, "ReputationUpdated");

      const profile = await hostSBT.getProfile(host1.address);
      // totalBookingsReceived and completedBookings should NOT be incremented by updateReputation
      expect(profile.totalBookingsReceived).to.equal(0);
      expect(profile.completedBookings).to.equal(0);
      expect(profile.totalReviewsReceived).to.equal(1);
      expect(profile.positiveReviews).to.equal(1);
      expect(profile.averageRating).to.equal(500); // 5.00 stars = 500
      expect(profile.averageResponseTime).to.equal(30);
    });

    it("should calculate average rating correctly", async function () {
      // First review: 5 stars
      await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 5, 30);

      // Second review: 4 stars
      await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 4, 60);

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.totalReviewsReceived).to.equal(2);
      expect(profile.averageRating).to.equal(450); // (5+4)/2 = 4.5 = 450
    });

    it("should revert if rating is invalid", async function () {
      await expect(
        hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 6, 30)
      ).to.be.revertedWithCustomError(hostSBT, "InvalidRating");

      await expect(
        hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 0, 30)
      ).to.be.revertedWithCustomError(hostSBT, "InvalidRating");
    });

    it("should revert if not authorized", async function () {
      await expect(
        hostSBT.connect(host2).updateReputation(host1.address, 5, 30)
      ).to.be.revertedWithCustomError(hostSBT, "NotAuthorized");
    });

    it("should revert if updating reputation for non-existent SBT", async function () {
      await expect(
        hostSBT.connect(authorizedUpdater).updateReputation(host2.address, 5, 30)
      ).to.be.revertedWithCustomError(hostSBT, "NoSBT");
    });

    it("should revert if updating reputation for suspended host", async function () {
      await hostSBT.suspendHost(host1.address);

      await expect(
        hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 5, 30)
      ).to.be.revertedWithCustomError(hostSBT, "HostIsSuspended");
    });

    it("should count positive reviews (4-5 stars)", async function () {
      await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 5, 30);
      await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 4, 30);
      await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 3, 30);
      await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 2, 30);

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.positiveReviews).to.equal(2); // 5 and 4 stars
    });
  });

  describe("Reputation Tiers", function () {
    beforeEach(async function () {
      await hostSBT.mint(host1.address);
    });

    it("should start as Newcomer tier", async function () {
      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.tier).to.equal(0); // Newcomer
    });

    it("should upgrade to Experienced tier", async function () {
      // Add 6 bookings received
      for (let i = 0; i < 6; i++) {
        await hostSBT.connect(authorizedUpdater).incrementBookingReceived(host1.address);
      }

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.tier).to.equal(1); // Experienced
    });

    it("should upgrade to Pro tier", async function () {
      // Add 21 bookings received
      for (let i = 0; i < 21; i++) {
        await hostSBT.connect(authorizedUpdater).incrementBookingReceived(host1.address);
      }
      // Add reviews for avg rating >= 4.0
      for (let i = 0; i < 5; i++) {
        await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 5, 30);
      }

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.tier).to.equal(2); // Pro
      expect(profile.averageRating).to.be.gte(400);
    });

    it("should stay Experienced with insufficient rating for Pro", async function () {
      // Add 21 bookings received
      for (let i = 0; i < 21; i++) {
        await hostSBT.connect(authorizedUpdater).incrementBookingReceived(host1.address);
      }
      // Add reviews with rating < 4.0
      for (let i = 0; i < 5; i++) {
        await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 3, 30);
      }

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.tier).to.equal(1); // Still Experienced
      expect(profile.averageRating).to.be.lt(400);
    });

    it("should award SuperHost status", async function () {
      // Add 50 bookings received
      for (let i = 0; i < 50; i++) {
        await hostSBT.connect(authorizedUpdater).incrementBookingReceived(host1.address);
      }
      // Add reviews with avg rating >= 4.7 and response time < 120min
      for (let i = 0; i < 10; i++) {
        await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 5, 60);
      }

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.tier).to.equal(2); // Pro tier (SuperHost is a separate flag)
      expect(profile.superHost).to.be.true;
      expect(profile.averageRating).to.be.gte(470);
      expect(profile.averageResponseTime).to.be.lt(120);
    });

    it("should revoke SuperHost on low rating", async function () {
      // First get SuperHost status
      for (let i = 0; i < 50; i++) {
        await hostSBT.connect(authorizedUpdater).incrementBookingReceived(host1.address);
      }
      for (let i = 0; i < 10; i++) {
        await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 5, 60);
      }

      let profile = await hostSBT.getProfile(host1.address);
      expect(profile.superHost).to.be.true;

      // Now add low ratings to drop average below 4.7
      for (let i = 0; i < 40; i++) {
        await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 2, 60);
      }

      profile = await hostSBT.getProfile(host1.address);
      expect(profile.superHost).to.be.false; // SuperHost revoked
    });
  });

  describe("Cancellation Tracking", function () {
    beforeEach(async function () {
      await hostSBT.mint(host1.address);
    });

    it("should record cancellation", async function () {
      await hostSBT.connect(authorizedUpdater).recordCancellation(host1.address);

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.cancellationsByHost).to.equal(1);
    });

    it("should track multiple cancellations", async function () {
      await hostSBT.connect(authorizedUpdater).recordCancellation(host1.address);
      await hostSBT.connect(authorizedUpdater).recordCancellation(host1.address);
      await hostSBT.connect(authorizedUpdater).recordCancellation(host1.address);

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.cancellationsByHost).to.equal(3);
    });

    it("should revert if not authorized", async function () {
      await expect(
        hostSBT.connect(host2).recordCancellation(host1.address)
      ).to.be.revertedWithCustomError(hostSBT, "NotAuthorized");
    });

    it("should revoke SuperHost after too many cancellations", async function () {
      // First achieve SuperHost status
      for (let i = 0; i < 50; i++) {
        await hostSBT.connect(authorizedUpdater).incrementBookingReceived(host1.address);
      }
      for (let i = 0; i < 10; i++) {
        await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 5, 60);
      }

      let profile = await hostSBT.getProfile(host1.address);
      expect(profile.superHost).to.be.true;

      // Record 3 cancellations (>2 limit)
      await hostSBT.connect(authorizedUpdater).recordCancellation(host1.address);
      await hostSBT.connect(authorizedUpdater).recordCancellation(host1.address);
      await hostSBT.connect(authorizedUpdater).recordCancellation(host1.address);

      profile = await hostSBT.getProfile(host1.address);
      expect(profile.superHost).to.be.false; // SuperHost revoked
      expect(profile.cancellationsByHost).to.equal(3);
    });

    it("should revert if host has no SBT", async function () {
      await expect(
        hostSBT.connect(authorizedUpdater).recordCancellation(host2.address)
      ).to.be.revertedWithCustomError(hostSBT, "NoSBT"); // Line 231
    });
  });

  describe("Reporting & Suspension", function () {
    beforeEach(async function () {
      await hostSBT.mint(host1.address);
    });

    it("should report host", async function () {
      await hostSBT.connect(authorizedUpdater).reportHost(host1.address);

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.timesReportedByTravelers).to.equal(1);
    });

    it("should auto-suspend after 3 reports", async function () {
      const tokenId = await hostSBT.walletToTokenId(host1.address);

      // Report twice - no suspension yet
      await hostSBT.connect(authorizedUpdater).reportHost(host1.address);
      await hostSBT.connect(authorizedUpdater).reportHost(host1.address);

      let profile = await hostSBT.getProfile(host1.address);
      expect(profile.suspended).to.be.false;

      // Third report triggers auto-suspend (lines 307-311)
      await expect(hostSBT.connect(authorizedUpdater).reportHost(host1.address))
        .to.emit(hostSBT, "HostSuspended")
        .withArgs(host1.address, tokenId);

      profile = await hostSBT.getProfile(host1.address);
      expect(profile.suspended).to.be.true;
      expect(profile.superHost).to.be.false;
      expect(profile.timesReportedByTravelers).to.equal(3);
    });

    it("should revert if not authorized to report", async function () {
      await expect(hostSBT.connect(host2).reportHost(host1.address)).to.be.revertedWithCustomError(
        hostSBT,
        "NotAuthorized"
      ); // Line 298
    });

    it("should revert when reporting host with no SBT", async function () {
      await expect(
        hostSBT.connect(authorizedUpdater).reportHost(host2.address)
      ).to.be.revertedWithCustomError(hostSBT, "NoSBT"); // Line 301
    });

    it("should suspend host", async function () {
      const tokenId = await hostSBT.walletToTokenId(host1.address);

      await expect(hostSBT.suspendHost(host1.address))
        .to.emit(hostSBT, "HostSuspended")
        .withArgs(host1.address, tokenId);

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.suspended).to.be.true;
    });

    it("should unsuspend host", async function () {
      const tokenId = await hostSBT.walletToTokenId(host1.address);

      await hostSBT.suspendHost(host1.address);

      await expect(hostSBT.unsuspendHost(host1.address))
        .to.emit(hostSBT, "HostUnsuspended")
        .withArgs(host1.address, tokenId);

      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.suspended).to.be.false;
    });

    it("should revert if not owner (suspend)", async function () {
      await expect(hostSBT.connect(host2).suspendHost(host1.address)).to.be.revertedWithCustomError(
        hostSBT,
        "OwnableUnauthorizedAccount"
      );
    });

    it("should revert if not owner (unsuspend)", async function () {
      await expect(
        hostSBT.connect(host2).unsuspendHost(host1.address)
      ).to.be.revertedWithCustomError(hostSBT, "OwnableUnauthorizedAccount");
    });

    it("should revert if host has no SBT (suspend)", async function () {
      await expect(hostSBT.suspendHost(host2.address)).to.be.revertedWithCustomError(
        hostSBT,
        "NoSBT"
      );
    });

    it("should revert if host has no SBT (unsuspend)", async function () {
      await expect(hostSBT.unsuspendHost(host2.address)).to.be.revertedWithCustomError(
        hostSBT,
        "NoSBT"
      ); // Line 333
    });
  });

  describe("TokenURI & Metadata", function () {
    beforeEach(async function () {
      await hostSBT.mint(host1.address);
    });

    it("should return tokenURI with SVG", async function () {
      const uri = await hostSBT.tokenURI(1);

      expect(uri).to.include("data:application/json;base64,");

      // Decode and check JSON
      const json = Buffer.from(
        uri.replace("data:application/json;base64,", ""),
        "base64"
      ).toString();
      const metadata = JSON.parse(json);

      expect(metadata.name).to.include("Host Badge #1");
      expect(metadata.description).to.exist;
      expect(metadata.image).to.include("data:image/svg+xml;base64,");
    });

    it("should include reputation in SVG", async function () {
      // Update reputation
      await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 5, 30);

      const uri = await hostSBT.tokenURI(1);
      const json = Buffer.from(
        uri.replace("data:application/json;base64,", ""),
        "base64"
      ).toString();
      const metadata = JSON.parse(json);

      const svg = Buffer.from(
        metadata.image.replace("data:image/svg+xml;base64,", ""),
        "base64"
      ).toString();

      expect(svg).to.include("5.00"); // Rating
      expect(svg).to.include("NEWCOMER"); // Tier
    });

    it("should show SuperHost tier color and name in tokenURI (covers lines 395-397)", async function () {
      // Achieve SuperHost status: 50+ bookings, rating >= 4.7, response time < 120min
      for (let i = 0; i < 50; i++) {
        await hostSBT.connect(authorizedUpdater).incrementBookingReceived(host1.address);
      }
      for (let i = 0; i < 10; i++) {
        await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 5, 60);
      }

      const uri = await hostSBT.tokenURI(1);
      const json = Buffer.from(
        uri.replace("data:application/json;base64,", ""),
        "base64"
      ).toString();
      const metadata = JSON.parse(json);

      const svg = Buffer.from(
        metadata.image.replace("data:image/svg+xml;base64,", ""),
        "base64"
      ).toString();

      expect(svg).to.include("SUPERHOST");
      expect(svg).to.include("#FF1493"); // Pink/magenta color
    });

    it("should show Pro tier color and name in tokenURI (covers lines 398-400)", async function () {
      // Achieve Pro tier: 21+ bookings, rating >= 4.0 (but not SuperHost)
      for (let i = 0; i < 21; i++) {
        await hostSBT.connect(authorizedUpdater).incrementBookingReceived(host1.address);
      }
      for (let i = 0; i < 5; i++) {
        await hostSBT.connect(authorizedUpdater).updateReputation(host1.address, 4, 30);
      }

      const uri = await hostSBT.tokenURI(1);
      const json = Buffer.from(
        uri.replace("data:application/json;base64,", ""),
        "base64"
      ).toString();
      const metadata = JSON.parse(json);

      const svg = Buffer.from(
        metadata.image.replace("data:image/svg+xml;base64,", ""),
        "base64"
      ).toString();

      expect(svg).to.include("PRO");
      expect(svg).to.include("#FFD700"); // Gold color
    });

    it("should show Experienced tier color and name in tokenURI (covers lines 401-403)", async function () {
      // Achieve Experienced tier: 6+ bookings (but not enough for Pro)
      for (let i = 0; i < 10; i++) {
        await hostSBT.connect(authorizedUpdater).incrementBookingReceived(host1.address);
      }

      const uri = await hostSBT.tokenURI(1);
      const json = Buffer.from(
        uri.replace("data:application/json;base64,", ""),
        "base64"
      ).toString();
      const metadata = JSON.parse(json);

      const svg = Buffer.from(
        metadata.image.replace("data:image/svg+xml;base64,", ""),
        "base64"
      ).toString();

      expect(svg).to.include("EXPERIENCED");
      expect(svg).to.include("#C0C0C0"); // Silver color
    });

    it("should show Newcomer tier color and name in tokenURI (covers lines 404-406)", async function () {
      // No bookings - should be Newcomer
      const uri = await hostSBT.tokenURI(1);
      const json = Buffer.from(
        uri.replace("data:application/json;base64,", ""),
        "base64"
      ).toString();
      const metadata = JSON.parse(json);

      const svg = Buffer.from(
        metadata.image.replace("data:image/svg+xml;base64,", ""),
        "base64"
      ).toString();

      expect(svg).to.include("NEWCOMER");
      expect(svg).to.include("#94A3B8"); // Gray color
    });
  });

  describe("Admin Functions", function () {
    it("should set authorized updater", async function () {
      await expect(hostSBT.setAuthorizedUpdater(host1.address, true))
        .to.emit(hostSBT, "AuthorizedUpdaterSet")
        .withArgs(host1.address, true);

      expect(await hostSBT.authorizedUpdaters(host1.address)).to.be.true;
    });

    it("should revoke authorized updater", async function () {
      await hostSBT.setAuthorizedUpdater(host1.address, true);

      await expect(hostSBT.setAuthorizedUpdater(host1.address, false))
        .to.emit(hostSBT, "AuthorizedUpdaterSet")
        .withArgs(host1.address, false);

      expect(await hostSBT.authorizedUpdaters(host1.address)).to.be.false;
    });

    it("should revert if not owner", async function () {
      await expect(
        hostSBT.connect(host1).setAuthorizedUpdater(host2.address, true)
      ).to.be.revertedWithCustomError(hostSBT, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await hostSBT.mint(host1.address);
    });

    it("should check if wallet has SBT", async function () {
      expect(await hostSBT.hasSBT(host1.address)).to.be.true;
      expect(await hostSBT.hasSBT(host2.address)).to.be.false;
    });

    it("should get tokenId from wallet", async function () {
      expect(await hostSBT.walletToTokenId(host1.address)).to.equal(1);
      expect(await hostSBT.walletToTokenId(host2.address)).to.equal(0);
    });

    it("should get profile", async function () {
      const profile = await hostSBT.getProfile(host1.address);
      expect(profile.totalPropertiesListed).to.equal(0);
      expect(profile.totalBookingsReceived).to.equal(0);
    });

    it("should get host properties", async function () {
      await hostSBT.connect(authorizedUpdater).linkProperty(host1.address, 1);
      await hostSBT.connect(authorizedUpdater).linkProperty(host1.address, 2);

      const properties = await hostSBT.getHostProperties(host1.address);
      expect(properties.length).to.equal(2);
      expect(properties[0]).to.equal(1);
      expect(properties[1]).to.equal(2);
    });

    it("should calculate completion rate", async function () {
      // Add 10 bookings received
      for (let i = 0; i < 10; i++) {
        await hostSBT.connect(authorizedUpdater).incrementBookingReceived(host1.address);
      }
      // Complete all 10 bookings
      for (let i = 0; i < 10; i++) {
        await hostSBT.connect(authorizedUpdater).incrementCompletedBooking(host1.address);
      }

      const completionRate = await hostSBT.getCompletionRate(host1.address);
      // completedBookings = 10, totalBookingsReceived = 10
      // rate = (10 * 10000) / 10 = 10000 (100%)
      expect(completionRate).to.equal(10000);
    });

    it("should return 100% completion rate if no bookings", async function () {
      const completionRate = await hostSBT.getCompletionRate(host1.address);
      expect(completionRate).to.equal(10000); // Returns 100% (10000) when no bookings
    });

    it("should revert getProfile if no SBT", async function () {
      await expect(hostSBT.getProfile(host2.address)).to.be.revertedWithCustomError(
        hostSBT,
        "NoSBT"
      );
    });

    it("should revert getHostProperties if no SBT", async function () {
      await expect(hostSBT.getHostProperties(host2.address)).to.be.revertedWithCustomError(
        hostSBT,
        "NoSBT"
      );
    });

    it("should revert getCompletionRate if no SBT", async function () {
      await expect(hostSBT.getCompletionRate(host2.address)).to.be.revertedWithCustomError(
        hostSBT,
        "NoSBT"
      );
    });
  });
});
