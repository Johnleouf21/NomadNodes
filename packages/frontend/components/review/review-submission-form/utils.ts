/**
 * Utility functions for Review Submission Form
 */

import type { ReviewWindowInfo, ReviewableBooking } from "./types";
import { REVIEW_WINDOW_MS, REVIEW_WINDOW_DAYS, DEV_MODE_REVIEW_BYPASS } from "./constants";

/**
 * Calculate review window status for a booking
 */
export function calculateReviewWindow(booking: ReviewableBooking | null): ReviewWindowInfo | null {
  if (!booking) return null;

  const checkOutTime = booking.checkOut.getTime();
  const windowEnd = checkOutTime + REVIEW_WINDOW_MS;
  const now = Date.now();

  const isTooEarly = now < checkOutTime;
  const isExpired = now > windowEnd;

  // In dev mode, allow reviews even before checkout
  const isOpen = DEV_MODE_REVIEW_BYPASS
    ? now <= windowEnd // Only check not expired in dev mode
    : now >= checkOutTime && now <= windowEnd;

  const daysLeft = Math.ceil((windowEnd - now) / (24 * 60 * 60 * 1000));

  return {
    isOpen,
    daysLeft: Math.max(0, daysLeft),
    isTooEarly: DEV_MODE_REVIEW_BYPASS ? false : isTooEarly,
    isExpired,
    isDevMode: DEV_MODE_REVIEW_BYPASS,
  };
}

/**
 * Get the review window days constant
 */
export function getReviewWindowDays(): number {
  return REVIEW_WINDOW_DAYS;
}
