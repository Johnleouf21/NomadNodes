/**
 * Hook for calculating monthly analytics data
 */

import * as React from "react";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { MonthlyData } from "../types";
import { tokenToDisplay } from "../utils";

export function useMonthlyData(bookings: PonderBooking[]): MonthlyData[] {
  return React.useMemo(() => {
    const months: MonthlyData[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = date.getTime();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();

      const monthBookings = bookings.filter((b) => {
        const checkIn = Number(b.checkInDate) * 1000;
        return checkIn >= monthStart && checkIn <= monthEnd;
      });

      const revenue = monthBookings
        .filter((b) => b.status === "Completed")
        .reduce((sum, b) => sum + tokenToDisplay(b.totalPrice), 0);

      months.push({
        month: date.toLocaleString("default", { month: "short" }),
        bookings: monthBookings.length,
        revenue,
      });
    }

    return months;
  }, [bookings]);
}
