"use client";

import { Hash, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "../utils";
import type { PonderBooking } from "@/hooks/usePonderBookings";

interface BookingReferenceProps {
  booking: PonderBooking;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

/**
 * Booking reference section
 */
export function BookingReference({ booking, copiedField, onCopy }: BookingReferenceProps) {
  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Hash className="h-4 w-4" />
        Booking Reference
      </h4>
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Booking ID</span>
          <div className="flex items-center gap-1">
            <code className="bg-muted rounded px-1.5 py-0.5 font-mono">
              {booking.id.slice(0, 16)}...
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onCopy(booking.id, "bookingId")}
            >
              {copiedField === "bookingId" ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Token ID</span>
          <span className="font-mono">{booking.tokenId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Index</span>
          <span className="font-mono">{booking.bookingIndex}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Created</span>
          <span>{formatDateTime(booking.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
