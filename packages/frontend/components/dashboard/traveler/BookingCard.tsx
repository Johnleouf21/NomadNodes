"use client";

import { Calendar, MapPin, Star, Home, BedDouble, Eye, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { BookingSummary } from "./types";

interface BookingCardProps {
  booking: BookingSummary;
  onClick: () => void;
  onRoomClick: () => void;
  isReviewed?: boolean;
}

const ponderStatusColors: Record<PonderBooking["status"], string> = {
  Pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  Confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  CheckedIn: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
  Completed: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
  Cancelled: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
};

export function BookingCard({ booking, onClick, onRoomClick, isReviewed }: BookingCardProps) {
  // Calculate days until check-in
  const daysUntilCheckIn = Math.ceil(
    (booking.checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isUpcoming = booking.status === "upcoming";

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
      onClick={onClick}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="bg-muted relative h-48 w-full overflow-hidden md:h-auto md:w-56">
          {booking.image ? (
            <img
              src={booking.image}
              alt={booking.propertyName}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Home className="text-muted-foreground/50 h-12 w-12" />
            </div>
          )}
          {isUpcoming && daysUntilCheckIn > 0 && daysUntilCheckIn <= 7 && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-primary text-primary-foreground">
                {daysUntilCheckIn} day{daysUntilCheckIn > 1 ? "s" : ""} left
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4 md:p-6">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold">{booking.propertyName}</h3>
              <button
                className="text-primary mt-1 flex items-center gap-1.5 text-sm hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  onRoomClick();
                }}
              >
                <BedDouble className="h-3.5 w-3.5" />
                <span>{booking.roomName}</span>
                <Eye className="h-3 w-3 opacity-60" />
              </button>
              <div className="text-muted-foreground mt-1 flex items-center text-sm">
                <MapPin className="mr-1 h-3.5 w-3.5" />
                <span className="truncate">{booking.location}</span>
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-1">
              <Badge className={`${ponderStatusColors[booking.ponderStatus]} border`}>
                {booking.ponderStatus}
              </Badge>
              {booking.ponderStatus === "Completed" && (
                <Badge
                  variant="outline"
                  className={
                    isReviewed
                      ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                      : "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                  }
                >
                  {isReviewed ? (
                    <>
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      Reviewed
                    </>
                  ) : (
                    <>
                      <Star className="mr-1 h-3 w-3" />
                      Leave Review
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="mb-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span>{booking.checkIn.toLocaleDateString()}</span>
              <span className="text-muted-foreground">-</span>
              <span>{booking.checkOut.toLocaleDateString()}</span>
            </div>
            <span className="text-muted-foreground">({booking.nights} nights)</span>
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold">${booking.total.toFixed(2)}</span>
              <span className="text-muted-foreground text-sm">USDC</span>
            </div>
            <Button variant="ghost" size="sm" className="group-hover:bg-primary/10">
              View Details
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
