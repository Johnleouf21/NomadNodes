"use client";

/**
 * PlatformOverviewTab - Admin platform overview dashboard
 */

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import type { PlatformOverviewTabProps } from "./types";
import {
  MainStatsGrid,
  BookingStatusCard,
  HostTiersCard,
  TravelerTiersCard,
  ModerationCard,
  RevenueSummaryCard,
  RecentActivityCard,
} from "./components";

export function PlatformOverviewTab({
  stats,
  isLoading,
  pendingReviews,
  totalReviews,
}: PlatformOverviewTabProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-12">
          <Loader2 className="text-muted-foreground mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground">Loading platform statistics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <MainStatsGrid stats={stats} />

      {/* Secondary Stats - 4 columns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BookingStatusCard stats={stats} />
        <HostTiersCard stats={stats} />
        <TravelerTiersCard stats={stats} />
        <ModerationCard stats={stats} pendingReviews={pendingReviews} totalReviews={totalReviews} />
      </div>

      {/* Revenue & Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueSummaryCard stats={stats} />
        <RecentActivityCard />
      </div>
    </div>
  );
}
