/**
 * Error Handling for Booking Confirmation
 *
 * Error selectors:
 * - 0x2c5211c6 = InvalidAmount() - room not available or price mismatch
 * - 0xf8618030 = InvalidQuote() - signature validation failed
 * - 0x8727a7f9 = QuoteExpired() - quote has expired
 * - 0x2263f4e2 = UnsupportedCurrency() - currency not supported
 * - 0xe6c4247b = InvalidAddress() - invalid address
 * - 0xea8e4eb5 = NotAuthorized() - TravelerSBT authorization failed
 * - 0x8579befe = MustHaveTravelerSBT() - traveler doesn't have SBT
 * - 0x48f5c3ed = NoAvailableUnits() - no rooms available
 * - 0x4d5e5fb3 = NotEscrowFactory() - BookingManager permission denied
 */

import type { BookingConfirmationParams } from "./types";

interface ContractError {
  message?: string;
  code?: number;
}

/**
 * Handle escrow creation errors and throw user-friendly messages
 */
export function handleEscrowError(escrowError: unknown, params: BookingConfirmationParams): never {
  const err = escrowError as ContractError;
  const errorMessage = err?.message || "";

  // Log full error for debugging
  console.error("[Booking Error]", {
    message: errorMessage,
    code: err?.code,
    fullError: escrowError,
  });

  // User rejected transaction
  if (errorMessage.includes("User rejected") || err?.code === 4001) {
    throw new Error(
      "Booking transaction was rejected. Please confirm the transaction to create your booking."
    );
  }

  // MustHaveTravelerSBT - traveler doesn't have SBT
  if (errorMessage.includes("0x8579befe") || errorMessage.includes("MustHaveTravelerSBT")) {
    throw new Error(
      "You need a Traveler Badge (SBT) to make bookings. " +
        "Please mint your Traveler Badge from your profile page first."
    );
  }

  // NotAuthorized - TravelerSBT authorization failed
  if (errorMessage.includes("0xea8e4eb5") || errorMessage.includes("NotAuthorized")) {
    throw new Error(
      "Authorization error: The booking system is not properly configured. " +
        "Please contact support (Error: BookingManager not authorized on TravelerSBT)."
    );
  }

  // NotEscrowFactory - BookingManager permission denied
  if (errorMessage.includes("0x4d5e5fb3") || errorMessage.includes("NotEscrowFactory")) {
    throw new Error(
      "Configuration error: Booking confirmation failed due to permission issue. " +
        "Please contact support (Error: NotEscrowFactory)."
    );
  }

  // NoAvailableUnits - no rooms available
  if (errorMessage.includes("0x48f5c3ed") || errorMessage.includes("NoAvailableUnits")) {
    throw new Error(
      "No rooms available for your selected dates. " +
        "All units may be booked. Please try different dates."
    );
  }

  // InvalidAmount - room not available or price mismatch
  if (errorMessage.includes("0x2c5211c6") || errorMessage.includes("InvalidAmount")) {
    throw new Error(
      "The room is not available for your selected dates. " +
        "The host may not have opened availability for this period. " +
        "Please try different dates or contact the host."
    );
  }

  // InvalidQuote - signature validation failed
  if (errorMessage.includes("0xf8618030") || errorMessage.includes("InvalidQuote")) {
    throw new Error(
      "Booking signature validation failed. This usually means the backend signing service " +
        "is not configured correctly. Please contact support or try again later."
    );
  }

  // QuoteExpired - quote has expired
  if (errorMessage.includes("0x8727a7f9") || errorMessage.includes("QuoteExpired")) {
    throw new Error("The booking quote has expired. Please try again to get a new quote.");
  }

  // UnsupportedCurrency - currency not supported
  if (errorMessage.includes("0x2263f4e2") || errorMessage.includes("UnsupportedCurrency")) {
    throw new Error(
      "The selected payment currency is not supported. Please try with USDC or EURC."
    );
  }

  // Generic revert handling for account abstraction errors
  if (errorMessage.includes("AA23") || errorMessage.includes("reverted")) {
    const hexMatch = errorMessage.match(/0x[a-fA-F0-9]{8}/);
    const hexSelector = hexMatch ? hexMatch[0] : "unknown";
    console.error("[Booking Error] Revert with selector:", hexSelector);

    throw new Error(
      `The booking transaction was reverted (${hexSelector}). This could be due to: ` +
        "unavailable dates, missing Traveler Badge, expired quote, or a system configuration issue. " +
        "Please verify you have a Traveler Badge and try again, or contact support."
    );
  }

  // Insufficient balance
  if (errorMessage.includes("insufficient") || errorMessage.includes("balance")) {
    throw new Error(
      `Insufficient ${params.paymentToken} balance. ` +
        `Please ensure you have at least ${params.totalAmount} ${params.paymentToken} in your wallet.`
    );
  }

  // Unknown error
  throw new Error(`Failed to create booking: ${err?.message || "Unknown error"}`);
}
