/**
 * Admin Review Moderation Hooks
 *
 * Refactored from a 438-line file into:
 * - types.ts: ReviewStatus enum, PendingReviewData interface
 * - readHooks.ts: useIsModerator, useReviewValidatorOwner, useGetPendingCount, etc.
 * - writeHooks.ts: useApproveReview, useRejectReview, usePublishReview, etc.
 */

// Types
export { ReviewStatus, type PendingReviewData } from "./types";

// Read Hooks
export {
  useIsModerator,
  useReviewValidatorOwner,
  useGetPendingCount,
  useGetPendingReviews,
  useAutoApproveEnabled,
  useAutoApproveThreshold,
  useReviewCounter,
  useGetReview,
  useGetReviewsByStatus,
} from "./readHooks";

// Write Hooks
export {
  useApproveReview,
  useRejectReview,
  usePublishReview,
  useBatchApprove,
  useBatchPublish,
  useSetModerator,
  useSetAutoApprove,
  useFlagReview,
  useUnflagReview,
} from "./writeHooks";
