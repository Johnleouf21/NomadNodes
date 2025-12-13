/**
 * Utility functions for CancelBookingModal
 */

import type { RefundCalculation } from "./types";

/**
 * Calculate refund amounts based on escrow data
 */
export function calculateRefund(params: {
  refundPercentage: bigint | undefined;
  escrowAmount: bigint | undefined;
  platformFee: bigint | undefined;
  bookingTotal: number;
}): RefundCalculation {
  const { refundPercentage, escrowAmount, platformFee, bookingTotal } = params;

  const refundPercent = refundPercentage !== undefined ? Number(refundPercentage) : 0;
  const totalAmount = escrowAmount !== undefined ? Number(escrowAmount) / 1e6 : bookingTotal;
  const fee = platformFee !== undefined ? Number(platformFee) / 1e6 : totalAmount * 0.05;
  const refundableAmount = totalAmount - fee;
  const yourRefund = (refundableAmount * refundPercent) / 100;
  const hostReceives = refundableAmount - yourRefund;

  return {
    refundPercent,
    totalAmount,
    fee,
    refundableAmount,
    yourRefund,
    hostReceives,
  };
}

/**
 * Calculate days until check-in
 */
export function getDaysUntilCheckIn(checkInDate: Date): number {
  return Math.ceil((checkInDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * Get currency label
 */
export function getCurrencyLabel(currency?: "USD" | "EUR"): string {
  return currency === "EUR" ? "EURC" : "USDC";
}
