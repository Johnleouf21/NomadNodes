"use client";

import { MapPin, Calendar } from "lucide-react";
import type { ReviewableBooking } from "../types";

interface BookingInfoProps {
  booking: ReviewableBooking;
}

/**
 * Displays booking information in the review form
 */
export function BookingInfo({ booking }: BookingInfoProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{booking.propertyName}</h3>
      <p className="text-muted-foreground text-sm">{booking.roomName}</p>
      <div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
        <MapPin className="h-4 w-4" />
        <span>{booking.location}</span>
      </div>
      <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4" />
        <span>Checkout: {booking.checkOut.toLocaleDateString()}</span>
      </div>
    </div>
  );
}
