"use client";

/**
 * ActivityHistory component - displays user activity timeline
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import type { DateFilterOption } from "@/lib/hooks/useUserProfile";

import { useActivityData } from "./hooks";
import { ActivityHeader, HostBookingItem, ActivityItem, EmptyState } from "./components";

export function ActivityHistory() {
  const { t } = useTranslation();
  const [dateFilter, setDateFilter] = React.useState<DateFilterOption>("30d");
  const [showAll, setShowAll] = React.useState(false);

  const { filteredActivities, filteredHostBookings, isLoading, isHostView, totalCount } =
    useActivityData(dateFilter);

  // Show only first 5 unless expanded
  const displayedActivities = showAll ? filteredActivities : filteredActivities.slice(0, 5);
  const displayedHostBookings = showAll ? filteredHostBookings : filteredHostBookings.slice(0, 5);

  // Check if there are more items to show
  const hasMore = isHostView ? filteredHostBookings.length > 5 : filteredActivities.length > 5;
  const remainingCount = isHostView
    ? filteredHostBookings.length - 5
    : filteredActivities.length - 5;

  if (isLoading) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="text-primary h-5 w-5" />
            {isHostView ? "Bookings Received" : t("profile.activity_history")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <ActivityHeader
        isHostView={isHostView}
        totalCount={totalCount}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
      />

      <CardContent className="pt-0">
        <ScrollArea className={showAll ? "h-[350px]" : "h-[280px]"}>
          <div className="grid gap-2">
            {isHostView ? (
              displayedHostBookings.length > 0 ? (
                displayedHostBookings.map((booking) => (
                  <HostBookingItem key={booking.id} booking={booking} />
                ))
              ) : (
                <EmptyState isHostView={true} />
              )
            ) : displayedActivities.length > 0 ? (
              displayedActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <EmptyState isHostView={false} />
            )}
          </div>
        </ScrollArea>

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <ChevronUp className="mr-1 h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-4 w-4" />
                Show {remainingCount} more
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
