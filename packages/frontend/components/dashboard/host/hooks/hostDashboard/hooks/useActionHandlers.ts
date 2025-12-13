"use client";

/**
 * Hook to manage action handlers
 */

import * as React from "react";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import { CONTRACTS } from "@/lib/contracts";
import { toast } from "sonner";

interface UseActionHandlersProps {
  writeContract: (params: any) => void;
  setPendingAction: (action: string | null) => void;
  setPendingEscrowRelease: (booking: PonderBooking | null) => void;
  setSelectedBooking: (booking: PonderBooking | null) => void;
  setIsDetailSheetOpen: (open: boolean) => void;
  setCancelBooking: (booking: PonderBooking | null) => void;
  setIsReviewModalOpen: (open: boolean) => void;
  selectedBooking: PonderBooking | null;
}

interface UseActionHandlersReturn {
  handleCheckIn: (booking: PonderBooking) => void;
  handleComplete: (booking: PonderBooking) => void;
  handleOpenDetails: (booking: PonderBooking) => void;
  handleOpenCancel: (booking: PonderBooking) => void;
  handleReviewClick: () => void;
}

/**
 * Create action handlers for bookings
 */
export function useActionHandlers({
  writeContract,
  setPendingAction,
  setPendingEscrowRelease,
  setSelectedBooking,
  setIsDetailSheetOpen,
  setCancelBooking,
  setIsReviewModalOpen,
  selectedBooking,
}: UseActionHandlersProps): UseActionHandlersReturn {
  const handleCheckIn = React.useCallback(
    (booking: PonderBooking) => {
      setPendingAction(booking.id);
      if (booking.escrowAddress) {
        setPendingEscrowRelease(booking);
      }
      writeContract({
        ...CONTRACTS.bookingManager,
        functionName: "checkInBooking",
        args: [BigInt(booking.tokenId), BigInt(booking.bookingIndex)],
      });
      toast.info("Processing check-in...", {
        description: booking.escrowAddress
          ? "Step 1/2: Confirm check-in in your wallet"
          : "Please confirm in your wallet",
      });
    },
    [writeContract, setPendingAction, setPendingEscrowRelease]
  );

  const handleComplete = React.useCallback(
    (booking: PonderBooking) => {
      setPendingAction(booking.id);
      writeContract({
        ...CONTRACTS.bookingManager,
        functionName: "completeBooking",
        args: [BigInt(booking.tokenId), BigInt(booking.bookingIndex)],
      });
      toast.info("Completing booking...", {
        description: "Please confirm in your wallet",
      });
    },
    [writeContract, setPendingAction]
  );

  const handleOpenDetails = React.useCallback(
    (booking: PonderBooking) => {
      setSelectedBooking(booking);
      setIsDetailSheetOpen(true);
    },
    [setSelectedBooking, setIsDetailSheetOpen]
  );

  const handleOpenCancel = React.useCallback(
    (booking: PonderBooking) => {
      setCancelBooking(booking);
    },
    [setCancelBooking]
  );

  const handleReviewClick = React.useCallback(() => {
    if (selectedBooking) {
      setIsReviewModalOpen(true);
      setTimeout(() => setIsDetailSheetOpen(false), 100);
    }
  }, [selectedBooking, setIsReviewModalOpen, setIsDetailSheetOpen]);

  return {
    handleCheckIn,
    handleComplete,
    handleOpenDetails,
    handleOpenCancel,
    handleReviewClick,
  };
}
