/**
 * Types for Reviews Modal
 */

/**
 * Review data structure
 */
export interface Review {
  id: string;
  reviewId: string;
  propertyId: string;
  reviewer: string;
  reviewee: string;
  rating: number;
  helpfulVotes: string | number;
  unhelpfulVotes: string | number;
  isFlagged: boolean;
  createdAt: string;
}

/**
 * Props for the main ReviewsModal component
 */
export interface ReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewsReceived: Review[];
  reviewsGiven: Review[];
  averageRating?: number;
  totalReviews?: number;
  isLoading?: boolean;
}

/**
 * Sort options for reviews
 */
export type SortOption = "newest" | "oldest" | "highest" | "lowest";

/**
 * Filter options for reviews by rating
 */
export type FilterOption = "all" | "5" | "4" | "3" | "2" | "1";

/**
 * Tab types
 */
export type ReviewTab = "received" | "given";

/**
 * Rating distribution by star count
 */
export type RatingDistribution = Record<1 | 2 | 3 | 4 | 5, number>;

/**
 * Type for the review struct from ReviewValidator contract
 */
export interface ReviewValidatorData {
  reviewId: bigint;
  escrowId: bigint;
  propertyId: bigint;
  bookingIndex: bigint;
  reviewer: string;
  reviewee: string;
  rating: number;
  ipfsCommentHash: string;
  submittedAt: bigint;
  status: number;
  moderationNote: string;
  moderator: string;
  travelerToHost: boolean;
}
