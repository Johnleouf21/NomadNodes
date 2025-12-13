/**
 * Types for Admin Review Moderation
 */

import type { Address } from "viem";

/**
 * Review Status enum matching contract
 */
export enum ReviewStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Published = 3,
}

/**
 * Pending review data structure
 */
export interface PendingReviewData {
  reviewId: bigint;
  escrowId: bigint;
  propertyId: bigint;
  bookingIndex: bigint;
  reviewer: Address;
  reviewee: Address;
  rating: number;
  ipfsCommentHash: string;
  submittedAt: bigint;
  status: ReviewStatus;
  moderationNote: string;
  moderator: Address;
  travelerToHost: boolean;
}
