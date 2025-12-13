"use client";

/**
 * Main useHostDashboard hook
 * Composes all sub-hooks to provide complete host dashboard functionality
 */

import * as React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePonderHostProperties } from "@/hooks/usePonderProperties";
import { usePonderBookings } from "@/hooks/usePonderBookings";
import { usePonderPropertiesWithMetadata } from "@/hooks/usePonderPropertiesWithMetadata";
import { usePonderReviews } from "@/hooks/usePonderReviews";

import { useUrlParams } from "./hooks/useUrlParams";
import { useTravelerProfiles } from "./hooks/useTravelerProfiles";
import { useRoomTypesData } from "./hooks/useRoomTypesData";
import { useBookingFilters } from "./hooks/useBookingFilters";
import { useBookingTransactions } from "./hooks/useBookingTransactions";
import { usePendingActions } from "./hooks/usePendingActions";
import { useActionHandlers } from "./hooks/useActionHandlers";
import { useModalState } from "./hooks/useModalState";

import type { UseHostDashboardReturn } from "./types";

/**
 * Main hook for the host dashboard
 * Provides all data, state, and actions needed for the host dashboard
 */
export function useHostDashboard(): UseHostDashboardReturn {
  const { address } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = React.useState("properties");

  // Fetch user's properties from Ponder
  const {
    properties: hostProperties,
    propertyIds,
    loading: isLoadingProperties,
  } = usePonderHostProperties(address);

  // Convert property IDs to strings for Ponder query
  const propertyIdStrings = React.useMemo(() => {
    return propertyIds?.map((id) => id.toString()) || [];
  }, [propertyIds]);

  // Fetch bookings for all host's properties
  const {
    bookings: ponderBookings,
    loading: loadingBookings,
    refetch: refetchBookings,
  } = usePonderBookings({
    propertyIds: propertyIdStrings.length > 0 ? propertyIdStrings : undefined,
  });

  // Fetch property metadata for booking display
  const { allProperties, loading: loadingPropertiesMetadata } = usePonderPropertiesWithMetadata({
    isActive: true,
    pageSize: 100,
  });

  // Fetch reviews left by the host
  const { reviews: hostReviews } = usePonderReviews({
    reviewerAddress: address,
  });

  // Use sub-hooks for state management
  const { travelerProfiles, getTravelerProfile } = useTravelerProfiles(ponderBookings);

  const { roomTypesMap, getRoomTypeInfo } = useRoomTypesData(propertyIdStrings);

  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    propertyFilter,
    setPropertyFilter,
    filteredBookings,
    bookingCounts,
    propertiesForFilter,
    getPropertyInfo,
  } = useBookingFilters({
    bookings: ponderBookings,
    allProperties,
    hostProperties,
  });

  // URL params
  useUrlParams(setActiveTab, setStatusFilter);

  // Modal state
  const modalState = useModalState(travelerProfiles);

  // Transaction handling
  const {
    writeContract,
    isWritePending,
    isTxLoading,
    setPendingAction,
    setPendingEscrowRelease,
    isActionPending,
  } = useBookingTransactions(refetchBookings);

  // Pending actions calculation
  const pendingActions = usePendingActions(ponderBookings, hostReviews);

  // Action handlers
  const { handleCheckIn, handleComplete, handleOpenDetails, handleOpenCancel, handleReviewClick } =
    useActionHandlers({
      writeContract,
      setPendingAction,
      setPendingEscrowRelease,
      setSelectedBooking: modalState.setSelectedBooking,
      setIsDetailSheetOpen: modalState.setIsDetailSheetOpen,
      setCancelBooking: modalState.setCancelBooking,
      setIsReviewModalOpen: modalState.setIsReviewModalOpen,
      selectedBooking: modalState.selectedBooking,
    });

  // Fetch reviews for selected traveler
  const { reviews: selectedTravelerReviewsReceived } = usePonderReviews({
    revieweeAddress: modalState.selectedTravelerAddress || undefined,
  });

  const { reviews: selectedTravelerReviewsGiven } = usePonderReviews({
    reviewerAddress: modalState.selectedTravelerAddress || undefined,
  });

  // Loading state
  const isLoading = isLoadingProperties;
  const isLoadingBookings = loadingBookings || loadingPropertiesMetadata;

  return {
    // Data
    address,
    hostProperties,
    ponderBookings,
    allProperties,
    filteredBookings,
    bookingCounts,
    pendingActions,
    propertiesForFilter,
    roomTypesMap,
    selectedTravelerProfile: modalState.selectedTravelerProfile,
    selectedTravelerReviewsReceived,
    selectedTravelerReviewsGiven,

    // State
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    propertyFilter,
    setPropertyFilter,
    selectedBooking: modalState.selectedBooking,
    setSelectedBooking: modalState.setSelectedBooking,
    isDetailSheetOpen: modalState.isDetailSheetOpen,
    setIsDetailSheetOpen: modalState.setIsDetailSheetOpen,
    cancelBooking: modalState.cancelBooking,
    setCancelBooking: modalState.setCancelBooking,
    isReviewModalOpen: modalState.isReviewModalOpen,
    setIsReviewModalOpen: modalState.setIsReviewModalOpen,
    isMessagingOpen: modalState.isMessagingOpen,
    setIsMessagingOpen: modalState.setIsMessagingOpen,
    messagingBooking: modalState.messagingBooking,
    setMessagingBooking: modalState.setMessagingBooking,
    travelerReviewsModalOpen: modalState.travelerReviewsModalOpen,
    setTravelerReviewsModalOpen: modalState.setTravelerReviewsModalOpen,
    selectedTravelerAddress: modalState.selectedTravelerAddress,
    setSelectedTravelerAddress: modalState.setSelectedTravelerAddress,

    // Helpers
    getPropertyInfo,
    getRoomTypeInfo,
    getTravelerProfile,

    // Actions
    handleCheckIn,
    handleComplete,
    handleOpenDetails,
    handleOpenCancel,
    handleReviewClick,
    refetchBookings,

    // Loading states
    isLoading,
    isLoadingBookings,
    isActionPending,
    isWritePending,
    isTxLoading,
  };
}
