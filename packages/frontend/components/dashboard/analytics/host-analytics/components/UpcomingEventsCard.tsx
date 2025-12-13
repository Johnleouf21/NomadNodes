"use client";

import { Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import { formatDate, getDaysUntil } from "../utils";

interface UpcomingEventsCardProps {
  checkIns: PonderBooking[];
  checkOuts: PonderBooking[];
  getPropertyInfo: (booking: PonderBooking) => { name: string; imageUrl?: string };
  getRoomTypeInfo: (booking: PonderBooking) => { name: string; currency: "USD" | "EUR" };
}

/**
 * Upcoming check-ins and check-outs card
 */
export function UpcomingEventsCard({
  checkIns,
  checkOuts,
  getPropertyInfo,
  getRoomTypeInfo,
}: UpcomingEventsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
        <CardDescription>Check-ins and check-outs this week</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {checkIns.length === 0 && checkOuts.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No upcoming events</p>
        ) : (
          <>
            {checkIns.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  Check-ins
                </h4>
                <div className="space-y-2">
                  {checkIns.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 p-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{getPropertyInfo(booking).name}</p>
                        <p className="text-muted-foreground text-xs">
                          {getRoomTypeInfo(booking).name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(booking.checkInDate)}</p>
                        <p className="text-xs text-green-600">
                          {getDaysUntil(booking.checkInDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {checkOuts.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <ArrowDownRight className="h-4 w-4 text-blue-500" />
                  Check-outs
                </h4>
                <div className="space-y-2">
                  {checkOuts.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 p-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{getPropertyInfo(booking).name}</p>
                        <p className="text-muted-foreground text-xs">
                          {getRoomTypeInfo(booking).name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(booking.checkOutDate)}</p>
                        <p className="text-xs text-blue-600">
                          {getDaysUntil(booking.checkOutDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
