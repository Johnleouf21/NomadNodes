"use client";

/**
 * Individual booking card for check-in
 */

import { Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PonderBooking } from "@/hooks/usePonderBookings";

interface BookingCardProps {
  booking: PonderBooking;
  isConfirming: boolean;
  onConfirmCheckIn: (booking: {
    escrowAddress?: string | null;
    tokenId: string;
    bookingIndex: string;
  }) => void;
}

/**
 * Display a booking with check-in action
 */
export function BookingCard({ booking, isConfirming, onConfirmCheckIn }: BookingCardProps) {
  const checkIn = new Date(Number(booking.checkInDate) * 1000);
  const checkOut = new Date(Number(booking.checkOutDate) * 1000);
  const isAlreadyCheckedIn = booking.status === "CheckedIn";

  return (
    <div className="hover:bg-muted/50 rounded-lg border p-4 transition-colors">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="font-semibold">Property #{booking.propertyId}</p>
          <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {checkIn.toLocaleDateString()} - {checkOut.toLocaleDateString()}
            </span>
          </div>
        </div>
        <Badge
          className={
            isAlreadyCheckedIn
              ? "border-purple-500/30 bg-purple-500/10 text-purple-700"
              : "border-blue-500/30 bg-blue-500/10 text-blue-700"
          }
        >
          {booking.status}
        </Badge>
      </div>

      {isAlreadyCheckedIn ? (
        <div className="bg-muted/50 flex items-center gap-2 rounded-md p-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>Already checked in</span>
        </div>
      ) : booking.escrowAddress ? (
        <Button
          onClick={() => onConfirmCheckIn(booking)}
          disabled={isConfirming}
          className="w-full"
          size="sm"
        >
          {isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirm My Arrival
            </>
          )}
        </Button>
      ) : (
        <p className="text-muted-foreground text-sm">Escrow not available for this booking</p>
      )}
    </div>
  );
}
