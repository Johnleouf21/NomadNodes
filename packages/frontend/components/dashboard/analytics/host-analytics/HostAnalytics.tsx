"use client";

import * as React from "react";
import type { HostAnalyticsProps, TimePeriod } from "./types";
import {
  useFilteredBookings,
  useRevenueMetrics,
  useBookingMetrics,
  usePropertyPerformance,
  useUpcomingEvents,
  useMonthlyData,
} from "./hooks";
import {
  PeriodSelector,
  RevenueCards,
  BookingStatusCard,
  MonthlyOverviewCard,
  PropertyPerformanceCard,
  UpcomingEventsCard,
  QuickStatsFooter,
} from "./components";

/**
 * Host analytics dashboard component
 * Displays revenue metrics, booking statistics, and performance data
 */
export function HostAnalytics({
  bookings,
  properties,
  roomTypesMap: _roomTypesMap,
  getPropertyInfo,
  getRoomTypeInfo,
}: HostAnalyticsProps) {
  const [period, setPeriod] = React.useState<TimePeriod>("30d");

  // Calculate metrics using hooks
  const filteredBookings = useFilteredBookings(bookings, period);
  const revenueMetrics = useRevenueMetrics(filteredBookings, getRoomTypeInfo);
  const bookingMetrics = useBookingMetrics(filteredBookings);
  const propertyPerformance = usePropertyPerformance(filteredBookings, getPropertyInfo);
  const { checkIns, checkOuts } = useUpcomingEvents(bookings);
  const monthlyData = useMonthlyData(bookings);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <PeriodSelector period={period} onPeriodChange={setPeriod} />

      {/* Revenue Cards */}
      <RevenueCards revenueMetrics={revenueMetrics} bookingMetrics={bookingMetrics} />

      {/* Booking Status & Monthly Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <BookingStatusCard bookingMetrics={bookingMetrics} />
        <MonthlyOverviewCard monthlyData={monthlyData} />
      </div>

      {/* Property Performance & Upcoming Events */}
      <div className="grid gap-4 md:grid-cols-2">
        <PropertyPerformanceCard propertyPerformance={propertyPerformance} />
        <UpcomingEventsCard
          checkIns={checkIns}
          checkOuts={checkOuts}
          getPropertyInfo={getPropertyInfo}
          getRoomTypeInfo={getRoomTypeInfo}
        />
      </div>

      {/* Quick Stats Footer */}
      <QuickStatsFooter
        propertiesCount={properties.length}
        totalBookings={bookings.length}
        bookingMetrics={bookingMetrics}
      />
    </div>
  );
}
