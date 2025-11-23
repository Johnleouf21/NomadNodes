import { expect } from "chai";
import { network } from "hardhat";
import type { ReviewRegistry, TravelerSBT, HostSBT, PropertyNFT } from "../types/ethers-contracts";

const { ethers } = await network.connect();

describe("ReviewRegistry", function () {
  let reviewRegistry: ReviewRegistry;
  let travelerSBT: TravelerSBT;
  let hostSBT: HostSBT;
  let propertyNFT: PropertyNFT;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let moderator: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let traveler: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let host: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let voter1: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let voter2: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  beforeEach(async function () {
    [owner, moderator, traveler, host, voter1, voter2] = await ethers.getSigners();

    // Deploy TravelerSBT
    const TravelerSBTFactory = await ethers.getContractFactory("TravelerSBT");
    travelerSBT = (await TravelerSBTFactory.deploy()) as unknown as TravelerSBT;

    // Deploy HostSBT
    const HostSBTFactory = await ethers.getContractFactory("HostSBT");
    hostSBT = (await HostSBTFactory.deploy()) as unknown as HostSBT;

    // Deploy PropertyNFT
    const PropertyNFTFactory = await ethers.getContractFactory("PropertyNFT");
    propertyNFT = (await PropertyNFTFactory.deploy(
      await hostSBT.getAddress(),
      owner.address
    )) as unknown as PropertyNFT;

    // Authorize PropertyNFT to update HostSBT
    await hostSBT.setAuthorizedUpdater(await propertyNFT.getAddress(), true);

    // Deploy ReviewRegistry
    const ReviewRegistryFactory = await ethers.getContractFactory("ReviewRegistry");
    reviewRegistry = (await ReviewRegistryFactory.deploy(
      await travelerSBT.getAddress(),
      await hostSBT.getAddress(),
      await propertyNFT.getAddress()
    )) as unknown as ReviewRegistry;

    // Authorize ReviewRegistry to update SBTs and PropertyNFT
    await travelerSBT.setAuthorizedUpdater(await reviewRegistry.getAddress(), true);
    await hostSBT.setAuthorizedUpdater(await reviewRegistry.getAddress(), true);
    await propertyNFT.setReviewRegistry(await reviewRegistry.getAddress());

    // Add moderator
    await reviewRegistry.setModerator(moderator.address, true);

    // Set ReviewValidator (owner acts as validator for tests)
    await reviewRegistry.setReviewValidator(owner.address);
  });

  describe("Deployment", function () {
    it("should deploy with correct addresses", async function () {
      expect(await reviewRegistry.travelerSBT()).to.equal(await travelerSBT.getAddress());
      expect(await reviewRegistry.hostSBT()).to.equal(await hostSBT.getAddress());
      expect(await reviewRegistry.propertyNFT()).to.equal(await propertyNFT.getAddress());
    });

    it("should set deployer as moderator", async function () {
      expect(await reviewRegistry.moderators(owner.address)).to.be.true;
    });
  });

  describe("Publish Review", function () {
    const reviewId = 1;
    const escrowId = 1;
    const propertyId = 1;
    const rating = 5;
    const ipfsHash = "ipfs://QmReview123";

    beforeEach(async function () {
      // Mint SBTs for traveler and host
      await travelerSBT.mint(traveler.address);
      await hostSBT.mint(host.address);
    });

    it("should publish review from traveler to host", async function () {
      await expect(
        reviewRegistry.publishReview(
          reviewId,
          escrowId,
          traveler.address,
          host.address,
          propertyId,
          rating,
          ipfsHash,
          true
        )
      )
        .to.emit(reviewRegistry, "ReviewPublished")
        .withArgs(reviewId, propertyId, traveler.address, host.address, rating);

      const review = await reviewRegistry.reviews(reviewId);
      expect(review.reviewer).to.equal(traveler.address);
      expect(review.reviewee).to.equal(host.address);
      expect(review.rating).to.equal(rating);
      expect(review.travelerToHost).to.be.true;
      expect(review.flagged).to.be.false;
    });

    it("should publish review from host to traveler", async function () {
      await reviewRegistry.publishReview(
        reviewId,
        escrowId,
        host.address,
        traveler.address,
        propertyId,
        rating,
        ipfsHash,
        false
      );

      const review = await reviewRegistry.reviews(reviewId);
      expect(review.travelerToHost).to.be.false;
    });

    it("should increment total reviews", async function () {
      await reviewRegistry.publishReview(
        reviewId,
        escrowId,
        traveler.address,
        host.address,
        propertyId,
        rating,
        ipfsHash,
        true
      );

      expect(await reviewRegistry.totalReviews()).to.equal(1);
    });

    it("should revert if not called by ReviewValidator", async function () {
      await reviewRegistry.setReviewValidator(moderator.address);

      await expect(
        reviewRegistry.publishReview(
          reviewId,
          escrowId,
          traveler.address,
          host.address,
          propertyId,
          rating,
          ipfsHash,
          true
        )
      ).to.be.revertedWithCustomError(reviewRegistry, "NotAuthorized");
    });

    it("should revert if invalid rating", async function () {
      await expect(
        reviewRegistry.publishReview(
          reviewId,
          escrowId,
          traveler.address,
          host.address,
          propertyId,
          0,
          ipfsHash,
          true
        )
      ).to.be.revertedWithCustomError(hostSBT, "InvalidRating");

      await expect(
        reviewRegistry.publishReview(
          reviewId,
          escrowId,
          traveler.address,
          host.address,
          propertyId,
          6,
          ipfsHash,
          true
        )
      ).to.be.revertedWithCustomError(hostSBT, "InvalidRating");
    });
  });

  describe("Voting System", function () {
    const reviewId = 1;

    beforeEach(async function () {
      // Mint SBTs
      await travelerSBT.mint(traveler.address);
      await hostSBT.mint(host.address);

      await reviewRegistry.publishReview(
        reviewId,
        1,
        traveler.address,
        host.address,
        1,
        5,
        "ipfs://",
        true
      );
    });

    it("should vote helpful", async function () {
      await expect(reviewRegistry.connect(voter1).voteOnReview(reviewId, true))
        .to.emit(reviewRegistry, "ReviewVoted")
        .withArgs(reviewId, voter1.address, true);

      const review = await reviewRegistry.reviews(reviewId);
      expect(review.helpfulCount).to.equal(1);
      expect(review.unhelpfulCount).to.equal(0);
    });

    it("should vote unhelpful", async function () {
      await reviewRegistry.connect(voter1).voteOnReview(reviewId, false);

      const review = await reviewRegistry.reviews(reviewId);
      expect(review.helpfulCount).to.equal(0);
      expect(review.unhelpfulCount).to.equal(1);
    });

    it("should revert if already voted", async function () {
      await reviewRegistry.connect(voter1).voteOnReview(reviewId, true);

      await expect(
        reviewRegistry.connect(voter1).voteOnReview(reviewId, true)
      ).to.be.revertedWithCustomError(reviewRegistry, "AlreadyVoted");
    });

    it("should allow multiple voters", async function () {
      await reviewRegistry.connect(voter1).voteOnReview(reviewId, true);
      await reviewRegistry.connect(voter2).voteOnReview(reviewId, true);

      const review = await reviewRegistry.reviews(reviewId);
      expect(review.helpfulCount).to.equal(2);
    });
  });

  describe("Flagging System", function () {
    const reviewId = 1;

    beforeEach(async function () {
      // Mint SBTs
      await travelerSBT.mint(traveler.address);
      await hostSBT.mint(host.address);

      await reviewRegistry.publishReview(
        reviewId,
        1,
        traveler.address,
        host.address,
        1,
        5,
        "ipfs://",
        true
      );
    });

    it("should flag review for moderation", async function () {
      await expect(reviewRegistry.connect(moderator).flagReview(reviewId, "Spam content"))
        .to.emit(reviewRegistry, "ReviewFlagged")
        .withArgs(reviewId, "Spam content", moderator.address);

      const review = await reviewRegistry.reviews(reviewId);
      expect(review.flagged).to.be.true;
    });

    it("should revert if not moderator", async function () {
      await expect(
        reviewRegistry.connect(voter1).flagReview(reviewId, "Spam")
      ).to.be.revertedWithCustomError(reviewRegistry, "NotModerator");
    });

    it("should revert if already flagged", async function () {
      await reviewRegistry.connect(moderator).flagReview(reviewId, "Spam");

      await expect(
        reviewRegistry.connect(moderator).flagReview(reviewId, "Spam again")
      ).to.be.revertedWithCustomError(reviewRegistry, "AlreadyFlagged");
    });
  });

  describe("Moderator Actions", function () {
    const reviewId = 1;

    beforeEach(async function () {
      // Mint SBTs
      await travelerSBT.mint(traveler.address);
      await hostSBT.mint(host.address);

      await reviewRegistry.publishReview(
        reviewId,
        1,
        traveler.address,
        host.address,
        1,
        5,
        "ipfs://",
        true
      );
      await reviewRegistry.connect(moderator).flagReview(reviewId, "Spam");
    });

    it("should unflag review", async function () {
      await expect(reviewRegistry.connect(moderator).unflagReview(reviewId))
        .to.emit(reviewRegistry, "ReviewUnflagged")
        .withArgs(reviewId, moderator.address);

      const review = await reviewRegistry.reviews(reviewId);
      expect(review.flagged).to.be.false;
    });

    it("should revert if not moderator", async function () {
      await expect(
        reviewRegistry.connect(voter1).unflagReview(reviewId)
      ).to.be.revertedWithCustomError(reviewRegistry, "NotModerator");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Mint SBTs
      await travelerSBT.mint(traveler.address);
      await hostSBT.mint(host.address);

      // Publish multiple reviews
      for (let i = 1; i <= 5; i++) {
        await reviewRegistry.publishReview(
          i,
          i,
          traveler.address,
          host.address,
          1,
          5,
          "ipfs://",
          true
        );
      }
    });

    it("should get reviews by property", async function () {
      const reviews = await reviewRegistry.getPropertyReviews(1);
      expect(reviews.length).to.equal(5);
    });

    it("should get reviews by reviewee (user being reviewed)", async function () {
      const reviews = await reviewRegistry.getUserReviews(host.address);
      expect(reviews.length).to.equal(5);
    });

    it("should get flagged reviews", async function () {
      // Flag 2 reviews
      await reviewRegistry.connect(moderator).flagReview(1, "Spam");
      await reviewRegistry.connect(moderator).flagReview(2, "Fake");

      const flagged = await reviewRegistry.getFlaggedReviews(0, 10);
      expect(flagged.length).to.equal(2);
    });
  });

  describe("Moderator Management", function () {
    it("should add moderator", async function () {
      await expect(reviewRegistry.setModerator(voter1.address, true))
        .to.emit(reviewRegistry, "ModeratorSet")
        .withArgs(voter1.address, true);

      expect(await reviewRegistry.moderators(voter1.address)).to.be.true;
    });

    it("should remove moderator", async function () {
      await reviewRegistry.setModerator(moderator.address, false);
      expect(await reviewRegistry.moderators(moderator.address)).to.be.false;
    });

    it("should check if address is moderator", async function () {
      expect(await reviewRegistry.isModerator(moderator.address)).to.be.true;
      expect(await reviewRegistry.isModerator(voter1.address)).to.be.false;
    });

    it("should revert if not owner", async function () {
      await expect(
        reviewRegistry.connect(moderator).setModerator(voter1.address, true)
      ).to.be.revertedWithCustomError(reviewRegistry, "OwnableUnauthorizedAccount");
    });
  });

  describe("Admin Functions", function () {
    it("should update contract addresses", async function () {
      await reviewRegistry.setContracts(voter1.address, voter2.address, moderator.address);

      expect(await reviewRegistry.travelerSBT()).to.equal(voter1.address);
      expect(await reviewRegistry.hostSBT()).to.equal(voter2.address);
      expect(await reviewRegistry.propertyNFT()).to.equal(moderator.address);
    });

    it("should update ReviewValidator", async function () {
      await reviewRegistry.setReviewValidator(voter1.address);
      expect(await reviewRegistry.reviewValidator()).to.equal(voter1.address);
    });

    it("should revert if not owner", async function () {
      await expect(
        reviewRegistry.connect(moderator).setReviewValidator(voter1.address)
      ).to.be.revertedWithCustomError(reviewRegistry, "OwnableUnauthorizedAccount");
    });
  });

  describe("Edge Cases", function () {
    it("should allow voting on any review ID (no validation)", async function () {
      // The contract doesn't validate if review exists, so this succeeds
      await reviewRegistry.connect(voter1).voteOnReview(999, true);

      const review = await reviewRegistry.reviews(999);
      expect(review.helpfulCount).to.equal(1);
    });

    it("should handle empty query results", async function () {
      const reviews = await reviewRegistry.getPropertyReviews(999);
      expect(reviews.length).to.equal(0);
    });

    it("should handle zero total reviews", async function () {
      expect(await reviewRegistry.totalReviews()).to.equal(0);
    });

    it("should get review details", async function () {
      // Mint SBTs
      await travelerSBT.mint(traveler.address);
      await hostSBT.mint(host.address);

      await reviewRegistry.publishReview(
        1,
        1,
        traveler.address,
        host.address,
        1,
        5,
        "ipfs://test",
        true
      );

      const review = await reviewRegistry.reviews(1);
      expect(review.reviewId).to.equal(1);
      expect(review.escrowId).to.equal(1);
      expect(review.rating).to.equal(5);
      expect(review.ipfsCommentHash).to.equal("ipfs://test");
    });
  });

  describe("Review Statistics", function () {
    beforeEach(async function () {
      // Mint SBTs
      await travelerSBT.mint(traveler.address);
      await hostSBT.mint(host.address);

      // Publish reviews with different ratings
      await reviewRegistry.publishReview(
        1,
        1,
        traveler.address,
        host.address,
        1,
        5,
        "ipfs://",
        true
      );
      await reviewRegistry.publishReview(
        2,
        2,
        traveler.address,
        host.address,
        1,
        4,
        "ipfs://",
        true
      );
      await reviewRegistry.publishReview(
        3,
        3,
        traveler.address,
        host.address,
        1,
        3,
        "ipfs://",
        true
      );
    });

    it("should track total reviews", async function () {
      expect(await reviewRegistry.totalReviews()).to.equal(3);
    });

    it("should track helpful votes across reviews", async function () {
      await reviewRegistry.connect(voter1).voteOnReview(1, true);
      await reviewRegistry.connect(voter2).voteOnReview(1, true);
      await reviewRegistry.connect(voter1).voteOnReview(2, false);

      const review1 = await reviewRegistry.reviews(1);
      const review2 = await reviewRegistry.reviews(2);

      expect(review1.helpfulCount).to.equal(2);
      expect(review2.unhelpfulCount).to.equal(1);
    });
  });

  describe("Advanced Query Functions", function () {
    beforeEach(async function () {
      // Mint SBTs
      await travelerSBT.mint(traveler.address);
      await hostSBT.mint(host.address);

      // Publish multiple reviews
      for (let i = 1; i <= 5; i++) {
        await reviewRegistry.publishReview(
          i,
          i,
          traveler.address,
          host.address,
          1,
          i, // Different ratings 1-5
          "ipfs://",
          true
        );
      }
    });

    it("should get visible property reviews (excludes flagged)", async function () {
      // Flag one review
      await reviewRegistry.connect(moderator).flagReview(1, "Spam");

      const visibleReviews = await reviewRegistry.getVisiblePropertyReviews(1);
      expect(visibleReviews.length).to.equal(4); // 5 total - 1 flagged = 4 visible
    });

    it("should get property stats", async function () {
      const stats = await reviewRegistry.getPropertyStats(1);
      expect(stats.totalReviewsCount).to.equal(5);
      expect(stats.visibleReviewsCount).to.equal(5);
      // Average of 1,2,3,4,5 = 15/5 = 3 * 100 = 300
      expect(stats.averageRating).to.equal(300);
    });

    it("should get property stats excluding flagged reviews", async function () {
      // Flag the review with rating 1
      await reviewRegistry.connect(moderator).flagReview(1, "Spam");

      const stats = await reviewRegistry.getPropertyStats(1);
      expect(stats.totalReviewsCount).to.equal(5);
      expect(stats.visibleReviewsCount).to.equal(4);
      // Average of 2,3,4,5 = 14/4 = 3.5 * 100 = 350
      expect(stats.averageRating).to.equal(350);
    });

    it("should get single review details", async function () {
      const review = await reviewRegistry.getReview(1);
      expect(review.reviewId).to.equal(1);
      expect(review.rating).to.equal(1);
      expect(review.reviewer).to.equal(traveler.address);
      expect(review.reviewee).to.equal(host.address);
    });
  });

  describe("Batch Flag Function", function () {
    beforeEach(async function () {
      // Mint SBTs
      await travelerSBT.mint(traveler.address);
      await hostSBT.mint(host.address);

      // Publish multiple reviews
      for (let i = 1; i <= 5; i++) {
        await reviewRegistry.publishReview(
          i,
          i,
          traveler.address,
          host.address,
          1,
          5,
          "ipfs://",
          true
        );
      }
    });

    it("should batch flag multiple reviews", async function () {
      await reviewRegistry.connect(moderator).batchFlag([1, 2, 3], "Spam");

      const review1 = await reviewRegistry.reviews(1);
      const review2 = await reviewRegistry.reviews(2);
      const review3 = await reviewRegistry.reviews(3);

      expect(review1.flagged).to.be.true;
      expect(review2.flagged).to.be.true;
      expect(review3.flagged).to.be.true;
    });

    it("should skip already flagged reviews in batch", async function () {
      // Flag review 2 first
      await reviewRegistry.connect(moderator).flagReview(2, "Spam");

      // Batch flag including already flagged review
      await reviewRegistry.connect(moderator).batchFlag([1, 2, 3], "Fake");

      const review1 = await reviewRegistry.reviews(1);
      const review2 = await reviewRegistry.reviews(2);
      const review3 = await reviewRegistry.reviews(3);

      expect(review1.flagged).to.be.true;
      expect(review1.flagReason).to.equal("Fake");
      expect(review2.flagged).to.be.true;
      expect(review2.flagReason).to.equal("Spam"); // Should keep original reason
      expect(review3.flagged).to.be.true;
      expect(review3.flagReason).to.equal("Fake");
    });

    it("should revert batch flag if not moderator", async function () {
      await expect(
        reviewRegistry.connect(voter1).batchFlag([1, 2], "Spam")
      ).to.be.revertedWithCustomError(reviewRegistry, "NotModerator");
    });
  });

  describe("Flagged Reviews Pagination", function () {
    beforeEach(async function () {
      // Mint SBTs
      await travelerSBT.mint(traveler.address);
      await hostSBT.mint(host.address);

      // Publish 10 reviews
      for (let i = 1; i <= 10; i++) {
        await reviewRegistry.publishReview(
          i,
          i,
          traveler.address,
          host.address,
          1,
          5,
          "ipfs://",
          true
        );
      }

      // Flag reviews 1, 3, 5, 7, 9 (odd numbers)
      await reviewRegistry.connect(moderator).batchFlag([1, 3, 5, 7, 9], "Spam");
    });

    it("should paginate flagged reviews with offset and limit", async function () {
      // Get first 2 flagged reviews
      const page1 = await reviewRegistry.getFlaggedReviews(0, 2);
      expect(page1.length).to.equal(2);

      // Get next 2 flagged reviews (offset 2, limit 2)
      const page2 = await reviewRegistry.getFlaggedReviews(2, 2);
      expect(page2.length).to.equal(2);

      // Get last flagged review (offset 4, limit 2)
      const page3 = await reviewRegistry.getFlaggedReviews(4, 2);
      expect(page3.length).to.equal(1);
    });

    it("should handle large limit that exceeds flagged count", async function () {
      const flagged = await reviewRegistry.getFlaggedReviews(0, 100);
      expect(flagged.length).to.equal(5); // Only 5 flagged
    });

    it("should handle offset beyond flagged count", async function () {
      const flagged = await reviewRegistry.getFlaggedReviews(10, 5);
      expect(flagged.length).to.equal(0);
    });
  });

  describe("Unflag Review Edge Cases", function () {
    beforeEach(async function () {
      // Mint SBTs
      await travelerSBT.mint(traveler.address);
      await hostSBT.mint(host.address);

      await reviewRegistry.publishReview(
        1,
        1,
        traveler.address,
        host.address,
        1,
        5,
        "ipfs://",
        true
      );
    });

    it("should revert unflag if review not flagged", async function () {
      await expect(reviewRegistry.connect(moderator).unflagReview(1)).to.be.revertedWithCustomError(
        reviewRegistry,
        "NotFlagged"
      );
    });

    it("should successfully unflag a flagged review", async function () {
      // Flag first
      await reviewRegistry.connect(moderator).flagReview(1, "Spam");

      // Then unflag
      await expect(reviewRegistry.connect(moderator).unflagReview(1))
        .to.emit(reviewRegistry, "ReviewUnflagged")
        .withArgs(1, moderator.address);

      const review = await reviewRegistry.reviews(1);
      expect(review.flagged).to.be.false;
      expect(review.flagReason).to.equal("");
    });
  });
});
