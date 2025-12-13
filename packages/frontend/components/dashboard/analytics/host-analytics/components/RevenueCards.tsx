"use client";

import { DollarSign, TrendingUp, BarChart3, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RevenueMetrics, BookingMetrics } from "../types";

interface RevenueCardsProps {
  revenueMetrics: RevenueMetrics;
  bookingMetrics: BookingMetrics;
}

/**
 * Revenue and key metrics cards
 */
export function RevenueCards({ revenueMetrics, bookingMetrics }: RevenueCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{revenueMetrics.totalRevenue.toFixed(2)}</div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <span>stables</span>
            {revenueMetrics.byCurrency.USD > 0 && (
              <Badge variant="outline" className="text-xs">
                {revenueMetrics.byCurrency.USD.toFixed(0)} USDC
              </Badge>
            )}
            {revenueMetrics.byCurrency.EUR > 0 && (
              <Badge variant="outline" className="text-xs">
                {revenueMetrics.byCurrency.EUR.toFixed(0)} EURC
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {revenueMetrics.netEarnings.toFixed(2)}
          </div>
          <p className="text-muted-foreground text-xs">
            After {revenueMetrics.platformFee.toFixed(2)} platform fee (5%)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Booking Value</CardTitle>
          <BarChart3 className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{revenueMetrics.avgBookingValue.toFixed(2)}</div>
          <p className="text-muted-foreground text-xs">
            From {revenueMetrics.completedCount} completed bookings
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <Activity className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{bookingMetrics.conversionRate}%</div>
          <p className="text-muted-foreground text-xs">
            {bookingMetrics.completed} completed of {bookingMetrics.total} total
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
