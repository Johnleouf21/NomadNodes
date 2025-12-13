"use client";

import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyData } from "../types";

interface MonthlyOverviewCardProps {
  monthlyData: MonthlyData[];
}

/**
 * Monthly overview chart card
 */
export function MonthlyOverviewCard({ monthlyData }: MonthlyOverviewCardProps) {
  const maxRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Monthly Overview
        </CardTitle>
        <CardDescription>Bookings and revenue by month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {monthlyData.map((month) => {
            const percentage = (month.revenue / maxRevenue) * 100;
            return (
              <div key={month.month} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{month.month}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{month.bookings} bookings</span>
                    <span className="font-semibold">{month.revenue.toFixed(0)} stables</span>
                  </div>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
