/**
 * Utility functions for ActivityHistory
 */

import {
  Calendar,
  Home,
  Star,
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
  Plane,
} from "lucide-react";
import type { UserActivity, DateFilterOption } from "@/lib/hooks/useUserProfile";
import type { PonderBooking } from "@/hooks/usePonderBookings";

export type ActivityType = UserActivity["type"];

/**
 * Get icon for activity type
 */
export function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "booking":
      return Calendar;
    case "review":
      return Star;
    case "listing":
      return Home;
    case "review_received":
      return MessageCircle;
    case "mint":
      return CheckCircle;
    default:
      return Calendar;
  }
}

/**
 * Get status badge config
 */
export function getStatusBadgeConfig(status: UserActivity["status"]) {
  const config = {
    completed: { variant: "default" as const, label: "Completed", icon: CheckCircle },
    upcoming: { variant: "secondary" as const, label: "Upcoming", icon: Clock },
    active: { variant: "outline" as const, label: "Active", icon: Plane },
    cancelled: { variant: "destructive" as const, label: "Cancelled", icon: XCircle },
  };

  return status ? config[status] : null;
}

/**
 * Get minimum timestamp for date filter
 */
export function getMinTimestamp(dateFilter: DateFilterOption): number {
  const now = Date.now();

  switch (dateFilter) {
    case "7d":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return now - 30 * 24 * 60 * 60 * 1000;
    case "90d":
      return now - 90 * 24 * 60 * 60 * 1000;
    case "1y":
      return now - 365 * 24 * 60 * 60 * 1000;
    case "all":
    default:
      return 0;
  }
}

/**
 * Filter bookings by date
 */
export function filterBookingsByDate(
  bookings: PonderBooking[],
  dateFilter: DateFilterOption
): PonderBooking[] {
  if (!bookings || bookings.length === 0) return [];

  const minTimestamp = getMinTimestamp(dateFilter);

  return bookings
    .filter((b) => Number(b.createdAt) * 1000 >= minTimestamp)
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
}

/**
 * Filter activities based on user's SBTs
 */
export function filterActivities(
  activities: UserActivity[],
  hasTravelerSBT: boolean
): UserActivity[] {
  return activities.filter((activity) => {
    if (activity.type === "booking" || activity.type === "review") {
      return hasTravelerSBT;
    }
    if (activity.type === "listing") {
      return false;
    }
    return true;
  });
}
