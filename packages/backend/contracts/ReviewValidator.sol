// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPropertyNFT.sol";
import "./interfaces/IReviewRegistry.sol";

/**
 * @title ReviewValidator
 * @notice Validates and moderates reviews before they are published on-chain
 * @dev Reviews go through: Submit → Moderation → Approval → Publication
 */
contract ReviewValidator is Ownable {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct PendingReview {
        uint256 reviewId;
        uint256 escrowId;
        uint256 propertyId;
        uint256 bookingIndex;
        address reviewer;
        address reviewee;
        uint8 rating; // 1-5
        string ipfsCommentHash; // IPFS hash of detailed comment
        uint256 submittedAt;
        ReviewStatus status;
        string moderationNote; // Reason if rejected
        address moderator; // Who moderated it
        bool travelerToHost; // true = traveler reviews host, false = host reviews traveler
    }

    enum ReviewStatus {
        Pending, // Waiting for moderation
        Approved, // Approved, ready to publish
        Rejected, // Rejected by moderator
        Published // Already published on-chain
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    mapping(uint256 => PendingReview) public pendingReviews;
    mapping(uint256 => bool) public escrowAlreadyReviewed; // DEPRECATED: kept for storage compatibility
    mapping(address => bool) public moderators;

    // New mapping: escrowId => travelerToHost => reviewed
    // This allows both traveler and host to leave reviews for the same escrow
    mapping(uint256 => mapping(bool => bool)) public escrowReviewedByDirection;

    uint256 public reviewCounter;

    IPropertyNFT public propertyNFT;
    IReviewRegistry public reviewRegistry;

    // Auto-approve settings
    bool public autoApproveEnabled;
    uint256 public autoApproveThreshold; // Minimum reviewer reputation

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event ReviewSubmitted(
        uint256 indexed reviewId,
        uint256 indexed escrowId,
        address indexed reviewer,
        address reviewee,
        uint8 rating
    );
    event ReviewApproved(uint256 indexed reviewId, address indexed moderator);
    event ReviewRejected(uint256 indexed reviewId, address indexed moderator, string reason);
    event ReviewPublished(uint256 indexed reviewId, uint256 indexed escrowId);
    event ModeratorSet(address indexed moderator, bool status);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error EscrowNotCompleted();
    error NotBuyer();
    error AlreadyReviewed();
    error InvalidRating();
    error NotModerator();
    error NotPending();
    error NotApproved();
    error AlreadyPublished();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _propertyNFT, address _reviewRegistry) Ownable(msg.sender) {
        propertyNFT = IPropertyNFT(_propertyNFT);
        reviewRegistry = IReviewRegistry(_reviewRegistry);
        moderators[msg.sender] = true;
        autoApproveEnabled = false;
    }

    /*//////////////////////////////////////////////////////////////
                        REVIEW SUBMISSION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Submit a review after a completed booking
     * @param escrowId ID of the completed escrow
     * @param propertyId ID of the property
     * @param bookingIndex Index of the booking
     * @param reviewee Address being reviewed (host or traveler)
     * @param rating Rating 1-5
     * @param ipfsCommentHash IPFS hash of the detailed comment
     * @param travelerToHost true if traveler is reviewing host
     */
    function submitReview(
        uint256 escrowId,
        uint256 propertyId,
        uint256 bookingIndex,
        address reviewee,
        uint8 rating,
        string memory ipfsCommentHash,
        bool travelerToHost
    ) external returns (uint256) {
        // Validate rating
        if (rating < 1 || rating > 5) revert InvalidRating();

        // Check if escrow is completed
        // Note: This would require escrowFactory integration
        // For now, we'll check via PropertyRWA booking status

        // Check not already reviewed for this direction
        // (allows both host and traveler to review the same escrow)
        if (escrowReviewedByDirection[escrowId][travelerToHost]) revert AlreadyReviewed();

        // Verify caller is the buyer/traveler
        // (In production, verify through escrow contract)

        uint256 reviewId = reviewCounter++;

        pendingReviews[reviewId] = PendingReview({
            reviewId: reviewId,
            escrowId: escrowId,
            propertyId: propertyId,
            bookingIndex: bookingIndex,
            reviewer: msg.sender,
            reviewee: reviewee,
            rating: rating,
            ipfsCommentHash: ipfsCommentHash,
            submittedAt: block.timestamp,
            status: ReviewStatus.Pending,
            moderationNote: "",
            moderator: address(0),
            travelerToHost: travelerToHost
        });

        // Mark this direction as reviewed (allows the other party to still review)
        escrowReviewedByDirection[escrowId][travelerToHost] = true;

        emit ReviewSubmitted(reviewId, escrowId, msg.sender, reviewee, rating);

        // Auto-approve if enabled and conditions met
        if (autoApproveEnabled) {
            _autoApprove(reviewId);
        }

        return reviewId;
    }

    /*//////////////////////////////////////////////////////////////
                        MODERATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Approve a pending review
     * @param reviewId ID of the review to approve
     */
    function approveReview(uint256 reviewId) external {
        if (!moderators[msg.sender]) revert NotModerator();

        PendingReview storage review = pendingReviews[reviewId];
        if (review.status != ReviewStatus.Pending) revert NotPending();

        review.status = ReviewStatus.Approved;
        review.moderator = msg.sender;

        emit ReviewApproved(reviewId, msg.sender);
    }

    /**
     * @notice Reject a pending review
     * @param reviewId ID of the review to reject
     * @param reason Reason for rejection
     */
    function rejectReview(uint256 reviewId, string memory reason) external {
        if (!moderators[msg.sender]) revert NotModerator();

        PendingReview storage review = pendingReviews[reviewId];
        if (review.status != ReviewStatus.Pending) revert NotPending();

        review.status = ReviewStatus.Rejected;
        review.moderationNote = reason;
        review.moderator = msg.sender;

        // Release escrow review lock (allow resubmission)
        escrowReviewedByDirection[review.escrowId][review.travelerToHost] = false;

        emit ReviewRejected(reviewId, msg.sender, reason);
    }

    /**
     * @notice Batch approve multiple reviews
     * @param reviewIds Array of review IDs to approve
     */
    function batchApprove(uint256[] memory reviewIds) external {
        if (!moderators[msg.sender]) revert NotModerator();

        for (uint256 i = 0; i < reviewIds.length; i++) {
            uint256 reviewId = reviewIds[i];
            PendingReview storage review = pendingReviews[reviewId];

            if (review.status == ReviewStatus.Pending) {
                review.status = ReviewStatus.Approved;
                review.moderator = msg.sender;
                emit ReviewApproved(reviewId, msg.sender);
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                        PUBLICATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Publish an approved review to the registry
     * @param reviewId ID of the review to publish
     */
    function publishReview(uint256 reviewId) external {
        PendingReview storage review = pendingReviews[reviewId];

        // Must be approved
        if (review.status != ReviewStatus.Approved) revert NotApproved();

        // Only reviewer or moderator can publish
        if (msg.sender != review.reviewer && !moderators[msg.sender]) {
            revert NotModerator();
        }

        // Publish to registry
        reviewRegistry.publishReview(
            reviewId,
            review.escrowId,
            review.reviewer,
            review.reviewee,
            review.propertyId,
            review.rating,
            review.ipfsCommentHash,
            review.travelerToHost
        );

        review.status = ReviewStatus.Published;

        emit ReviewPublished(reviewId, review.escrowId);
    }

    /**
     * @notice Batch publish multiple approved reviews
     * @param reviewIds Array of review IDs to publish
     */
    function batchPublish(uint256[] memory reviewIds) external {
        for (uint256 i = 0; i < reviewIds.length; i++) {
            uint256 reviewId = reviewIds[i];
            PendingReview storage review = pendingReviews[reviewId];

            if (review.status == ReviewStatus.Approved) {
                reviewRegistry.publishReview(
                    reviewId,
                    review.escrowId,
                    review.reviewer,
                    review.reviewee,
                    review.propertyId,
                    review.rating,
                    review.ipfsCommentHash,
                    review.travelerToHost
                );

                review.status = ReviewStatus.Published;
                emit ReviewPublished(reviewId, review.escrowId);
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                        AUTO-APPROVAL
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Auto-approve logic (can be enhanced with reputation checks)
     */
    function _autoApprove(uint256 reviewId) internal {
        PendingReview storage review = pendingReviews[reviewId];

        // Simple auto-approve: approve all for now
        // In production, check reviewer reputation from TravelerSBT/HostSBT
        review.status = ReviewStatus.Approved;
        review.moderator = address(this); // System auto-approved

        emit ReviewApproved(reviewId, address(this));
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set moderator status
     * @param moderator Address of the moderator
     * @param status true = is moderator, false = not moderator
     */
    function setModerator(address moderator, bool status) external onlyOwner {
        moderators[moderator] = status;
        emit ModeratorSet(moderator, status);
    }

    /**
     * @notice Set auto-approve settings
     * @param enabled Whether auto-approve is enabled
     * @param threshold Minimum reputation threshold
     */
    function setAutoApprove(bool enabled, uint256 threshold) external onlyOwner {
        autoApproveEnabled = enabled;
        autoApproveThreshold = threshold;
    }

    /**
     * @notice Set PropertyNFT contract
     */
    function setPropertyNFT(address _propertyNFT) external onlyOwner {
        propertyNFT = IPropertyNFT(_propertyNFT);
    }

    /**
     * @notice Set ReviewRegistry contract
     */
    function setReviewRegistry(address _reviewRegistry) external onlyOwner {
        reviewRegistry = IReviewRegistry(_reviewRegistry);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get review details
     */
    function getReview(uint256 reviewId) external view returns (PendingReview memory) {
        return pendingReviews[reviewId];
    }

    /**
     * @notice Get pending reviews (for moderation queue)
     */
    function getPendingReviews(uint256 offset, uint256 limit) external view returns (PendingReview[] memory) {
        uint256 total = 0;

        // Count pending reviews
        for (uint256 i = 0; i < reviewCounter; i++) {
            if (pendingReviews[i].status == ReviewStatus.Pending) {
                total++;
            }
        }

        // Calculate actual limit
        uint256 count = total > offset ? total - offset : 0;
        if (count > limit) count = limit;

        PendingReview[] memory result = new PendingReview[](count);
        uint256 index = 0;
        uint256 skipped = 0;

        for (uint256 i = 0; i < reviewCounter && index < count; i++) {
            if (pendingReviews[i].status == ReviewStatus.Pending) {
                if (skipped >= offset) {
                    result[index] = pendingReviews[i];
                    index++;
                } else {
                    skipped++;
                }
            }
        }

        return result;
    }

    /**
     * @notice Check if moderator
     */
    function isModerator(address account) external view returns (bool) {
        return moderators[account];
    }

    /**
     * @notice Get total pending reviews count
     */
    function getPendingCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < reviewCounter; i++) {
            if (pendingReviews[i].status == ReviewStatus.Pending) {
                count++;
            }
        }
        return count;
    }

    /**
     * @notice Check if escrow has been reviewed for a specific direction
     * @param escrowId The escrow ID
     * @param travelerToHost true to check if traveler reviewed, false to check if host reviewed
     */
    function hasReviewed(uint256 escrowId, bool travelerToHost) external view returns (bool) {
        return escrowReviewedByDirection[escrowId][travelerToHost];
    }
}
