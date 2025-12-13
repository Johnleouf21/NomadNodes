import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { PonderRoomType } from "@/hooks/usePonderRoomTypes";
import type { PropertyWithMetadata } from "@/hooks/usePonderPropertiesWithMetadata";

// Extended room type with currency from IPFS metadata
export interface RoomTypeWithCurrency extends PonderRoomType {
  currency?: "USD" | "EUR";
}

// Traveler profile for displaying ratings on booking cards
export interface TravelerProfile {
  wallet: string;
  averageRating: number;
  totalReviewsReceived: number;
}

// Pending actions breakdown
export interface PendingActions {
  total: number;
  toConfirm: PonderBooking[];
  toCheckIn: PonderBooking[];
  toComplete: PonderBooking[];
  toReview: PonderBooking[];
}

// Property info for display
export interface PropertyInfo {
  name: string;
  imageUrl?: string;
}

// Room type info for display
export interface RoomTypeInfo {
  name: string;
  currency: "USD" | "EUR";
}

// Property for filter dropdown
export interface PropertyFilterOption {
  id: string;
  name: string;
}

// Booking counts by status
export interface BookingCounts {
  all: number;
  Pending: number;
  Confirmed: number;
  CheckedIn: number;
  Completed: number;
  Cancelled: number;
}

// Re-export commonly used types
export type { PonderBooking, PropertyWithMetadata };
