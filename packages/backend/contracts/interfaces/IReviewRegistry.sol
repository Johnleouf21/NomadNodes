// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IReviewRegistry
 * @notice Interface for ReviewRegistry contract
 */
interface IReviewRegistry {
    function publishReview(
        uint256 reviewId,
        uint256 escrowId,
        address reviewer,
        address reviewee,
        uint256 propertyId,
        uint8 rating,
        string memory ipfsCommentHash,
        bool travelerToHost
    ) external;
}
