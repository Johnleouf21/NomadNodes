"use client";

/**
 * Host booking item display
 */

import * as React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/hooks/useUserProfile";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import { BOOKING_STATUS_CONFIG } from "../types";

interface HostBookingItemProps {
  booking: PonderBooking;
}

export function HostBookingItem({ booking }: HostBookingItemProps) {
  const statusConfig = BOOKING_STATUS_CONFIG[booking.status];
  const StatusIcon = statusConfig.icon;

  const checkIn = new Date(Number(booking.checkInDate) * 1000);
  const checkOut = new Date(Number(booking.checkOutDate) * 1000);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const total = Number(booking.totalPrice) / 1e6;

  return (
    <div className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-2.5 transition-colors">
      <div className={`shrink-0 rounded-full p-2 ${statusConfig.bgColor}`}>
        <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">Booking #{booking.bookingIndex}</p>
          <Badge variant={statusConfig.variant} className="gap-1 text-xs">
            {statusConfig.label}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-0.5 text-[11px]">
          {checkIn.toLocaleDateString()} - {checkOut.toLocaleDateString()} ({nights} night
          {nights !== 1 ? "s" : ""})
        </p>
        <div className="mt-1 flex items-center gap-3">
          <p className="text-muted-foreground text-[10px]">
            {formatRelativeTime(new Date(Number(booking.createdAt) * 1000))}
          </p>
          <span className="text-[10px] font-medium text-green-600">${total.toFixed(0)} USDC</span>
          <Link
            href={`/property/${booking.propertyId}`}
            className="text-primary inline-flex items-center gap-1 text-[10px] hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
