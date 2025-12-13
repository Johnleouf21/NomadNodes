/**
 * Types and constants for ActivityHistory
 */

import { Clock, CheckCircle, XCircle, LogIn } from "lucide-react";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { DateFilterOption } from "@/lib/hooks/useUserProfile";

// Date filter labels
export const DATE_FILTER_LABELS: Record<DateFilterOption, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 3 months",
  "1y": "Last year",
  all: "All time",
};

export const DATE_FILTER_OPTIONS: DateFilterOption[] = ["7d", "30d", "90d", "1y", "all"];

// Status config for bookings
export const BOOKING_STATUS_CONFIG: Record<
  PonderBooking["status"],
  {
    variant: "default" | "secondary" | "outline" | "destructive";
    label: string;
    icon: typeof Clock;
    color: string;
    bgColor: string;
  }
> = {
  Pending: {
    variant: "secondary",
    label: "Pending",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
  },
  Confirmed: {
    variant: "outline",
    label: "Confirmed",
    icon: CheckCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  CheckedIn: {
    variant: "outline",
    label: "Checked In",
    icon: LogIn,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  Completed: {
    variant: "default",
    label: "Completed",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  Cancelled: {
    variant: "destructive",
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
  },
};
