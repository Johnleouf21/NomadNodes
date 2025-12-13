"use client";

/**
 * useTravelerDashboard - Main hook for traveler dashboard
 *
 * Refactored from a 429-line hook into modular sub-hooks.
 */

import * as React from "react";
import { useUrlParams } from "./useUrlParams";
import { useModalState } from "./useModalState";
import { useBookingData } from "./useBookingData";
import { useReviewsData } from "./useReviewsData";
import { useStats } from "./useStats";
import { usePendingActions } from "./usePendingActions";
import type { BookingSummary } from "../../types";

/**
 * Combined hook for traveler dashboard
 */
export function useTravelerDashboard() {
  // URL parameters
  const { activeTab, setActiveTab, pastStatusFilter, setPastStatusFilter } = useUrlParams();

  // Modal state
  const {
    selectedBooking,
    setSelectedBooking,
    detailSheetOpen,
    setDetailSheetOpen,
    cancelModalOpen,
    setCancelModalOpen,
    roomModalOpen,
    setRoomModalOpen,
    reviewModalOpen,
    setReviewModalOpen,
    reviewsModalOpen,
    setReviewsModalOpen,
    messagingOpen,
    setMessagingOpen,
  } = useModalState();

  // Track bookings that were just reviewed
  const [justReviewedBookings, setJustReviewedBookings] = React.useState<Set<string>>(new Set());

  // Booking data
  const {
    address,
    bookings,
    upcomingBookings,
    pastBookings,
    loadingBookings,
    loadingProperties,
    refetchBookings,
  } = useBookingData();

  // Reviews data
  const {
    traveler,
    loadingTraveler,
    reviewsGiven,
    reviewsReceived,
    refetchReviewsGiven,
    calculatedAvgRating,
    nonFlaggedReviewCount,
    reviewedEscrowAddresses,
  } = useReviewsData({ address });

  // Stats
  const {
    pastBookingCounts,
    filteredPastBookings,
    totalSpent,
    totalNights,
    nextCheckIn,
    uniqueProperties,
    completedBookingsCount,
  } = useStats({
    bookings,
    upcomingBookings,
    pastBookings,
    pastStatusFilter,
  });

  // Pending actions
  const pendingActions = usePendingActions({
    bookings,
    reviewsGiven,
    justReviewedBookings,
  });

  // Loading state
  const isLoading = loadingBookings || loadingProperties || loadingTraveler;

  // Handlers
  const handleBookingClick = React.useCallback(
    (booking: BookingSummary) => {
      setSelectedBooking(booking);
      setDetailSheetOpen(true);
    },
    [setSelectedBooking, setDetailSheetOpen]
  );

  const handleCancelClick = React.useCallback(() => {
    setCancelModalOpen(true);
  }, [setCancelModalOpen]);

  const handleReviewClick = React.useCallback(() => {
    if (selectedBooking) {
      setDetailSheetOpen(false);
      setReviewModalOpen(true);
    }
  }, [selectedBooking, setDetailSheetOpen, setReviewModalOpen]);

  const handleRoomClick = React.useCallback(
    (booking: BookingSummary) => {
      setSelectedBooking(booking);
      setRoomModalOpen(true);
    },
    [setSelectedBooking, setRoomModalOpen]
  );

  const handleCancelSuccess = React.useCallback(() => {
    refetchBookings();
  }, [refetchBookings]);

  const handleReviewSuccess = React.useCallback(() => {
    if (selectedBooking) {
      setJustReviewedBookings((prev) => new Set([...prev, selectedBooking.id]));
    }
    refetchBookings();
    setTimeout(() => refetchReviewsGiven(), 2000);
  }, [selectedBooking, refetchBookings, refetchReviewsGiven]);

  const isBookingReviewed = React.useCallback(
    (booking: BookingSummary) => {
      if (!booking.escrowAddress) return false;
      return (
        reviewedEscrowAddresses.has(booking.escrowAddress.toLowerCase()) ||
        justReviewedBookings.has(booking.id)
      );
    },
    [reviewedEscrowAddresses, justReviewedBookings]
  );

  const getExistingReview = React.useCallback(
    (booking: BookingSummary | null) => {
      if (!booking) return null;
      return (
        reviewsGiven.find(
          (r) =>
            r.propertyId === booking.propertyId &&
            r.reviewee.toLowerCase() === booking.hostAddress?.toLowerCase()
        ) || null
      );
    },
    [reviewsGiven]
  );

  return {
    // Data
    address,
    traveler,
    bookings,
    upcomingBookings,
    pastBookings,
    filteredPastBookings,
    pastBookingCounts,
    pendingActions,
    reviewsGiven,
    reviewsReceived,
    calculatedAvgRating,
    nonFlaggedReviewCount,

    // Stats
    totalSpent,
    totalNights,
    nextCheckIn,
    uniqueProperties,
    completedBookingsCount,

    // State
    activeTab,
    setActiveTab,
    pastStatusFilter,
    setPastStatusFilter,
    selectedBooking,
    setSelectedBooking,
    detailSheetOpen,
    setDetailSheetOpen,
    cancelModalOpen,
    setCancelModalOpen,
    roomModalOpen,
    setRoomModalOpen,
    reviewModalOpen,
    setReviewModalOpen,
    reviewsModalOpen,
    setReviewsModalOpen,
    messagingOpen,
    setMessagingOpen,

    // Handlers
    handleBookingClick,
    handleCancelClick,
    handleReviewClick,
    handleRoomClick,
    handleCancelSuccess,
    handleReviewSuccess,
    isBookingReviewed,
    getExistingReview,
    refetchBookings,

    // Loading
    isLoading,
  };
}
