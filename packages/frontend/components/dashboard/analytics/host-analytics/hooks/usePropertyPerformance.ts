/**
 * Hook for calculating property performance
 */

import * as React from "react";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { PropertyPerformance } from "../types";
import { tokenToDisplay } from "../utils";

type GetPropertyInfo = (booking: PonderBooking) => { name: string; imageUrl?: string };

export function usePropertyPerformance(
  filteredBookings: PonderBooking[],
  getPropertyInfo: GetPropertyInfo
): PropertyPerformance[] {
  return React.useMemo(() => {
    const performance = new Map<
      string,
      { name: string; bookings: number; revenue: number; image?: string }
    >();

    filteredBookings.forEach((b) => {
      const propertyId = b.propertyId;
      const { name, imageUrl } = getPropertyInfo(b);
      const revenue = b.status === "Completed" ? tokenToDisplay(b.totalPrice) : 0;

      const existing = performance.get(propertyId);
      if (existing) {
        existing.bookings += 1;
        existing.revenue += revenue;
      } else {
        performance.set(propertyId, { name, bookings: 1, revenue, image: imageUrl });
      }
    });

    return Array.from(performance.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredBookings, getPropertyInfo]);
}
