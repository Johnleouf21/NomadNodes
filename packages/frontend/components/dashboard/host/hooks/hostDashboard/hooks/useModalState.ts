"use client";

/**
 * Hook to manage modal and sheet state
 */

import * as React from "react";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { TravelerProfile } from "../../../types";

interface UseModalStateReturn {
  // Booking detail sheet
  selectedBooking: PonderBooking | null;
  setSelectedBooking: (booking: PonderBooking | null) => void;
  isDetailSheetOpen: boolean;
  setIsDetailSheetOpen: (open: boolean) => void;

  // Cancel booking modal
  cancelBooking: PonderBooking | null;
  setCancelBooking: (booking: PonderBooking | null) => void;

  // Review modal
  isReviewModalOpen: boolean;
  setIsReviewModalOpen: (open: boolean) => void;

  // Messaging modal
  isMessagingOpen: boolean;
  setIsMessagingOpen: (open: boolean) => void;
  messagingBooking: PonderBooking | null;
  setMessagingBooking: (booking: PonderBooking | null) => void;

  // Traveler reviews modal
  travelerReviewsModalOpen: boolean;
  setTravelerReviewsModalOpen: (open: boolean) => void;
  selectedTravelerAddress: string | null;
  setSelectedTravelerAddress: (address: string | null) => void;
}

/**
 * Manage all modal and sheet state
 */
export function useModalState(
  travelerProfiles: Map<string, TravelerProfile>
): UseModalStateReturn & {
  selectedTravelerProfile: TravelerProfile | null;
} {
  // Booking detail sheet
  const [selectedBooking, setSelectedBooking] = React.useState<PonderBooking | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = React.useState(false);

  // Cancel booking modal
  const [cancelBooking, setCancelBooking] = React.useState<PonderBooking | null>(null);

  // Review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);

  // Messaging modal
  const [isMessagingOpen, setIsMessagingOpen] = React.useState(false);
  const [messagingBooking, setMessagingBooking] = React.useState<PonderBooking | null>(null);

  // Traveler reviews modal
  const [travelerReviewsModalOpen, setTravelerReviewsModalOpen] = React.useState(false);
  const [selectedTravelerAddress, setSelectedTravelerAddress] = React.useState<string | null>(null);

  // Selected traveler profile
  const selectedTravelerProfile = React.useMemo(() => {
    if (!selectedTravelerAddress) return null;
    return travelerProfiles.get(selectedTravelerAddress.toLowerCase()) || null;
  }, [selectedTravelerAddress, travelerProfiles]);

  return {
    selectedBooking,
    setSelectedBooking,
    isDetailSheetOpen,
    setIsDetailSheetOpen,
    cancelBooking,
    setCancelBooking,
    isReviewModalOpen,
    setIsReviewModalOpen,
    isMessagingOpen,
    setIsMessagingOpen,
    messagingBooking,
    setMessagingBooking,
    travelerReviewsModalOpen,
    setTravelerReviewsModalOpen,
    selectedTravelerAddress,
    setSelectedTravelerAddress,
    selectedTravelerProfile,
  };
}
