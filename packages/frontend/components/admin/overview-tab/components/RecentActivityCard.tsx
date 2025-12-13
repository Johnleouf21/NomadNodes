"use client";

/**
 * Recent activity card component
 */

import { Calendar, Layers, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRecentBookings } from "@/lib/hooks/contracts/useAdminPlatform";

export function RecentActivityCard() {
  const { data: recentBookings, isLoading } = useRecentBookings(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest bookings on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !recentBookings?.length ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No recent bookings</p>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <BookingItem key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BookingItemProps {
  booking: {
    id: string;
    propertyId: string;
    traveler: string;
    status: string;
    totalPrice: string;
  };
}

function BookingItem({ booking }: BookingItemProps) {
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "Completed":
        return "default";
      case "Cancelled":
        return "destructive";
      case "CheckedIn":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium">Property #{booking.propertyId}</p>
          <p className="text-muted-foreground text-xs">
            {booking.traveler.slice(0, 6)}...{booking.traveler.slice(-4)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <Badge variant={getBadgeVariant(booking.status)}>{booking.status}</Badge>
        <p className="text-muted-foreground mt-1 text-xs">
          ${(Number(booking.totalPrice) / 1e6).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
