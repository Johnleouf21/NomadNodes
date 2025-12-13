/**
 * Traveler Dashboard hooks
 *
 * Refactored from a 429-line monolithic hook into:
 * - useUrlParams: Tab and URL parameter state
 * - useModalState: Modal state management
 * - useBookingData: Booking data fetching and transformation
 * - useReviewsData: Reviews data fetching
 * - useStats: Stats calculations
 * - usePendingActions: Pending actions calculations
 * - useTravelerDashboard: Main combined hook
 */

export { useTravelerDashboard } from "./useTravelerDashboard";
export { useUrlParams } from "./useUrlParams";
export { useModalState } from "./useModalState";
export { useBookingData } from "./useBookingData";
export { useReviewsData } from "./useReviewsData";
export { useStats } from "./useStats";
export { usePendingActions } from "./usePendingActions";
