// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ITravelerSBT.sol";
import "./interfaces/IHostSBT.sol";
import "./interfaces/IPropertyNFT.sol";

/**
 * @title ReviewRegistry
 * @notice On-chain registry of published reviews with moderation flags
 * @dev Reviews are immutable but can be flagged to hide from public view
 */
contract ReviewRegistry is Ownable {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Review {
        uint256 reviewId;
        uint256 escrowId;
        address reviewer;
        address reviewee;
        uint256 propertyId;
        // Immutable data
        uint8 rating; // 1-5 (IMMUTABLE once published)
        string ipfsCommentHash; // IPFS hash of comment
        uint256 timestamp;
        bool travelerToHost; // true = traveler reviews host
        // Moderation (can be changed post-publication)
        bool flagged;
        string flagReason; // "hate_speech", "spam", "fake", "harassment"
        uint256 flaggedAt;
        address flaggedBy;
        // Community interaction
        uint256 helpfulCount;
        uint256 unhelpfulCount;
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    mapping(uint256 => Review) public reviews;
    mapping(uint256 => uint256[]) public propertyReviews; // propertyId => reviewIds[]
    mapping(address => uint256[]) public userReviews; // reviewee => reviewIds[]
    mapping(uint256 => mapping(address => bool)) public hasVoted; // reviewId => voter => voted

    uint256 public totalReviews;

    ITravelerSBT public travelerSBT;
    IHostSBT public hostSBT;
    IPropertyNFT public propertyNFT;

    address public reviewValidator;
    mapping(address => bool) public moderators;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event ReviewPublished(
        uint256 indexed reviewId,
        uint256 indexed propertyId,
        address indexed reviewer,
        address reviewee,
        uint8 rating
    );
    event ReviewFlagged(uint256 indexed reviewId, string reason, address indexed flaggedBy);
    event ReviewUnflagged(uint256 indexed reviewId, address indexed unflaggedBy);
    event ReviewVoted(uint256 indexed reviewId, address indexed voter, bool helpful);
    event ModeratorSet(address indexed moderator, bool status);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error NotAuthorized();
    error AlreadyFlagged();
    error NotFlagged();
    error AlreadyVoted();
    error NotModerator();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _travelerSBT, address _hostSBT, address _propertyNFT) Ownable(msg.sender) {
        travelerSBT = ITravelerSBT(_travelerSBT);
        hostSBT = IHostSBT(_hostSBT);
        propertyNFT = IPropertyNFT(_propertyNFT);
        moderators[msg.sender] = true;
    }

    /*//////////////////////////////////////////////////////////////
                        REVIEW PUBLICATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Publish a review (called by ReviewValidator only)
     * @param reviewId Unique review ID
     * @param escrowId Associated escrow ID
     * @param reviewer Who wrote the review
     * @param reviewee Who is being reviewed
     * @param propertyId Property ID (if applicable)
     * @param rating Rating 1-5
     * @param ipfsCommentHash IPFS hash of the comment
     * @param travelerToHost Direction of review
     */
    function publishReview(
        uint256 reviewId,
        uint256 escrowId,
        address reviewer,
        address reviewee,
        uint256 propertyId,
        uint8 rating,
        string memory ipfsCommentHash,
        bool travelerToHost
    ) external {
        if (msg.sender != reviewValidator) revert NotAuthorized();

        Review memory review = Review({
            reviewId: reviewId,
            escrowId: escrowId,
            reviewer: reviewer,
            reviewee: reviewee,
            propertyId: propertyId,
            rating: rating,
            ipfsCommentHash: ipfsCommentHash,
            timestamp: block.timestamp,
            travelerToHost: travelerToHost,
            flagged: false,
            flagReason: "",
            flaggedAt: 0,
            flaggedBy: address(0),
            helpfulCount: 0,
            unhelpfulCount: 0
        });

        reviews[reviewId] = review;
        propertyReviews[propertyId].push(reviewId);
        userReviews[reviewee].push(reviewId);
        totalReviews++;

        // Update reputation on-chain
        if (travelerToHost) {
            // Traveler reviewed Host
            hostSBT.updateReputation(reviewee, rating, 60); // Default 60min response time
        } else {
            // Host reviewed Traveler
            travelerSBT.updateReputation(reviewee, rating, false);
        }

        // Update property rating
        if (propertyId != 0) {
            propertyNFT.updatePropertyRating(propertyId, rating);
        }

        emit ReviewPublished(reviewId, propertyId, reviewer, reviewee, rating);
    }

    /*//////////////////////////////////////////////////////////////
                        MODERATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Flag a review for inappropriate content
     * @param reviewId ID of the review
     * @param reason Reason for flagging
     */
    function flagReview(uint256 reviewId, string memory reason) external {
        if (!moderators[msg.sender]) revert NotModerator();

        Review storage review = reviews[reviewId];
        if (review.flagged) revert AlreadyFlagged();

        review.flagged = true;
        review.flagReason = reason;
        review.flaggedAt = block.timestamp;
        review.flaggedBy = msg.sender;

        emit ReviewFlagged(reviewId, reason, msg.sender);
    }

    /**
     * @notice Unflag a review (if mistakenly flagged)
     * @param reviewId ID of the review
     */
    function unflagReview(uint256 reviewId) external {
        if (!moderators[msg.sender]) revert NotModerator();

        Review storage review = reviews[reviewId];
        if (!review.flagged) revert NotFlagged();

        review.flagged = false;
        review.flagReason = "";
        review.flaggedAt = 0;
        review.flaggedBy = address(0);

        emit ReviewUnflagged(reviewId, msg.sender);
    }

    /**
     * @notice Batch flag multiple reviews
     * @param reviewIds Array of review IDs
     * @param reason Reason for flagging
     */
    function batchFlag(uint256[] memory reviewIds, string memory reason) external {
        if (!moderators[msg.sender]) revert NotModerator();

        for (uint256 i = 0; i < reviewIds.length; i++) {
            Review storage review = reviews[reviewIds[i]];
            if (!review.flagged) {
                review.flagged = true;
                review.flagReason = reason;
                review.flaggedAt = block.timestamp;
                review.flaggedBy = msg.sender;
                emit ReviewFlagged(reviewIds[i], reason, msg.sender);
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                        COMMUNITY VOTING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Vote on review helpfulness
     * @param reviewId ID of the review
     * @param helpful true = helpful, false = not helpful
     */
    function voteOnReview(uint256 reviewId, bool helpful) external {
        if (hasVoted[reviewId][msg.sender]) revert AlreadyVoted();

        Review storage review = reviews[reviewId];

        if (helpful) {
            review.helpfulCount++;
        } else {
            review.unhelpfulCount++;
        }

        hasVoted[reviewId][msg.sender] = true;

        emit ReviewVoted(reviewId, msg.sender, helpful);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get all reviews for a property (including flagged)
     */
    function getPropertyReviews(uint256 propertyId) external view returns (Review[] memory) {
        uint256[] memory reviewIds = propertyReviews[propertyId];
        Review[] memory result = new Review[](reviewIds.length);

        for (uint256 i = 0; i < reviewIds.length; i++) {
            result[i] = reviews[reviewIds[i]];
        }

        return result;
    }

    /**
     * @notice Get only VISIBLE (non-flagged) reviews for a property
     */
    function getVisiblePropertyReviews(uint256 propertyId) external view returns (Review[] memory) {
        uint256[] memory reviewIds = propertyReviews[propertyId];

        // Count visible reviews
        uint256 visibleCount = 0;
        for (uint256 i = 0; i < reviewIds.length; i++) {
            if (!reviews[reviewIds[i]].flagged) {
                visibleCount++;
            }
        }

        // Build result array
        Review[] memory result = new Review[](visibleCount);
        uint256 index = 0;

        for (uint256 i = 0; i < reviewIds.length; i++) {
            Review memory review = reviews[reviewIds[i]];
            if (!review.flagged) {
                result[index] = review;
                index++;
            }
        }

        return result;
    }

    /**
     * @notice Get reviews for a user (reviewee)
     */
    function getUserReviews(address user) external view returns (Review[] memory) {
        uint256[] memory reviewIds = userReviews[user];
        Review[] memory result = new Review[](reviewIds.length);

        for (uint256 i = 0; i < reviewIds.length; i++) {
            result[i] = reviews[reviewIds[i]];
        }

        return result;
    }

    /**
     * @notice Get property stats (excluding flagged reviews)
     */
    function getPropertyStats(
        uint256 propertyId
    ) external view returns (uint256 totalReviewsCount, uint256 visibleReviewsCount, uint256 averageRating) {
        uint256[] memory reviewIds = propertyReviews[propertyId];
        uint256 ratingSum = 0;
        uint256 count = 0;

        for (uint256 i = 0; i < reviewIds.length; i++) {
            Review memory review = reviews[reviewIds[i]];
            if (!review.flagged) {
                ratingSum += review.rating;
                count++;
            }
        }

        return (
            reviewIds.length,
            count,
            count > 0 ? (ratingSum * 100) / count : 0 // Average * 100
        );
    }

    /**
     * @notice Get a single review
     */
    function getReview(uint256 reviewId) external view returns (Review memory) {
        return reviews[reviewId];
    }

    /**
     * @notice Get flagged reviews (for moderation dashboard)
     */
    function getFlaggedReviews(uint256 offset, uint256 limit) external view returns (Review[] memory) {
        uint256 flaggedCount = 0;

        // Count flagged reviews
        for (uint256 i = 0; i < totalReviews; i++) {
            if (reviews[i].flagged) {
                flaggedCount++;
            }
        }

        // Calculate result size
        uint256 count = flaggedCount > offset ? flaggedCount - offset : 0;
        if (count > limit) count = limit;

        Review[] memory result = new Review[](count);
        uint256 index = 0;
        uint256 skipped = 0;

        for (uint256 i = 0; i < totalReviews && index < count; i++) {
            if (reviews[i].flagged) {
                if (skipped >= offset) {
                    result[index] = reviews[i];
                    index++;
                } else {
                    skipped++;
                }
            }
        }

        return result;
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set ReviewValidator address
     */
    function setReviewValidator(address _reviewValidator) external onlyOwner {
        reviewValidator = _reviewValidator;
    }

    /**
     * @notice Set moderator status
     */
    function setModerator(address moderator, bool status) external onlyOwner {
        moderators[moderator] = status;
        emit ModeratorSet(moderator, status);
    }

    /**
     * @notice Update contract references
     */
    function setContracts(address _travelerSBT, address _hostSBT, address _propertyNFT) external onlyOwner {
        travelerSBT = ITravelerSBT(_travelerSBT);
        hostSBT = IHostSBT(_hostSBT);
        propertyNFT = IPropertyNFT(_propertyNFT);
    }

    /**
     * @notice Check if address is moderator
     */
    function isModerator(address account) external view returns (bool) {
        return moderators[account];
    }
}
