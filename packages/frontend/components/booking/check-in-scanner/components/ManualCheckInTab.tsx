"use client";

/**
 * Manual check-in tab showing user's bookings
 */

import { Calendar, Clock } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import { BookingCard } from "./BookingCard";

interface ManualCheckInTabProps {
  eligibleBookings: PonderBooking[];
  selectedBookingId: string | null;
  isPending: boolean;
  isTxLoading: boolean;
  isCheckInPending: boolean;
  isCheckInLoading: boolean;
  onConfirmCheckIn: (booking: {
    escrowAddress?: string | null;
    tokenId: string;
    bookingIndex: string;
  }) => void;
}

/**
 * Tab content for manual booking selection
 */
export function ManualCheckInTab({
  eligibleBookings,
  selectedBookingId,
  isPending,
  isTxLoading,
  isCheckInPending,
  isCheckInLoading,
  onConfirmCheckIn,
}: ManualCheckInTabProps) {
  return (
    <TabsContent value="manual" className="space-y-4">
      {eligibleBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="text-muted-foreground/50 mb-4 h-12 w-12" />
          <p className="text-muted-foreground mb-2">No bookings to check in today</p>
          <p className="text-muted-foreground text-sm">
            Check-in will be available on your booking date
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {eligibleBookings.map((booking) => {
            const isConfirming =
              selectedBookingId === booking.escrowAddress &&
              (isPending || isTxLoading || isCheckInPending || isCheckInLoading);

            return (
              <BookingCard
                key={booking.id}
                booking={booking}
                isConfirming={isConfirming}
                onConfirmCheckIn={onConfirmCheckIn}
              />
            );
          })}
        </div>
      )}

      <div className="text-muted-foreground border-t pt-4 text-sm">
        <p>
          <Clock className="mr-1 inline h-3.5 w-3.5" />
          You can confirm your arrival on the day of your check-in.
        </p>
      </div>
    </TabsContent>
  );
}
