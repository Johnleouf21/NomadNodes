/**
 * Types for Booking Confirmation
 */

import type { BookingRoom } from "@/lib/store/useBookingStore";

/**
 * Single room quote (for backward compatibility)
 */
export interface BookingQuote {
  tokenId: bigint;
  checkIn: number; // Unix timestamp
  checkOut: number; // Unix timestamp
  price: bigint; // In token decimals (6 for USDC/EURC)
  currency: `0x${string}`; // Token address
  validUntil: number;
  quantity: number; // Number of room units to book
  signature: `0x${string}`;
}

/**
 * Batch booking quote (for multi room type bookings)
 */
export interface BatchBookingQuote {
  rooms: {
    tokenId: bigint;
    quantity: number;
    price: bigint;
  }[];
  checkIn: number;
  checkOut: number;
  totalPrice: bigint;
  currency: `0x${string}`;
  validUntil: number;
  signature: `0x${string}`;
}

/**
 * Parameters for booking confirmation
 */
export interface BookingConfirmationParams {
  rooms: BookingRoom[];
  checkIn: Date;
  checkOut: Date;
  totalAmount: number; // In USD/EUR
  paymentToken: "USDC" | "EURC";
  userAddress: `0x${string}`;
}

/**
 * Booking status states
 */
export type BookingStatus =
  | "idle"
  | "fetching-quote"
  | "approving"
  | "waiting-approval"
  | "creating-escrow"
  | "waiting-escrow"
  | "success"
  | "error"
  | "dev-mode-success"; // Development mode - simulated success

/**
 * Result of the useBookingConfirmation hook
 */
export interface UseBookingConfirmationResult {
  status: BookingStatus;
  error: string | null;
  escrowAddresses: `0x${string}`[]; // Array for batch bookings
  txHash: `0x${string}` | null;
  batchId: bigint | null; // For batch bookings
  confirmBooking: (params: BookingConfirmationParams) => Promise<`0x${string}` | null>;
  reset: () => void;
}
