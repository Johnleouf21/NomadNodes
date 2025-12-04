"use client";

import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface BookingData {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyImage?: string;
  guestAddress: string;
  checkIn: string | Date;
  checkOut: string | Date;
  total: number;
  escrowId?: string;
  status: "pending" | "active" | "completed" | "upcoming" | "cancelled";
}

interface BookingCardProps {
  booking: BookingData;
}

export function BookingCard({ booking }: BookingCardProps) {
  const { t } = useTranslation();

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    active: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    completed: "bg-green-500/10 text-green-700 dark:text-green-400",
    upcoming: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  // Format dates - handle both string and Date types
  const formatDate = (date: string | Date) => {
    if (typeof date === "string") return date;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {booking.propertyImage && (
            <div className="mr-4 h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
              <img
                src={booking.propertyImage}
                alt={booking.propertyName}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-semibold">{booking.propertyName}</h4>
              <Badge className={statusColors[booking.status] || statusColors.pending}>
                {t(`dashboard.${booking.status}`)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t("hero.check_in")}: </span>
                <span className="font-medium">{formatDate(booking.checkIn)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("hero.check_out")}: </span>
                <span className="font-medium">{formatDate(booking.checkOut)}</span>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">Guest: </span>
              <span className="font-mono text-xs">
                {booking.guestAddress.slice(0, 6)}...{booking.guestAddress.slice(-4)}
              </span>
            </div>
          </div>
          <div className="ml-4 text-right">
            <p className="text-muted-foreground text-xs">{t("booking.total")}</p>
            <p className="text-xl font-bold">${booking.total}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
