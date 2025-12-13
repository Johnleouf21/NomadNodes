"use client";

/**
 * Hook for pending actions calculations
 */

import * as React from "react";
import type { PonderReview } from "@/hooks/usePonderReviews";
import type { BookingSummary, TravelerPendingActions } from "../../types";

interface UsePendingActionsProps {
  bookings: BookingSummary[];
  reviewsGiven: PonderReview[];
  justReviewedBookings: Set<string>;
}

/**
 * Calculate pending actions for traveler
 */
export function usePendingActions({
  bookings,
  reviewsGiven,
  justReviewedBookings,
}: UsePendingActionsProps) {
  const pendingActions: TravelerPendingActions = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime() / 1000;
    const todayEnd = todayStart + 86400;
    const nowTimestamp = Date.now() / 1000;

    const toConfirmArrival = bookings.filter((b) => {
      if (b.ponderStatus !== "CheckedIn") return false;
      const checkInTimestamp = b.checkIn.getTime() / 1000;
      return checkInTimestamp >= todayStart && checkInTimestamp < todayEnd;
    });

    const reviewedHosts = new Set(
      reviewsGiven.map((r) => `${r.propertyId}-${r.reviewee.toLowerCase()}`)
    );

    const toCompleteOrReview = bookings.filter((b) => {
      if (!b.hostAddress || !b.escrowAddress) return false;

      const key = `${b.propertyId}-${b.hostAddress.toLowerCase()}`;
      if (reviewedHosts.has(key)) return false;
      if (justReviewedBookings.has(b.id)) return false;

      if (b.ponderStatus === "Completed") return true;

      if (b.ponderStatus === "CheckedIn") {
        const checkInDayEnd = Math.floor(b.checkIn.getTime() / 1000 / 86400) * 86400 + 86400 - 1;
        return nowTimestamp > checkInDayEnd;
      }

      return false;
    });

    const checkInsToday = bookings.filter((b) => {
      if (b.ponderStatus !== "Confirmed") return false;
      const checkInTimestamp = b.checkIn.getTime() / 1000;
      return checkInTimestamp >= todayStart && checkInTimestamp < todayEnd;
    });

    return {
      total: toConfirmArrival.length + toCompleteOrReview.length + checkInsToday.length,
      toConfirmArrival,
      toCompleteOrReview,
      checkInsToday,
    };
  }, [bookings, reviewsGiven, justReviewedBookings]);

  return pendingActions;
}
