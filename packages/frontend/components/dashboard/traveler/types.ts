import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { Address } from "viem";

// Booking summary for display
export interface BookingSummary {
  id: string;
  propertyId: string;
  propertyName: string;
  roomTypeId: string;
  roomName: string;
  tokenId: string;
  bookingIndex: string;
  location: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  total: number;
  currency?: "USD" | "EUR";
  status: "upcoming" | "past" | "cancelled";
  ponderStatus: PonderBooking["status"];
  image: string;
  escrowAddress: string | null;
  hostAddress: Address | null;
  travelerAddress: Address;
}

// Room type info from Ponder
export interface RoomTypeInfo {
  id: string;
  tokenId: string;
  propertyId: string;
  name: string;
  ipfsHash?: string;
  currency?: "USD" | "EUR";
}

// Status filter type for past bookings
export type PastBookingStatusFilter = "all" | "Completed" | "Cancelled";

// Pending actions for travelers
export interface TravelerPendingActions {
  total: number;
  toConfirmArrival: BookingSummary[];
  toCompleteOrReview: BookingSummary[];
  checkInsToday: BookingSummary[];
}

// Past booking counts by status
export interface PastBookingCounts {
  all: number;
  Completed: number;
  Cancelled: number;
}

// Re-export commonly used types
export type { PonderBooking };
