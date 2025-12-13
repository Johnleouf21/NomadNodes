"use client";

import { Home, Calendar, XCircle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { BookingMetrics } from "../types";

interface QuickStatsFooterProps {
  propertiesCount: number;
  totalBookings: number;
  bookingMetrics: BookingMetrics;
}

/**
 * Quick stats footer card
 */
export function QuickStatsFooter({
  propertiesCount,
  totalBookings,
  bookingMetrics,
}: QuickStatsFooterProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Home className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground">Properties:</span>
            <span className="font-semibold">{propertiesCount}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground">Total Bookings:</span>
            <span className="font-semibold">{totalBookings}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-muted-foreground">Cancellation Rate:</span>
            <span className="font-semibold">{bookingMetrics.cancellationRate}%</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" />
            <span className="text-muted-foreground">Currently Hosted:</span>
            <span className="font-semibold">{bookingMetrics.checkedIn}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
