"use client";

import { Home, BedDouble, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BookingDetailData, StatusConfig } from "../types";

interface PropertyHeaderProps {
  booking: BookingDetailData;
  statusConfig: StatusConfig;
}

/**
 * Property image and basic info header
 */
export function PropertyHeader({ booking, statusConfig }: PropertyHeaderProps) {
  return (
    <>
      {/* Property Image */}
      <div className="relative overflow-hidden rounded-lg">
        {booking.image ? (
          <img
            src={booking.image}
            alt={booking.propertyName}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="bg-muted flex h-48 w-full items-center justify-center">
            <Home className="text-muted-foreground/30 h-16 w-16" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className={`${statusConfig.color} border`}>{statusConfig.label}</Badge>
        </div>
      </div>

      {/* Property & Room Info */}
      <div>
        <h3 className="text-xl font-bold">{booking.propertyName}</h3>
        <div className="text-primary mt-2 flex items-center gap-2">
          <BedDouble className="h-4 w-4" />
          <span className="font-medium">{booking.roomName}</span>
        </div>
        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          <span>{booking.location}</span>
        </div>
      </div>
    </>
  );
}
