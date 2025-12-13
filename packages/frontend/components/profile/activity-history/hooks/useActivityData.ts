"use client";

/**
 * Hook for fetching and processing activity data
 */

import * as React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  useUserActivityTimeline,
  useUserProperties,
  type DateFilterOption,
} from "@/lib/hooks/useUserProfile";
import { usePonderBookings } from "@/hooks/usePonderBookings";
import { filterBookingsByDate, filterActivities } from "../utils";

export function useActivityData(dateFilter: DateFilterOption) {
  const { address, hasTravelerSBT, hasHostSBT } = useAuth();

  // Fetch activities
  const { activities, isLoading: isActivitiesLoading } = useUserActivityTimeline(
    address,
    dateFilter
  );

  // Fetch properties for host to get bookings received
  const { data: properties = [], isLoading: isPropertiesLoading } = useUserProperties(address);

  // Get property IDs for host bookings query
  const propertyIds = React.useMemo(() => {
    return properties.map((p) => p.propertyId);
  }, [properties]);

  // Fetch bookings received by host
  const { bookings: hostBookingsReceived, loading: isHostBookingsLoading } = usePonderBookings({
    propertyIds: hasHostSBT && propertyIds.length > 0 ? propertyIds : undefined,
  });

  // Filter host bookings by date
  const filteredHostBookings = React.useMemo(() => {
    return filterBookingsByDate(hostBookingsReceived, dateFilter);
  }, [hostBookingsReceived, dateFilter]);

  // Filter activities based on user's SBTs
  const filteredActivities = React.useMemo(() => {
    return filterActivities(activities, hasTravelerSBT);
  }, [activities, hasTravelerSBT]);

  // Determine if this is host view
  const isHostView = hasHostSBT && propertyIds.length > 0;

  // Loading state
  const isLoading =
    isActivitiesLoading || (hasHostSBT && (isPropertiesLoading || isHostBookingsLoading));

  // Total count for badge
  const totalCount = isHostView ? filteredHostBookings.length : filteredActivities.length;

  return {
    filteredActivities,
    filteredHostBookings,
    isLoading,
    isHostView,
    totalCount,
    hasTravelerSBT,
  };
}
