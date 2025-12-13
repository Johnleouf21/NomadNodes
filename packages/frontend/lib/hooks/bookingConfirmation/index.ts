/**
 * Booking Confirmation Module
 * For confirming bookings with the EscrowFactory contract
 */

// Types
export type {
  BookingQuote,
  BatchBookingQuote,
  BookingConfirmationParams,
  BookingStatus,
  UseBookingConfirmationResult,
} from "./types";

// Constants
export { IS_DEV_MODE } from "./constants";

// Main hook
export { useBookingConfirmation } from "./useBookingConfirmation";

// Utilities
export { getStatusMessage, isDevMode } from "./utils";
