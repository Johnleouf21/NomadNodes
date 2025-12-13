"use client";

import { Calendar, Clock } from "lucide-react";
import { formatDate } from "../utils";
import type { DaysInfo } from "../types";
import type { PonderBooking } from "@/hooks/usePonderBookings";

interface StayDetailsProps {
  checkInDate: string;
  checkOutDate: string;
  daysInfo: DaysInfo;
  bookingStatus: PonderBooking["status"];
}

/**
 * Stay details section (dates and duration)
 */
export function StayDetails({
  checkInDate,
  checkOutDate,
  daysInfo,
  bookingStatus,
}: StayDetailsProps) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="mb-3 flex items-center gap-2 font-semibold">
        <Calendar className="h-4 w-4" />
        Stay Details
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">Check-in</p>
          <p className="font-semibold">{formatDate(checkInDate)}</p>
          <p className="text-muted-foreground text-xs">After 3:00 PM</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">Check-out</p>
          <p className="font-semibold">{formatDate(checkOutDate)}</p>
          <p className="text-muted-foreground text-xs">Before 11:00 AM</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <Clock className="text-muted-foreground h-4 w-4" />
        <span>
          {daysInfo.nights} night{daysInfo.nights !== 1 ? "s" : ""}
        </span>
        {bookingStatus !== "Completed" && bookingStatus !== "Cancelled" && (
          <>
            <span className="text-muted-foreground">•</span>
            <span className={daysInfo.isUrgent ? "font-medium text-red-500" : ""}>
              {daysInfo.checkInLabel}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
