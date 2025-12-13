/**
 * Utility Functions for Booking Confirmation
 */

import type { BookingStatus } from "./types";
import { IS_DEV_MODE } from "./constants";

/**
 * Get human-readable status message
 */
export function getStatusMessage(status: BookingStatus): string {
  switch (status) {
    case "idle":
      return "Ready to book";
    case "fetching-quote":
      return "Getting price quote...";
    case "approving":
      return "Approving token spend...";
    case "waiting-approval":
      return "Waiting for approval confirmation...";
    case "creating-escrow":
      return "Creating booking escrow...";
    case "waiting-escrow":
      return "Waiting for transaction confirmation...";
    case "success":
      return "Booking confirmed!";
    case "dev-mode-success":
      return "Booking simulated (Dev Mode)";
    case "error":
      return "Booking failed";
    default:
      return "";
  }
}

/**
 * Check if development mode is enabled
 */
export function isDevMode(): boolean {
  return IS_DEV_MODE;
}
