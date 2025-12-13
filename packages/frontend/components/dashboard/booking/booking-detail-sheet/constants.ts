/**
 * Constants for Booking Detail Sheet
 */

import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { StatusConfig } from "./types";

/**
 * Status configuration for different booking states
 */
export const PONDER_STATUS_CONFIG: Record<PonderBooking["status"], StatusConfig> = {
  Pending: {
    label: "Pending",
    color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    description: "Booking is confirmed and funds are held in escrow",
  },
  Confirmed: {
    label: "Confirmed",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    description: "Booking has been confirmed by the host",
  },
  CheckedIn: {
    label: "Checked In",
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
    description: "Guest has checked in to the property",
  },
  Completed: {
    label: "Completed",
    color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
    description: "Stay completed - funds released to host",
  },
  Cancelled: {
    label: "Cancelled",
    color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
    description: "Booking was cancelled",
  },
};

/**
 * Base Scan URL for viewing contracts
 */
export const ETHERSCAN_BASE_URL = "https://sepolia.etherscan.io/address";
