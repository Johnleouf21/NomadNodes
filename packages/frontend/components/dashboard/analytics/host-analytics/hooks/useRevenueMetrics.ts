/**
 * Hook for calculating revenue metrics
 */

import * as React from "react";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { RevenueMetrics } from "../types";
import { PLATFORM_FEE_PERCENT, tokenToDisplay } from "../utils";

type GetRoomTypeInfo = (booking: PonderBooking) => { name: string; currency: "USD" | "EUR" };

export function useRevenueMetrics(
  filteredBookings: PonderBooking[],
  getRoomTypeInfo: GetRoomTypeInfo
): RevenueMetrics {
  return React.useMemo(() => {
    const completed = filteredBookings.filter((b) => b.status === "Completed");
    const totalRevenue = completed.reduce((sum, b) => sum + tokenToDisplay(b.totalPrice), 0);
    const platformFee = totalRevenue * PLATFORM_FEE_PERCENT;
    const netEarnings = totalRevenue - platformFee;

    // Calculate average booking value
    const avgBookingValue = completed.length > 0 ? totalRevenue / completed.length : 0;

    // Calculate by currency
    const byCurrency = completed.reduce(
      (acc, b) => {
        const currency = getRoomTypeInfo(b).currency;
        const amount = tokenToDisplay(b.totalPrice);
        if (currency === "EUR") {
          acc.EUR += amount;
        } else {
          acc.USD += amount;
        }
        return acc;
      },
      { USD: 0, EUR: 0 }
    );

    return {
      totalRevenue,
      platformFee,
      netEarnings,
      avgBookingValue,
      byCurrency,
      completedCount: completed.length,
    };
  }, [filteredBookings, getRoomTypeInfo]);
}
