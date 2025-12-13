"use client";

/**
 * Booking status card component
 */

import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusRow } from "./StatusRow";
import type { PlatformStats } from "../types";

interface BookingStatusCardProps {
  stats: PlatformStats | undefined;
}

export function BookingStatusCard({ stats }: BookingStatusCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          Bookings Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <StatusRow label="Pending" value={stats?.bookings.pending || 0} color="bg-yellow-500" />
        <StatusRow label="Confirmed" value={stats?.bookings.confirmed || 0} color="bg-blue-500" />
        <StatusRow
          label="Checked In"
          value={stats?.bookings.checkedIn || 0}
          color="bg-purple-500"
        />
        <StatusRow label="Completed" value={stats?.bookings.completed || 0} color="bg-green-500" />
        <StatusRow label="Cancelled" value={stats?.bookings.cancelled || 0} color="bg-red-500" />
      </CardContent>
    </Card>
  );
}
