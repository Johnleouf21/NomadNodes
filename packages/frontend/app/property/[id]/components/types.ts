import type { RoomTypeWithMeta_data } from "@/hooks/usePonderRoomTypes";
import type { DateRange } from "react-day-picker";

/**
 * Room type with availability status
 */
export interface RoomTypeWithAvailability extends RoomTypeWithMeta_data {
  isAvailable: boolean;
}

/**
 * Props for PonderRoomTypeCard
 */
export interface PonderRoomTypeCardProps {
  roomType: RoomTypeWithMeta_data;
  propertyId: string;
  isAvailable?: boolean;
}

/**
 * Props for PropertyHeader
 */
export interface PropertyHeaderProps {
  propertyId: bigint;
  isOwner: boolean;
}

/**
 * Props for PropertySidebar
 */
export interface PropertySidebarProps {
  propertyId: bigint;
  averageRating: number;
  totalReviews: number;
  totalBookings: number;
  totalRoomUnits: number;
  fullAddress: string;
  hostWallet: string;
  createdAt: bigint;
  lastBookingTimestamp?: bigint;
  ipfsHash?: string;
  onReviewsClick: () => void;
}

/**
 * Props for RoomTypesSection
 */
export interface RoomTypesSectionProps {
  roomTypes: RoomTypeWithAvailability[];
  propertyId: bigint;
  totalRoomUnits: number;
  isLoading: boolean;
  isLoadingAvailability: boolean;
  hasUserDateFilters: boolean;
  availableRoomTypesCount: number;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  guests: number;
  onGuestsChange: (guests: number) => void;
  calendarAvailableDates: Set<string>;
  calendarUnavailableDates: Set<string>;
  isLoadingCalendarAvailability: boolean;
}
