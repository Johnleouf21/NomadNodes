/**
 * Hook for calculating booking status metrics
 */

import * as React from "react";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { BookingMetrics } from "../types";

export function useBookingMetrics(filteredBookings: PonderBooking[]): BookingMetrics {
  return React.useMemo(() => {
    const total = filteredBookings.length;
    const pending = filteredBookings.filter((b) => b.status === "Pending").length;
    const confirmed = filteredBookings.filter((b) => b.status === "Confirmed").length;
    const checkedIn = filteredBookings.filter((b) => b.status === "CheckedIn").length;
    const completed = filteredBookings.filter((b) => b.status === "Completed").length;
    const cancelled = filteredBookings.filter((b) => b.status === "Cancelled").length;

    const conversionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";
    const cancellationRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : "0";

    return {
      total,
      pending,
      confirmed,
      checkedIn,
      completed,
      cancelled,
      conversionRate,
      cancellationRate,
    };
  }, [filteredBookings]);
}
