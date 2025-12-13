/**
 * Types for Host Analytics
 */

import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { PropertyWithMetadata } from "@/hooks/usePonderPropertiesWithMetadata";

/**
 * Props for the main HostAnalytics component
 */
export interface HostAnalyticsProps {
  bookings: PonderBooking[];
  properties: PropertyWithMetadata[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roomTypesMap: Map<string, any>;
  getPropertyInfo: (booking: PonderBooking) => { name: string; imageUrl?: string };
  getRoomTypeInfo: (booking: PonderBooking) => { name: string; currency: "USD" | "EUR" };
}

/**
 * Time period for filtering analytics data
 */
export type TimePeriod = "7d" | "30d" | "90d" | "all";

/**
 * Revenue metrics calculation result
 */
export interface RevenueMetrics {
  totalRevenue: number;
  platformFee: number;
  netEarnings: number;
  avgBookingValue: number;
  byCurrency: { USD: number; EUR: number };
  completedCount: number;
}

/**
 * Booking metrics calculation result
 */
export interface BookingMetrics {
  total: number;
  pending: number;
  confirmed: number;
  checkedIn: number;
  completed: number;
  cancelled: number;
  conversionRate: string;
  cancellationRate: string;
}

/**
 * Property performance data
 */
export interface PropertyPerformance {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
  image?: string;
}

/**
 * Monthly analytics data
 */
export interface MonthlyData {
  month: string;
  bookings: number;
  revenue: number;
}
