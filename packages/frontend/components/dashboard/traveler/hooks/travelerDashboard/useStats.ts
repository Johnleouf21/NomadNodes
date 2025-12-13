"use client";

/**
 * Hook for stats calculations
 */

import * as React from "react";
import type { BookingSummary, PastBookingCounts, PastBookingStatusFilter } from "../../types";

interface UseStatsProps {
  bookings: BookingSummary[];
  upcomingBookings: BookingSummary[];
  pastBookings: BookingSummary[];
  pastStatusFilter: PastBookingStatusFilter;
}

/**
 * Calculate dashboard stats
 */
export function useStats({
  bookings,
  upcomingBookings,
  pastBookings,
  pastStatusFilter,
}: UseStatsProps) {
  // Past booking counts
  const pastBookingCounts: PastBookingCounts = React.useMemo(
    () => ({
      all: pastBookings.length,
      Completed: pastBookings.filter((b) => b.ponderStatus === "Completed").length,
      Cancelled: pastBookings.filter((b) => b.ponderStatus === "Cancelled").length,
    }),
    [pastBookings]
  );

  // Filter past bookings by status
  const filteredPastBookings = React.useMemo(() => {
    if (pastStatusFilter === "all") return pastBookings;
    return pastBookings.filter((b) => b.ponderStatus === pastStatusFilter);
  }, [pastBookings, pastStatusFilter]);

  // Stats calculations
  const totalSpent = React.useMemo(() => {
    return bookings
      .filter((b) => b.ponderStatus === "Completed")
      .reduce((sum, b) => sum + b.total, 0);
  }, [bookings]);

  const totalNights = React.useMemo(() => {
    return bookings.reduce((sum, b) => sum + b.nights, 0);
  }, [bookings]);

  const nextCheckIn = React.useMemo(() => {
    if (upcomingBookings.length === 0) return null;
    const sorted = [...upcomingBookings].sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());
    return sorted[0]?.checkIn || null;
  }, [upcomingBookings]);

  const uniqueProperties = React.useMemo(() => {
    const propertySet = new Set(
      bookings.filter((b) => b.ponderStatus === "Completed").map((b) => b.propertyId)
    );
    return propertySet.size;
  }, [bookings]);

  const completedBookingsCount = React.useMemo(() => {
    return bookings.filter((b) => b.ponderStatus === "Completed").length;
  }, [bookings]);

  return {
    pastBookingCounts,
    filteredPastBookings,
    totalSpent,
    totalNights,
    nextCheckIn,
    uniqueProperties,
    completedBookingsCount,
  };
}
