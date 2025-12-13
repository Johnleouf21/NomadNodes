/**
 * Admin Platform Management Hooks
 * For platform-wide statistics, user management, and property oversight
 */

// Types
export * from "./types";

// Constants
export { PONDER_URL } from "./constants";

// Platform Statistics
export {
  useTotalProperties,
  useEscrowCount,
  useGlobalStats,
  usePlatformStats,
} from "./usePlatformStats";

// Host Management
export {
  useHostProfile,
  useSuspendHost,
  useUnsuspendHost,
  usePonderHosts,
} from "./useHostManagement";

// Traveler Management
export {
  useTravelerProfile,
  useSuspendTraveler,
  useUnsuspendTraveler,
  usePonderTravelers,
} from "./useTravelerManagement";

// Properties
export { useAdminProperties, usePropertyRoomTypes, useAllRoomTypes } from "./useAdminProperties";

// Escrows
export { useAllEscrows } from "./useAdminEscrows";

// Bookings
export { useRecentBookings, useBookingsByStatus } from "./useAdminBookings";

// Reviews
export { usePonderReviews, usePropertyReviews, useFlaggedReviews } from "./useAdminReviews";
