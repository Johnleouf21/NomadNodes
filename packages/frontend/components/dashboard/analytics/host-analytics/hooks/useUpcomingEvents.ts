/**
 * Hook for getting upcoming check-ins and check-outs
 */

import * as React from "react";
import type { PonderBooking } from "@/hooks/usePonderBookings";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface UpcomingEvents {
  checkIns: PonderBooking[];
  checkOuts: PonderBooking[];
}

export function useUpcomingEvents(bookings: PonderBooking[]): UpcomingEvents {
  const checkIns = React.useMemo(() => {
    const now = Date.now();
    const weekFromNow = now + WEEK_MS;

    return bookings
      .filter((b) => {
        const checkIn = Number(b.checkInDate) * 1000;
        return (
          checkIn >= now &&
          checkIn <= weekFromNow &&
          (b.status === "Confirmed" || b.status === "Pending")
        );
      })
      .sort((a, b) => Number(a.checkInDate) - Number(b.checkInDate))
      .slice(0, 5);
  }, [bookings]);

  const checkOuts = React.useMemo(() => {
    const now = Date.now();
    const weekFromNow = now + WEEK_MS;

    return bookings
      .filter((b) => {
        const checkOut = Number(b.checkOutDate) * 1000;
        return checkOut >= now && checkOut <= weekFromNow && b.status === "CheckedIn";
      })
      .sort((a, b) => Number(a.checkOutDate) - Number(b.checkOutDate))
      .slice(0, 5);
  }, [bookings]);

  return { checkIns, checkOuts };
}
