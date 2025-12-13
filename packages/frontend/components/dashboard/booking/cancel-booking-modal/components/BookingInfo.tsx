"use client";

/**
 * Booking info display component
 */

import * as React from "react";
import { Calendar } from "lucide-react";
import type { BookingInfo as BookingInfoType } from "../types";

interface BookingInfoProps {
  booking: BookingInfoType;
}

export function BookingInfo({ booking }: BookingInfoProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <h4 className="font-semibold">{booking.propertyName}</h4>
      <p className="text-muted-foreground text-sm">{booking.roomName}</p>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <Calendar className="text-muted-foreground h-4 w-4" />
        <span>
          {booking.checkIn.toLocaleDateString()} - {booking.checkOut.toLocaleDateString()}
        </span>
        <span className="text-muted-foreground">({booking.nights} nights)</span>
      </div>
    </div>
  );
}
