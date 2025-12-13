"use client";

import { PieChart, Clock, CheckCircle2, Users, XCircle, LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { BookingMetrics } from "../types";

interface BookingStatusCardProps {
  bookingMetrics: BookingMetrics;
}

interface StatusItem {
  label: string;
  count: number;
  color: string;
  icon: LucideIcon;
}

/**
 * Booking status breakdown card
 */
export function BookingStatusCard({ bookingMetrics }: BookingStatusCardProps) {
  const statusItems: StatusItem[] = [
    { label: "Pending", count: bookingMetrics.pending, color: "bg-yellow-500", icon: Clock },
    {
      label: "Confirmed",
      count: bookingMetrics.confirmed,
      color: "bg-blue-500",
      icon: CheckCircle2,
    },
    { label: "Checked In", count: bookingMetrics.checkedIn, color: "bg-purple-500", icon: Users },
    {
      label: "Completed",
      count: bookingMetrics.completed,
      color: "bg-green-500",
      icon: CheckCircle2,
    },
    { label: "Cancelled", count: bookingMetrics.cancelled, color: "bg-red-500", icon: XCircle },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Booking Status
        </CardTitle>
        <CardDescription>Distribution of booking statuses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusItems.map((item) => {
          const percentage =
            bookingMetrics.total > 0 ? (item.count / bookingMetrics.total) * 100 : 0;
          const Icon = item.icon;
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${item.color.replace("bg-", "text-")}`} />
                  <span>{item.label}</span>
                </div>
                <span className="font-medium">{item.count}</span>
              </div>
              <Progress value={percentage} className={`h-2 ${item.color}`} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
