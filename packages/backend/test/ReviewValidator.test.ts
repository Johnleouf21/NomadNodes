import { expect } from "chai";
import { network } from "hardhat";
import type {
  ReviewValidator,
  ReviewRegistry,
  PropertyNFT,
  HostSBT,
} from "../types/ethers-contracts";

const { ethers } = await network.connect();

describe("ReviewValidator", function () {
  let reviewValidator: ReviewValidator;
  let reviewRegistry: ReviewRegistry;
  let propertyNFT: PropertyNFT;
  let hostSBT: HostSBT;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let moderator: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let traveler: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let host: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  beforeEach(async function () {
    [owner, moderator, traveler, host] = await ethers.getSigners();

    // Deploy HostSBT
    const HostSBTFactory = await ethers.getContractFactory("HostSBT");
    hostSBT = (await HostSBTFactory.deploy()) as unknown as HostSBT;

    // Deploy PropertyNFT
    const PropertyNFTFactory = await ethers.getContractFactory("PropertyNFT");
    propertyNFT = (await PropertyNFTFactory.deploy(
      await hostSBT.getAddress(),
      owner.address
    )) as unknown as PropertyNFT;

    await hostSBT.setAuthorizedUpdater(await propertyNFT.getAddress(), true);

    // Deploy ReviewRegistry
    const ReviewRegistryFactory = await ethers.getContractFactory("ReviewRegistry");
    reviewRegistry = (await ReviewRegistryFactory.deploy(
      owner.address, // TravelerSBT placeholder
      await hostSBT.getAddress(),
      await propertyNFT.getAddress()
    )) as unknown as ReviewRegistry;

    // Authorize ReviewRegistry to update HostSBT and PropertyNFT
    await hostSBT.setAuthorizedUpdater(await reviewRegistry.getAddress(), true);
    await propertyNFT.setReviewRegistry(await reviewRegistry.getAddress());

    // Deploy ReviewValidator
    const ReviewValidatorFactory = await ethers.getContractFactory("ReviewValidator");
    reviewValidator = (await ReviewValidatorFactory.deploy(
      await propertyNFT.getAddress(),
      await reviewRegistry.getAddress()
    )) as unknown as ReviewValidator;

    // Set ReviewValidator in ReviewRegistry
    await reviewRegistry.setReviewValidator(await reviewValidator.getAddress());

    // Add moderator
    await reviewValidator.setModerator(moderator.address, true);
  });

  describe("Deployment", function () {
    it("should deploy with correct addresses", async function () {
      expect(await reviewValidator.propertyNFT()).to.equal(await propertyNFT.getAddress());
      expect(await reviewValidator.reviewRegistry()).to.equal(await reviewRegistry.getAddress());
    });

    it("should set deployer as moderator", async function () {
      expect(await reviewValidator.moderators(owner.address)).to.be.true;
    });
  });

  describe("Submit Review", function () {
    const propertyId = 1;
    const bookingIndex = 0;
    const escrowId = 1;
    const rating = 5;
    const ipfsHash = "ipfs://QmReview123";

    it("should submit review as traveler", async function () {
      await expect(
        reviewValidator
          .connect(traveler)
          .submitReview(escrowId, propertyId, bookingIndex, host.address, rating, ipfsHash, true)
      )
        .to.emit(reviewValidator, "ReviewSubmitted")
        .withArgs(0, escrowId, traveler.address, host.address, rating);

      const review = await reviewValidator.pendingReviews(0);
      expect(review.reviewer).to.equal(traveler.address);
      expect(review.reviewee).to.equal(host.address);
      expect(review.rating).to.equal(rating);
      expect(review.status).to.equal(0); // Pending
    });

    it("should submit review as host", async function () {
      await reviewValidator
        .connect(host)
        .submitReview(
          propertyId,
          bookingIndex,
          escrowId,
          traveler.address,
          rating,
          ipfsHash,
          false
        );

      const review = await reviewValidator.pendingReviews(1);
      expect(review.travelerToHost).to.be.false;
    });

    it("should revert if escrow already reviewed", async function () {
      await reviewValidator
        .connect(traveler)
        .submitReview(propertyId, bookingIndex, escrowId, host.address, rating, ipfsHash, true);

      await expect(
        reviewValidator
          .connect(traveler)
          .submitReview(escrowId, propertyId, bookingIndex, host.address, rating, ipfsHash, true)
      ).to.be.revertedWithCustomError(reviewValidator, "AlreadyReviewed");
    });

    it("should revert if invalid rating", async function () {
      await expect(
        reviewValidator
          .connect(traveler)
          .submitReview(escrowId, propertyId, bookingIndex, host.address, 0, ipfsHash, true)
      ).to.be.revertedWithCustomError(reviewValidator, "InvalidRating");

      await expect(
        reviewValidator
          .connect(traveler)
          .submitReview(escrowId, propertyId, bookingIndex, host.address, 6, ipfsHash, true)
      ).to.be.revertedWithCustomError(reviewValidator, "InvalidRating");
    });
  });

  describe("Moderator Actions", function () {
    let reviewId: number;

    beforeEach(async function () {
      await reviewValidator
        .connect(traveler)
        .submitReview(1, 1, 0, host.address, 5, "ipfs://", true);
      reviewId = 0;
    });

    it("should approve review", async function () {
      await expect(reviewValidator.connect(moderator).approveReview(reviewId))
        .to.emit(reviewValidator, "ReviewApproved")
        .withArgs(reviewId, moderator.address);

      const review = await reviewValidator.pendingReviews(reviewId);
      expect(review.status).to.equal(1); // Approved
    });

    it("should reject review", async function () {
      await expect(reviewValidator.connect(moderator).rejectReview(reviewId, "Spam"))
        .to.emit(reviewValidator, "ReviewRejected")
        .withArgs(reviewId, moderator.address, "Spam");

      const review = await reviewValidator.pendingReviews(reviewId);
      expect(review.status).to.equal(2); // Rejected
    });

    it("should revert if not moderator", async function () {
      await expect(
        reviewValidator.connect(traveler).approveReview(reviewId)
      ).to.be.revertedWithCustomError(reviewValidator, "NotModerator");
    });

    it("should revert reject if not moderator", async function () {
      await expect(
        reviewValidator.connect(traveler).rejectReview(reviewId, "Spam")
      ).to.be.revertedWithCustomError(reviewValidator, "NotModerator");
    });

    it("should revert reject if already processed", async function () {
      await reviewValidator.connect(moderator).approveReview(reviewId);

      await expect(
        reviewValidator.connect(moderator).rejectReview(reviewId, "Spam")
      ).to.be.revertedWithCustomError(reviewValidator, "NotPending");
    });

    it("should revert if already processed", async function () {
      await reviewValidator.connect(moderator).approveReview(reviewId);

      await expect(
        reviewValidator.connect(moderator).approveReview(reviewId)
      ).to.be.revertedWithCustomError(reviewValidator, "NotPending");
    });
  });

  describe("Batch Operations", function () {
    beforeEach(async function () {
      // Submit 3 reviews with different escrowIds
      for (let i = 1; i <= 3; i++) {
        await reviewValidator
          .connect(traveler)
          .submitReview(i, 1, 0, host.address, 5, "ipfs://", true);
      }
    });

    it("should batch approve reviews", async function () {
      await reviewValidator.connect(moderator).batchApprove([0, 1, 2]);

      expect((await reviewValidator.pendingReviews(0)).status).to.equal(1);
      expect((await reviewValidator.pendingReviews(1)).status).to.equal(1);
      expect((await reviewValidator.pendingReviews(2)).status).to.equal(1);
    });

    it("should revert batch approve if not moderator", async function () {
      await expect(
        reviewValidator.connect(traveler).batchApprove([0, 1, 2])
      ).to.be.revertedWithCustomError(reviewValidator, "NotModerator");
    });
  });

  describe("Auto-Approve", function () {
    it("should enable auto-approve", async function () {
      await reviewValidator.setAutoApprove(true, 500);

      expect(await reviewValidator.autoApproveEnabled()).to.be.true;
      expect(await reviewValidator.autoApproveThreshold()).to.equal(500);
    });

    it("should disable auto-approve", async function () {
      await reviewValidator.setAutoApprove(true, 500);
      await reviewValidator.setAutoApprove(false, 0);

      expect(await reviewValidator.autoApproveEnabled()).to.be.false;
    });

    it("should auto-approve review when enabled", async function () {
      // Enable auto-approve
      await reviewValidator.setAutoApprove(true, 0);

      // Submit a review
      await reviewValidator
        .connect(traveler)
        .submitReview(1, 1, 0, host.address, 5, "ipfs://", true);

      // Should be auto-approved
      const review = await reviewValidator.pendingReviews(0);
      expect(review.status).to.equal(1); // Approved
      expect(review.moderator).to.equal(await reviewValidator.getAddress()); // System approved
    });

    it("should revert if not owner", async function () {
      await expect(
        reviewValidator.connect(moderator).setAutoApprove(true, 500)
      ).to.be.revertedWithCustomError(reviewValidator, "OwnableUnauthorizedAccount");
    });
  });

  describe("Moderator Management", function () {
    it("should add moderator", async function () {
      const newMod = traveler.address;

      await expect(reviewValidator.setModerator(newMod, true))
        .to.emit(reviewValidator, "ModeratorSet")
        .withArgs(newMod, true);

      expect(await reviewValidator.moderators(newMod)).to.be.true;
    });

    it("should remove moderator", async function () {
      await reviewValidator.setModerator(moderator.address, false);

      expect(await reviewValidator.moderators(moderator.address)).to.be.false;
    });

    it("should revert if not owner", async function () {
      await expect(
        reviewValidator.connect(moderator).setModerator(traveler.address, true)
      ).to.be.revertedWithCustomError(reviewValidator, "OwnableUnauthorizedAccount");
    });

    it("should check if address is moderator", async function () {
      expect(await reviewValidator.isModerator(moderator.address)).to.be.true;
      expect(await reviewValidator.isModerator(traveler.address)).to.be.false;
    });
  });

  describe("Admin Functions", function () {
    it("should update PropertyNFT address", async function () {
      const newAddress = traveler.address;
      await reviewValidator.setPropertyNFT(newAddress);
      expect(await reviewValidator.propertyNFT()).to.equal(newAddress);
    });

    it("should update ReviewRegistry address", async function () {
      const newAddress = traveler.address;
      await reviewValidator.setReviewRegistry(newAddress);
      expect(await reviewValidator.reviewRegistry()).to.equal(newAddress);
    });

    it("should revert if not owner", async function () {
      await expect(
        reviewValidator.connect(moderator).setPropertyNFT(traveler.address)
      ).to.be.revertedWithCustomError(reviewValidator, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Submit multiple reviews with different escrowIds
      for (let i = 1; i <= 5; i++) {
        await reviewValidator
          .connect(traveler)
          .submitReview(i, 1, 0, host.address, 5, "ipfs://", true);
      }

      // Approve first 2
      await reviewValidator.connect(moderator).approveReview(0);
      await reviewValidator.connect(moderator).approveReview(1);

      // Reject 3rd
      await reviewValidator.connect(moderator).rejectReview(2, "Spam");
    });

    it("should get pending reviews", async function () {
      const pending = await reviewValidator.getPendingReviews(0, 10);
      // Reviews 4 and 5 are still pending
      expect(pending.length).to.equal(2);
    });

    it("should get review count", async function () {
      expect(await reviewValidator.reviewCounter()).to.equal(5);
    });
  });

  describe("Publish Review", function () {
    beforeEach(async function () {
      // Mint SBT for host
      await hostSBT.mint(host.address);

      // Submit and approve a review
      await reviewValidator
        .connect(traveler)
        .submitReview(1, 1, 0, host.address, 5, "ipfs://test", true);
      await reviewValidator.connect(moderator).approveReview(0);
    });

    it("should publish approved review as reviewer", async function () {
      await expect(reviewValidator.connect(traveler).publishReview(0))
        .to.emit(reviewValidator, "ReviewPublished")
        .withArgs(0, 1);

      const review = await reviewValidator.pendingReviews(0);
      expect(review.status).to.equal(3); // Published
    });

    it("should publish approved review as moderator", async function () {
      await reviewValidator.connect(moderator).publishReview(0);

      const review = await reviewValidator.pendingReviews(0);
      expect(review.status).to.equal(3); // Published
    });

    it("should revert if not approved", async function () {
      // Submit another review that's not approved
      await reviewValidator
        .connect(traveler)
        .submitReview(2, 1, 1, host.address, 4, "ipfs://", true);

      await expect(
        reviewValidator.connect(traveler).publishReview(1)
      ).to.be.revertedWithCustomError(reviewValidator, "NotApproved");
    });

    it("should revert if not reviewer or moderator", async function () {
      await expect(reviewValidator.connect(host).publishReview(0)).to.be.revertedWithCustomError(
        reviewValidator,
        "NotModerator"
      );
    });
  });

  describe("Batch Publish", function () {
    beforeEach(async function () {
      // Mint SBT for host
      await hostSBT.mint(host.address);

      // Submit and approve 3 reviews
      for (let i = 1; i <= 3; i++) {
        await reviewValidator
          .connect(traveler)
          .submitReview(i, 1, 0, host.address, 5, "ipfs://", true);
        await reviewValidator.connect(moderator).approveReview(i - 1);
      }
    });

    it("should batch publish approved reviews", async function () {
      await reviewValidator.connect(moderator).batchPublish([0, 1, 2]);

      expect((await reviewValidator.pendingReviews(0)).status).to.equal(3);
      expect((await reviewValidator.pendingReviews(1)).status).to.equal(3);
      expect((await reviewValidator.pendingReviews(2)).status).to.equal(3);
    });

    it("should skip non-approved reviews in batch", async function () {
      // Submit a 4th review and leave it pending (not approved)
      await reviewValidator
        .connect(traveler)
        .submitReview(4, 1, 0, host.address, 5, "ipfs://", true);

      // Try to batch publish including pending review
      await reviewValidator.connect(moderator).batchPublish([0, 1, 2, 3]);

      expect((await reviewValidator.pendingReviews(0)).status).to.equal(3); // Published
      expect((await reviewValidator.pendingReviews(1)).status).to.equal(3); // Published
      expect((await reviewValidator.pendingReviews(2)).status).to.equal(3); // Published
      expect((await reviewValidator.pendingReviews(3)).status).to.equal(0); // Still Pending
    });
  });

  describe("Edge Cases", function () {
    it("should revert for non-pending review", async function () {
      // Approve a review first
      await reviewValidator
        .connect(traveler)
        .submitReview(1, 1, 0, host.address, 5, "ipfs://", true);
      await reviewValidator.connect(moderator).approveReview(0);

      // Try to approve again
      await expect(
        reviewValidator.connect(moderator).approveReview(0)
      ).to.be.revertedWithCustomError(reviewValidator, "NotPending");
    });

    it("should handle empty batch arrays", async function () {
      await reviewValidator.connect(moderator).batchApprove([]);
      // Should not revert
    });
  });

  describe("Additional Coverage Tests", function () {
    it("should get pending count", async function () {
      // Submit 3 reviews
      for (let i = 1; i <= 3; i++) {
        await reviewValidator
          .connect(traveler)
          .submitReview(i, 1, 0, host.address, 5, "ipfs://", true);
      }

      expect(await reviewValidator.getPendingCount()).to.equal(3);

      // Approve one
      await reviewValidator.connect(moderator).approveReview(0);
      expect(await reviewValidator.getPendingCount()).to.equal(2);
    });

    it("should get single review details", async function () {
      await reviewValidator
        .connect(traveler)
        .submitReview(1, 1, 0, host.address, 5, "ipfs://test123", true);

      const review = await reviewValidator.getReview(0);
      expect(review.reviewId).to.equal(0);
      expect(review.escrowId).to.equal(1);
      expect(review.rating).to.equal(5);
      expect(review.reviewer).to.equal(traveler.address);
    });

    it("should paginate pending reviews with offset", async function () {
      // Submit 10 reviews
      for (let i = 1; i <= 10; i++) {
        await reviewValidator
          .connect(traveler)
          .submitReview(i, 1, 0, host.address, 5, "ipfs://", true);
      }

      // Get first 3
      const page1 = await reviewValidator.getPendingReviews(0, 3);
      expect(page1.length).to.equal(3);

      // Get next 3 (offset 3)
      const page2 = await reviewValidator.getPendingReviews(3, 3);
      expect(page2.length).to.equal(3);

      // Get with offset beyond total
      const page3 = await reviewValidator.getPendingReviews(15, 5);
      expect(page3.length).to.equal(0);
    });
  });
});
