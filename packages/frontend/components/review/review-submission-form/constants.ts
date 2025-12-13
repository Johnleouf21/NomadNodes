/**
 * Constants for Review Submission Form
 */

/**
 * Review window: 14 days after checkout
 */
export const REVIEW_WINDOW_DAYS = 14;
export const REVIEW_WINDOW_MS = REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Escrow search timeout in milliseconds
 */
export const ESCROW_SEARCH_TIMEOUT_MS = 15000;

/**
 * Dev mode bypass - allows reviews before checkout for testing
 */
export const DEV_MODE_REVIEW_BYPASS = process.env.NEXT_PUBLIC_DEV_MODE === "true";

/**
 * Maximum comment length
 */
export const MAX_COMMENT_LENGTH = 2000;

/**
 * Rating labels for display
 */
export const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};
