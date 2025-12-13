/**
 * Utility functions for Host Analytics
 */

import type { TimePeriod } from "./types";

/**
 * Time period in milliseconds
 */
export const PERIOD_MS: Record<Exclude<TimePeriod, "all">, number> = {
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
};

/**
 * Format a Unix timestamp to a short date string
 */
export function formatDate(timestamp: string): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Get a human-readable string for days until a date
 */
export function getDaysUntil(timestamp: string): string {
  const days = Math.ceil((Number(timestamp) * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

/**
 * Platform fee percentage
 */
export const PLATFORM_FEE_PERCENT = 0.05;

/**
 * Convert token amount to display value (6 decimals)
 */
export function tokenToDisplay(amount: bigint | string | number): number {
  return Number(amount) / 1e6;
}
