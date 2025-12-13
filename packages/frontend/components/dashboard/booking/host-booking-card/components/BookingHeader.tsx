"use client";

/**
 * Booking card header with property info and status
 */

import { Badge } from "@/components/ui/badge";
import type { StatusConfig } from "../types";

interface BookingHeaderProps {
  propertyName: string;
  roomTypeName?: string;
  bookingIndex: string;
  status: StatusConfig;
}

/**
 * Header row with property name and status badge
 */
export function BookingHeader({
  propertyName,
  roomTypeName,
  bookingIndex,
  status,
}: BookingHeaderProps) {
  const StatusIcon = status.icon;

  return (
    <div className="mb-2 flex items-start justify-between">
      <div className="flex-1">
        <h3 className="leading-tight font-semibold">{propertyName}</h3>
        {roomTypeName && <p className="text-primary mt-0.5 text-sm font-medium">{roomTypeName}</p>}
        <p className="text-muted-foreground mt-0.5 text-xs">Booking #{bookingIndex}</p>
      </div>
      <Badge className={`${status.bgColor} ${status.color} flex items-center gap-1`}>
        <StatusIcon className="h-3 w-3" />
        {status.label}
      </Badge>
    </div>
  );
}
