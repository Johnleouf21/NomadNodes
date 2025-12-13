/**
 * Hook for filtering bookings by time period
 */

import * as React from "react";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { TimePeriod } from "../types";
import { PERIOD_MS } from "../utils";

export function useFilteredBookings(
  bookings: PonderBooking[],
  period: TimePeriod
): PonderBooking[] {
  return React.useMemo(() => {
    if (period === "all") return bookings;

    const now = Date.now();
    const periodMs = PERIOD_MS[period];

    return bookings.filter((b) => {
      const createdAt = Number(b.createdAt) * 1000;
      return now - createdAt <= periodMs;
    });
  }, [bookings, period]);
}
