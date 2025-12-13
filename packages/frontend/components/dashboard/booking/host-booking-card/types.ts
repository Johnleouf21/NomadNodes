/**
 * Types for HostBookingCard
 */

import * as React from "react";
import { CheckCircle2, XCircle, Clock, LogIn } from "lucide-react";
import type { PonderBooking } from "@/hooks/usePonderBookings";

export interface HostBookingCardProps {
  booking: PonderBooking;
  propertyName: string;
  propertyImage?: string;
  roomTypeName?: string;
  currency?: "USD" | "EUR";
  onViewDetails: () => void;
  onConfirm?: () => void;
  onCheckIn?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  isActionPending?: boolean;
  travelerRating?: number;
  travelerReviewCount?: number;
  onTravelerRatingClick?: () => void;
}

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}

/**
 * Status configuration for booking states
 */
export const statusConfig: Record<PonderBooking["status"], StatusConfig> = {
  Pending: {
    label: "Pending",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10",
    icon: Clock,
  },
  Confirmed: {
    label: "Confirmed",
    color: "text-[#0F4C5C] dark:text-[#1A7A8A]",
    bgColor: "bg-[#0F4C5C]/10",
    icon: CheckCircle2,
  },
  CheckedIn: {
    label: "Checked In",
    color: "text-[#E36414] dark:text-[#E36414]",
    bgColor: "bg-[#E36414]/10",
    icon: LogIn,
  },
  Completed: {
    label: "Completed",
    color: "text-[#81B29A] dark:text-[#81B29A]",
    bgColor: "bg-[#81B29A]/10",
    icon: CheckCircle2,
  },
  Cancelled: {
    label: "Cancelled",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-500/10",
    icon: XCircle,
  },
};
