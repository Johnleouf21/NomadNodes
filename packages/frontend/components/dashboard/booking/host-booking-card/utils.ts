/**
 * Utility functions for HostBookingCard
 */

import { toast } from "sonner";

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: string): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface DaysUntilInfo {
  days: number;
  label: string;
  urgent: boolean;
}

/**
 * Get days until a given timestamp
 */
export function getDaysUntil(timestamp: string): DaysUntilInfo {
  const date = new Date(Number(timestamp) * 1000);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), label: `${Math.abs(diffDays)}d ago`, urgent: true };
  } else if (diffDays === 0) {
    return { days: 0, label: "Today", urgent: true };
  } else if (diffDays === 1) {
    return { days: 1, label: "Tomorrow", urgent: true };
  } else if (diffDays <= 3) {
    return { days: diffDays, label: `In ${diffDays} days`, urgent: true };
  } else {
    return { days: diffDays, label: `In ${diffDays} days`, urgent: false };
  }
}

/**
 * Calculate number of nights between check-in and check-out
 */
export function getNightsCount(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(Number(checkIn) * 1000);
  const checkOutDate = new Date(Number(checkOut) * 1000);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Copy text to clipboard with toast notification
 */
export function copyToClipboard(text: string, label: string): void {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
}

/**
 * Calculate booking action availability
 */
export function getBookingActionState(
  status: string,
  checkInDate: string,
  checkOutDate: string
): {
  canConfirm: boolean;
  canCheckIn: boolean;
  canComplete: boolean;
  canCancel: boolean;
  showCheckInDisabled: boolean;
  showCompleteDisabled: boolean;
} {
  const now = new Date();
  const checkIn = new Date(Number(checkInDate) * 1000);
  const checkOut = new Date(Number(checkOutDate) * 1000);

  // Host can only mark check-in after 23:59 UTC of check-in day
  const checkInDayEnd = new Date(checkIn);
  checkInDayEnd.setUTCHours(23, 59, 59, 999);
  const isCheckInDayEnded = now > checkInDayEnd;

  const isCheckOutDateReached = now >= checkOut;

  return {
    canConfirm: status === "Pending",
    canCheckIn: status === "Confirmed" && isCheckInDayEnded,
    canComplete: status === "CheckedIn" && isCheckOutDateReached,
    canCancel: status === "Pending" || status === "Confirmed",
    showCheckInDisabled: status === "Confirmed" && !isCheckInDayEnded,
    showCompleteDisabled: status === "CheckedIn" && !isCheckOutDateReached,
  };
}
