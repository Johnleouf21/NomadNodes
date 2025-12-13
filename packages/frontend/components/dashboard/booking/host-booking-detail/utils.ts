import type { DaysInfo } from "./types";

/**
 * Format date for display
 */
export function formatDate(timestamp: string): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(timestamp: string): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Calculate days info for check-in/checkout
 */
export function getDaysInfo(checkInTimestamp: string, checkOutTimestamp: string): DaysInfo {
  const checkIn = new Date(Number(checkInTimestamp) * 1000);
  const checkOut = new Date(Number(checkOutTimestamp) * 1000);
  const now = new Date();

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilCheckIn = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let checkInLabel = "";
  let isUrgent = false;

  if (daysUntilCheckIn < 0) {
    checkInLabel = `${Math.abs(daysUntilCheckIn)} days ago`;
  } else if (daysUntilCheckIn === 0) {
    checkInLabel = "Today";
    isUrgent = true;
  } else if (daysUntilCheckIn === 1) {
    checkInLabel = "Tomorrow";
    isUrgent = true;
  } else if (daysUntilCheckIn <= 3) {
    checkInLabel = `In ${daysUntilCheckIn} days`;
    isUrgent = true;
  } else {
    checkInLabel = `In ${daysUntilCheckIn} days`;
  }

  return { nights, daysUntilCheckIn, checkInLabel, isUrgent };
}

/**
 * Shorten wallet address
 */
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
