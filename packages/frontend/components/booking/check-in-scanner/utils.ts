/**
 * Utility functions for CheckInScanner
 */

import type { PonderBooking } from "@/hooks/usePonderBookings";

/**
 * Get bookings that are eligible for check-in today
 */
export function getEligibleBookings(bookings: PonderBooking[] | undefined): PonderBooking[] {
  if (!bookings) return [];

  const now = Date.now() / 1000;
  const todayStart = Math.floor(new Date().setUTCHours(0, 0, 0, 0) / 1000);
  const todayEnd = todayStart + 24 * 60 * 60 - 1; // 23:59:59 today

  return bookings.filter((booking) => {
    const checkIn = Number(booking.checkInDate);
    const checkOut = Number(booking.checkOutDate);

    // Booking must be confirmed or checked-in (not pending, cancelled, or completed)
    if (booking.status === "Cancelled" || booking.status === "Completed") return false;

    // Check-in date is today
    const isCheckInToday = checkIn >= todayStart && checkIn <= todayEnd;

    // Or currently in the stay period (already checked in but not completed)
    const isDuringStay = now >= checkIn && now <= checkOut;

    return isCheckInToday || isDuringStay;
  });
}

/**
 * Find matching bookings for a QR code scan
 */
export function findMatchingBookings(
  bookings: PonderBooking[] | undefined,
  propertyId: string
): PonderBooking[] {
  if (!bookings) return [];

  const now = Date.now() / 1000;
  const oneDayMs = 24 * 60 * 60;

  return bookings.filter((booking) => {
    const checkIn = Number(booking.checkInDate);
    const checkOut = Number(booking.checkOutDate);

    // Must be for this property
    if (booking.propertyId !== propertyId) return false;

    // Check-in must be within ±1 day of now (flexible for early/late arrivals)
    const isCheckInTime = Math.abs(now - checkIn) <= oneDayMs;

    // Or currently in the stay period
    const isDuringStay = now >= checkIn && now <= checkOut;

    return (isCheckInTime || isDuringStay) && booking.status !== "Cancelled";
  });
}
