"use client";

/**
 * Hook to calculate pending actions for host
 */

import * as React from "react";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { PendingActions } from "../../../types";

interface Review {
  propertyId: string;
  reviewee: string;
}

/**
 * Calculate pending actions based on bookings and reviews
 */
export function usePendingActions(
  bookings: PonderBooking[] | undefined,
  hostReviews: Review[]
): PendingActions {
  return React.useMemo(() => {
    if (!bookings) {
      return { total: 0, toConfirm: [], toCheckIn: [], toComplete: [], toReview: [] };
    }

    const now = new Date();

    // Bookings to confirm (Pending status)
    const toConfirm = bookings.filter((b) => b.status === "Pending");

    // Bookings to check in (Confirmed and past check-in day)
    const toCheckIn = bookings.filter((b) => {
      if (b.status !== "Confirmed") return false;
      const checkInDate = new Date(Number(b.checkInDate) * 1000);
      const checkInDayEnd = new Date(checkInDate);
      checkInDayEnd.setUTCHours(23, 59, 59, 999);
      return now > checkInDayEnd;
    });

    // Bookings to complete (CheckedIn and past check-out date)
    const toComplete = bookings.filter((b) => {
      if (b.status !== "CheckedIn") return false;
      const checkOutDate = new Date(Number(b.checkOutDate) * 1000);
      return now >= checkOutDate;
    });

    // Calculate pending reviews
    const reviewCountByKey = new Map<string, number>();
    hostReviews.forEach((r) => {
      const key = `${r.propertyId}-${r.reviewee.toLowerCase()}`;
      reviewCountByKey.set(key, (reviewCountByKey.get(key) || 0) + 1);
    });

    const bookingCountByKey = new Map<string, number>();
    const completedWithEscrow = bookings.filter((b) => b.status === "Completed" && b.escrowAddress);
    completedWithEscrow.forEach((b) => {
      const key = `${b.propertyId}-${b.traveler.toLowerCase()}`;
      bookingCountByKey.set(key, (bookingCountByKey.get(key) || 0) + 1);
    });

    const pendingReviewsByKey = new Map<string, number>();
    bookingCountByKey.forEach((bookingCount, key) => {
      const reviewCount = reviewCountByKey.get(key) || 0;
      const pending = bookingCount - reviewCount;
      if (pending > 0) {
        pendingReviewsByKey.set(key, pending);
      }
    });

    const toReview: PonderBooking[] = [];
    const usedCountByKey = new Map<string, number>();

    for (const booking of completedWithEscrow) {
      const key = `${booking.propertyId}-${booking.traveler.toLowerCase()}`;
      const pendingForKey = pendingReviewsByKey.get(key) || 0;
      const usedForKey = usedCountByKey.get(key) || 0;

      if (usedForKey < pendingForKey) {
        toReview.push(booking);
        usedCountByKey.set(key, usedForKey + 1);
      }
    }

    return {
      total: toConfirm.length + toCheckIn.length + toComplete.length + toReview.length,
      toConfirm,
      toCheckIn,
      toComplete,
      toReview,
    };
  }, [bookings, hostReviews]);
}
