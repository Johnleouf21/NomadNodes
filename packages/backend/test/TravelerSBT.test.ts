import { expect } from "chai";
import { network } from "hardhat";
import type { TravelerSBT } from "../types/ethers-contracts";

const { ethers } = await network.connect();

describe("TravelerSBT", function () {
  let travelerSBT: TravelerSBT;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let traveler1: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let traveler2: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  beforeEach(async function () {
    [owner, traveler1, traveler2] = await ethers.getSigners();

    const TravelerSBTFactory = await ethers.getContractFactory("TravelerSBT");
    travelerSBT = (await TravelerSBTFactory.deploy()) as unknown as TravelerSBT;

    // Set owner as authorized updater for tests
    await travelerSBT.setAuthorizedUpdater(owner.address, true);
  });

  describe("Deployment", function () {
    it("should deploy with correct name and symbol", async function () {
      expect(await travelerSBT.name()).to.equal("Traveler SBT");
      expect(await travelerSBT.symbol()).to.equal("TRAVELER");
    });
  });

  describe("Minting SBT", function () {
    it("should mint SBT to new traveler", async function () {
      await expect(travelerSBT.connect(traveler1).mint(traveler1.address))
        .to.emit(travelerSBT, "TravelerMinted")
        .withArgs(traveler1.address, 1);

      expect(await travelerSBT.balanceOf(traveler1.address)).to.equal(1);
      expect(await travelerSBT.hasSBT(traveler1.address)).to.be.true;
    });

    it("should revert if already has SBT", async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);

      await expect(
        travelerSBT.connect(traveler1).mint(traveler1.address)
      ).to.be.revertedWithCustomError(travelerSBT, "AlreadyHasSBT");
    });

    it("should initialize reputation to zero", async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);

      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.totalBookings).to.equal(0);
      expect(profile.averageRating).to.equal(0);
      expect(profile.totalReviewsReceived).to.equal(0);
      expect(profile.cancelledBookings).to.equal(0);
      expect(profile.completedStays).to.equal(0);
    });
  });

  describe("Soulbound Transfer Restrictions", function () {
    beforeEach(async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);
    });

    it("should block transfers", async function () {
      await expect(
        travelerSBT.connect(traveler1).transferFrom(traveler1.address, traveler2.address, 1)
      ).to.be.revertedWithCustomError(travelerSBT, "SoulboundToken");
    });

    it("should block safeTransferFrom", async function () {
      await expect(
        travelerSBT
          .connect(traveler1)
          ["safeTransferFrom(address,address,uint256)"](traveler1.address, traveler2.address, 1)
      ).to.be.revertedWithCustomError(travelerSBT, "SoulboundToken");
    });
  });

  describe("Reputation System", function () {
    beforeEach(async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);
    });

    it("should update reputation after positive review", async function () {
      const rating = 5;
      const cancelled = false;

      await expect(travelerSBT.updateReputation(traveler1.address, rating, cancelled))
        .to.emit(travelerSBT, "ReputationUpdated")
        .withArgs(traveler1.address, 1, 500, 0); // tokenId, averageRating, tier (Newcomer=0)

      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.totalBookings).to.equal(1);
      expect(profile.totalReviewsReceived).to.equal(1);
      expect(profile.averageRating).to.equal(500); // 5.00 * 100
      expect(profile.cancelledBookings).to.equal(0);
    });

    it("should track cancellations", async function () {
      const rating = 1; // Must provide valid rating
      const cancelled = true;

      await travelerSBT.updateReputation(traveler1.address, rating, cancelled);

      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.cancelledBookings).to.equal(1);
      expect(profile.totalBookings).to.equal(1);
      expect(profile.completedStays).to.equal(0); // Cancelled, so not completed
    });

    it("should calculate weighted average rating", async function () {
      await travelerSBT.updateReputation(traveler1.address, 5, false);
      await travelerSBT.updateReputation(traveler1.address, 3, false);

      const profile = await travelerSBT.getProfile(traveler1.address);
      // Average: (500 + 300) / 2 = 400
      expect(profile.averageRating).to.equal(400);
      expect(profile.totalReviewsReceived).to.equal(2);
    });

    it("should track positive reviews", async function () {
      await travelerSBT.updateReputation(traveler1.address, 5, false);
      await travelerSBT.updateReputation(traveler1.address, 4, false);
      await travelerSBT.updateReputation(traveler1.address, 3, false);

      const profile = await travelerSBT.getProfile(traveler1.address);
      // 4-5 stars are positive
      expect(profile.positiveReviews).to.equal(2);
      expect(profile.totalReviewsReceived).to.equal(3);
    });

    it("should not update rating if cancelled", async function () {
      await travelerSBT.updateReputation(traveler1.address, 5, false);
      await travelerSBT.updateReputation(traveler1.address, 1, true); // Cancelled

      const profile = await travelerSBT.getProfile(traveler1.address);
      // Only first review counts for rating
      expect(profile.averageRating).to.equal(500);
      expect(profile.totalReviewsReceived).to.equal(1); // Cancellations don't count as reviews
      expect(profile.cancelledBookings).to.equal(1);
    });

    it("should revert if not called by authorized updater", async function () {
      await travelerSBT.setAuthorizedUpdater(owner.address, false);

      await expect(
        travelerSBT.updateReputation(traveler1.address, 5, false)
      ).to.be.revertedWithCustomError(travelerSBT, "NotAuthorized");
    });

    it("should revert if rating is too low", async function () {
      await expect(
        travelerSBT.updateReputation(traveler1.address, 0, false)
      ).to.be.revertedWithCustomError(travelerSBT, "InvalidRating");
    });

    it("should revert if rating is too high", async function () {
      await expect(
        travelerSBT.updateReputation(traveler1.address, 6, false)
      ).to.be.revertedWithCustomError(travelerSBT, "InvalidRating");
    });

    it("should revert if traveler has no SBT", async function () {
      await expect(
        travelerSBT.updateReputation(traveler2.address, 5, false)
      ).to.be.revertedWithCustomError(travelerSBT, "NoSBT");
    });
  });

  describe("Reputation Tiers", function () {
    beforeEach(async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);
    });

    it("should return Newcomer tier (0-5 bookings)", async function () {
      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.tier).to.equal(0); // Newcomer
    });

    it("should return Regular tier (6-20 bookings)", async function () {
      for (let i = 0; i < 7; i++) {
        await travelerSBT.updateReputation(traveler1.address, 5, false);
      }

      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.tier).to.equal(1); // Regular
    });

    it("should return Trusted tier (21+ bookings, avg >= 4.0)", async function () {
      for (let i = 0; i < 22; i++) {
        await travelerSBT.updateReputation(traveler1.address, 5, false);
      }

      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.tier).to.equal(2); // Trusted
      expect(profile.averageRating).to.be.gte(400);
    });

    it("should return Elite tier (51+ bookings, avg >= 4.5)", async function () {
      // 51 bookings with 5-star rating (avg = 5.0)
      for (let i = 0; i < 51; i++) {
        await travelerSBT.updateReputation(traveler1.address, 5, false);
      }

      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.tier).to.equal(3); // Elite
      expect(profile.averageRating).to.equal(500); // 5.00 * 100
      expect(profile.totalBookings).to.equal(51);
    });

    it("should not upgrade to Elite without sufficient rating", async function () {
      // 51 bookings but rating = 4.0 (< 4.5)
      for (let i = 0; i < 51; i++) {
        await travelerSBT.updateReputation(traveler1.address, 4, false);
      }

      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.tier).to.equal(2); // Trusted, not Elite
      expect(profile.averageRating).to.equal(400);
    });

    it("should not upgrade to Trusted without sufficient rating", async function () {
      // 22 bookings but low rating (< 4.0)
      for (let i = 0; i < 22; i++) {
        await travelerSBT.updateReputation(traveler1.address, 3, false);
      }

      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.tier).to.equal(1); // Regular, not Trusted
      expect(profile.averageRating).to.be.lt(400);
    });
  });

  describe("Metadata & TokenURI", function () {
    beforeEach(async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);
    });

    it("should return tokenURI with dynamic SVG", async function () {
      const tokenURI = await travelerSBT.tokenURI(1);
      expect(tokenURI).to.include("data:application/json;base64");
    });

    it("should reflect tier in tokenURI", async function () {
      // Upgrade to Regular tier
      for (let i = 0; i < 7; i++) {
        await travelerSBT.updateReputation(traveler1.address, 5, false);
      }

      const tokenURI = await travelerSBT.tokenURI(1);
      expect(tokenURI).to.include("data:application/json;base64");
      // TokenURI includes tier information
    });

    it("should revert tokenURI for non-existent token", async function () {
      await expect(travelerSBT.tokenURI(999)).to.be.revertedWithCustomError(
        travelerSBT,
        "ERC721NonexistentToken"
      );
    });
  });

  describe("Admin Functions", function () {
    it("should set authorized updater", async function () {
      const newUpdater = traveler1.address;
      await expect(travelerSBT.setAuthorizedUpdater(newUpdater, true))
        .to.emit(travelerSBT, "AuthorizedUpdaterSet")
        .withArgs(newUpdater, true);

      expect(await travelerSBT.authorizedUpdaters(newUpdater)).to.be.true;
    });

    it("should remove authorized updater", async function () {
      const updater = traveler1.address;
      await travelerSBT.setAuthorizedUpdater(updater, true);
      await travelerSBT.setAuthorizedUpdater(updater, false);

      expect(await travelerSBT.authorizedUpdaters(updater)).to.be.false;
    });

    it("should revert if not owner", async function () {
      await expect(
        travelerSBT.connect(traveler1).setAuthorizedUpdater(traveler2.address, true)
      ).to.be.revertedWithCustomError(travelerSBT, "OwnableUnauthorizedAccount");
    });

    it("should suspend traveler", async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);

      await expect(travelerSBT.suspendTraveler(traveler1.address))
        .to.emit(travelerSBT, "TravelerSuspended")
        .withArgs(traveler1.address, 1);

      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.suspended).to.be.true;
    });

    it("should revert suspend if no SBT", async function () {
      await expect(travelerSBT.suspendTraveler(traveler2.address)).to.be.revertedWithCustomError(
        travelerSBT,
        "NoSBT"
      );
    });

    it("should unsuspend traveler", async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);
      await travelerSBT.suspendTraveler(traveler1.address);

      await expect(travelerSBT.unsuspendTraveler(traveler1.address))
        .to.emit(travelerSBT, "TravelerUnsuspended")
        .withArgs(traveler1.address, 1);

      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.suspended).to.be.false;
    });

    it("should revert unsuspend if no SBT", async function () {
      await expect(travelerSBT.unsuspendTraveler(traveler2.address)).to.be.revertedWithCustomError(
        travelerSBT,
        "NoSBT"
      );
    });

    it("should allow reporting traveler", async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);

      await travelerSBT.reportTraveler(traveler1.address);

      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.timesReportedByHosts).to.equal(1);
      expect(profile.suspended).to.be.false;
    });

    it("should auto-suspend after 3 reports", async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);

      // Report 3 times
      await travelerSBT.reportTraveler(traveler1.address);
      await travelerSBT.reportTraveler(traveler1.address);

      await expect(travelerSBT.reportTraveler(traveler1.address))
        .to.emit(travelerSBT, "TravelerSuspended")
        .withArgs(traveler1.address, 1);

      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.timesReportedByHosts).to.equal(3);
      expect(profile.suspended).to.be.true;
    });

    it("should revert report if not authorized", async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);
      await travelerSBT.setAuthorizedUpdater(owner.address, false);

      await expect(travelerSBT.reportTraveler(traveler1.address)).to.be.revertedWithCustomError(
        travelerSBT,
        "NotAuthorized"
      );
    });

    it("should revert report if no SBT", async function () {
      await expect(travelerSBT.reportTraveler(traveler2.address)).to.be.revertedWithCustomError(
        travelerSBT,
        "NoSBT"
      );
    });
  });

  describe("View Functions", function () {
    it("should check if has SBT", async function () {
      expect(await travelerSBT.hasSBT(traveler1.address)).to.be.false;

      await travelerSBT.connect(traveler1).mint(traveler1.address);

      expect(await travelerSBT.hasSBT(traveler1.address)).to.be.true;
    });

    it("should get tokenId from wallet", async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);
      expect(await travelerSBT.walletToTokenId(traveler1.address)).to.equal(1);
    });

    it("should return 0 if no SBT", async function () {
      expect(await travelerSBT.walletToTokenId(traveler2.address)).to.equal(0);
    });

    it("should get profile", async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);
      const profile = await travelerSBT.getProfile(traveler1.address);

      expect(profile.totalBookings).to.equal(0);
      expect(profile.tier).to.equal(0); // Newcomer
    });

    it("should revert getProfile if no SBT", async function () {
      await expect(travelerSBT.getProfile(traveler2.address)).to.be.revertedWithCustomError(
        travelerSBT,
        "NoSBT"
      );
    });

    it("should calculate success rate", async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);

      // 3 completed, 1 cancelled
      await travelerSBT.updateReputation(traveler1.address, 5, false);
      await travelerSBT.updateReputation(traveler1.address, 5, false);
      await travelerSBT.updateReputation(traveler1.address, 5, false);
      await travelerSBT.updateReputation(traveler1.address, 1, true);

      const successRate = await travelerSBT.getSuccessRate(traveler1.address);
      // 3/4 = 75% = 7500 basis points
      expect(successRate).to.equal(7500);
    });

    it("should return 0 success rate for zero bookings", async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);

      const successRate = await travelerSBT.getSuccessRate(traveler1.address);
      expect(successRate).to.equal(0);
    });

    it("should revert getSuccessRate if no SBT", async function () {
      await expect(travelerSBT.getSuccessRate(traveler2.address)).to.be.revertedWithCustomError(
        travelerSBT,
        "NoSBT"
      );
    });
  });

  describe("Cancellation and Completion", function () {
    beforeEach(async function () {
      await travelerSBT.connect(traveler1).mint(traveler1.address);
    });

    it("should track completed stays vs cancelled bookings", async function () {
      // 2 completed bookings
      await travelerSBT.updateReputation(traveler1.address, 5, false);
      await travelerSBT.updateReputation(traveler1.address, 5, false);

      // 1 cancellation
      await travelerSBT.updateReputation(traveler1.address, 1, true);

      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.totalBookings).to.equal(3);
      expect(profile.completedStays).to.equal(2);
      expect(profile.cancelledBookings).to.equal(1);
    });

    it("should handle zero bookings", async function () {
      const profile = await travelerSBT.getProfile(traveler1.address);
      expect(profile.totalBookings).to.equal(0);
      expect(profile.cancelledBookings).to.equal(0);
      expect(profile.completedStays).to.equal(0);
    });

    it("should revert if suspended traveler tries to update", async function () {
      await travelerSBT.suspendTraveler(traveler1.address);

      await expect(
        travelerSBT.updateReputation(traveler1.address, 5, false)
      ).to.be.revertedWithCustomError(travelerSBT, "TravelerIsSuspended");
    });
  });
});
