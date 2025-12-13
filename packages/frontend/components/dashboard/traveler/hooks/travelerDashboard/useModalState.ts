"use client";

/**
 * Hook for modal state management
 */

import * as React from "react";
import type { BookingSummary } from "../../types";

/**
 * Manage all modal states
 */
export function useModalState() {
  const [selectedBooking, setSelectedBooking] = React.useState<BookingSummary | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = React.useState(false);
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
  const [roomModalOpen, setRoomModalOpen] = React.useState(false);
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = React.useState(false);
  const [messagingOpen, setMessagingOpen] = React.useState(false);

  return {
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
  };
}
