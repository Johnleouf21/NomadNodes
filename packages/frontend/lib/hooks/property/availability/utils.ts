/**
 * Utility functions for availability management
 */

/**
 * Helper to get start of day timestamp (normalized to UTC midnight)
 * Uses LOCAL date components to create UTC midnight timestamp
 * This ensures Dec 6 in user's timezone becomes Dec 6 00:00:00 UTC
 */
export function getStartOfDayTimestamp(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 1000);
}

/**
 * Helper to get end of day timestamp
 * Uses LOCAL date components to create UTC end-of-day timestamp
 */
export function getEndOfDayTimestamp(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999) / 1000
  );
}

/**
 * Calculate gas estimate for availability operations
 */
export function estimateAvailabilityGas(daysCount: number, unitsCount: number = 1): bigint {
  const baseGas = unitsCount > 1 ? 100000 : 50000;
  const perDayGas = unitsCount * 50000;
  const estimatedGas = baseGas + daysCount * perDayGas;
  return BigInt(Math.min(estimatedGas, 15000000)); // Cap at 15M to stay under block limit
}

/**
 * Get timestamps for availability range
 * CRITICAL: Smart contract loop is `for (d = start; d < end; d += 1 days)`
 * So endDate must be the day AFTER the last day we want to update
 */
export function getAvailabilityTimestamps(startDate: Date, endDate: Date) {
  const startTimestamp = BigInt(getStartOfDayTimestamp(startDate));

  // Add one day to endDate
  const nextDay = new Date(endDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const endTimestamp = BigInt(getStartOfDayTimestamp(nextDay));

  // Calculate number of days
  const daysDiff = Math.ceil((nextDay.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return { startTimestamp, endTimestamp, daysDiff };
}

/**
 * Generate array of dates to check for calendar availability
 */
export function generateDatesToCheck(startDate: Date, daysToCheck: number): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  for (let i = 0; i < daysToCheck; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }

  return dates;
}
