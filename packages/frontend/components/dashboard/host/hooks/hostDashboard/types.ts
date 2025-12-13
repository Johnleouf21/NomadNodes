/**
 * Types for useHostDashboard hook
 */

import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { PropertyWithMetadata } from "@/hooks/usePonderPropertiesWithMetadata";
import type {
  RoomTypeWithCurrency,
  TravelerProfile,
  PendingActions,
  PropertyInfo,
  RoomTypeInfo,
  PropertyFilterOption,
  BookingCounts,
} from "../../types";
import type { BookingStatusFilter, SortOption } from "../../../booking";

/**
 * Modal/Sheet state
 */
export interface ModalState {
  selectedBooking: PonderBooking | null;
  isDetailSheetOpen: boolean;
  cancelBooking: PonderBooking | null;
  isReviewModalOpen: boolean;
  isMessagingOpen: boolean;
  messagingBooking: PonderBooking | null;
  travelerReviewsModalOpen: boolean;
  selectedTravelerAddress: string | null;
}

/**
 * Filter state
 */
export interface FilterState {
  statusFilter: BookingStatusFilter;
  searchQuery: string;
  sortBy: SortOption;
  propertyFilter: string;
}

/**
 * Action state
 */
export interface ActionState {
  pendingAction: string | null;
  pendingEscrowRelease: PonderBooking | null;
}

/**
 * Return type for useHostDashboard
 */
export interface UseHostDashboardReturn {
  // Data
  address: string | undefined;
  hostProperties: any;
  ponderBookings: PonderBooking[] | undefined;
  allProperties: PropertyWithMetadata[];
  filteredBookings: PonderBooking[];
  bookingCounts: BookingCounts;
  pendingActions: PendingActions;
  propertiesForFilter: PropertyFilterOption[];
  roomTypesMap: Map<string, RoomTypeWithCurrency>;
  selectedTravelerProfile: TravelerProfile | null;
  selectedTravelerReviewsReceived: any[];
  selectedTravelerReviewsGiven: any[];

  // State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  statusFilter: BookingStatusFilter;
  setStatusFilter: (filter: BookingStatusFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  propertyFilter: string;
  setPropertyFilter: (filter: string) => void;
  selectedBooking: PonderBooking | null;
  setSelectedBooking: (booking: PonderBooking | null) => void;
  isDetailSheetOpen: boolean;
  setIsDetailSheetOpen: (open: boolean) => void;
  cancelBooking: PonderBooking | null;
  setCancelBooking: (booking: PonderBooking | null) => void;
  isReviewModalOpen: boolean;
  setIsReviewModalOpen: (open: boolean) => void;
  isMessagingOpen: boolean;
  setIsMessagingOpen: (open: boolean) => void;
  messagingBooking: PonderBooking | null;
  setMessagingBooking: (booking: PonderBooking | null) => void;
  travelerReviewsModalOpen: boolean;
  setTravelerReviewsModalOpen: (open: boolean) => void;
  selectedTravelerAddress: string | null;
  setSelectedTravelerAddress: (address: string | null) => void;

  // Helpers
  getPropertyInfo: (booking: PonderBooking) => PropertyInfo;
  getRoomTypeInfo: (booking: PonderBooking) => RoomTypeInfo;
  getTravelerProfile: (address: string) => TravelerProfile | undefined;

  // Actions
  handleCheckIn: (booking: PonderBooking) => void;
  handleComplete: (booking: PonderBooking) => void;
  handleOpenDetails: (booking: PonderBooking) => void;
  handleOpenCancel: (booking: PonderBooking) => void;
  handleReviewClick: () => void;
  refetchBookings: () => void;

  // Loading states
  isLoading: boolean;
  isLoadingBookings: boolean;
  isActionPending: (bookingId: string) => boolean;
  isWritePending: boolean;
  isTxLoading: boolean;
}

// Re-export types used by consumers
export type { BookingStatusFilter, SortOption };
