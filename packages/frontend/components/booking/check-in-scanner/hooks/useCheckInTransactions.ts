"use client";

/**
 * Hook to manage check-in contract transactions
 */

import * as React from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { CONTRACTS } from "@/lib/contracts";
import { useInvalidateQueries } from "@/hooks/useInvalidateQueries";
import { ESCROW_ABI, type PendingCheckIn } from "../types";

interface UseCheckInTransactionsProps {
  pendingBookingForCheckIn: PendingCheckIn | null;
  setPendingBookingForCheckIn: (booking: PendingCheckIn | null) => void;
  setSelectedBookingId: (id: string | null) => void;
  onReset: () => void;
  onRefetch: () => void;
}

/**
 * Contract interactions for check-in flow
 */
export function useCheckInTransactions({
  pendingBookingForCheckIn,
  setPendingBookingForCheckIn,
  setSelectedBookingId,
  onReset,
  onRefetch,
}: UseCheckInTransactionsProps) {
  const { invalidateAfterBooking } = useInvalidateQueries();

  // Confirm stay mutation (escrow)
  const { writeContract, data: txHash, isPending, error: txError } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // CheckIn booking mutation (BookingManager)
  const {
    writeContract: writeCheckIn,
    data: checkInTxHash,
    isPending: isCheckInPending,
    error: checkInTxError,
  } = useWriteContract();

  const { isLoading: isCheckInLoading, isSuccess: isCheckInSuccess } = useWaitForTransactionReceipt(
    {
      hash: checkInTxHash,
    }
  );

  // Handle confirm check-in action
  const handleConfirmCheckIn = React.useCallback(
    (booking: { escrowAddress?: string | null; tokenId: string; bookingIndex: string }) => {
      if (!booking.escrowAddress) return;

      setPendingBookingForCheckIn({
        tokenId: booking.tokenId,
        bookingIndex: booking.bookingIndex,
      });

      writeContract({
        address: booking.escrowAddress as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "confirmStay",
      });

      setSelectedBookingId(booking.escrowAddress);

      toast.info("Processing check-in...", {
        description: "Step 1/2: Confirm payment release",
      });
    },
    [writeContract, setPendingBookingForCheckIn, setSelectedBookingId]
  );

  // After escrow confirmStay succeeds, call BookingManager.checkInBooking
  React.useEffect(() => {
    if (isSuccess && pendingBookingForCheckIn) {
      toast.success("Payment released! Updating booking status...", {
        description: "Step 2/2: Please confirm in your wallet",
      });

      writeCheckIn({
        ...CONTRACTS.bookingManager,
        functionName: "checkInBooking",
        args: [
          BigInt(pendingBookingForCheckIn.tokenId),
          BigInt(pendingBookingForCheckIn.bookingIndex),
        ],
      });
    }
  }, [isSuccess, pendingBookingForCheckIn, writeCheckIn]);

  // After checkInBooking succeeds, show final success message
  React.useEffect(() => {
    if (isCheckInSuccess) {
      toast.success("Check-in complete! Enjoy your stay.");
      onReset();
      onRefetch();
      invalidateAfterBooking(3000);
    }
  }, [isCheckInSuccess, onRefetch, invalidateAfterBooking, onReset]);

  // Handle escrow transaction error
  React.useEffect(() => {
    if (txError) {
      const errorMsg = txError.message;
      if (errorMsg.includes("TooEarlyForAction")) {
        toast.error("Too early to check in. Please wait until check-in time.");
      } else if (errorMsg.includes("OnlyGuest")) {
        toast.error("Only the booking guest can confirm check-in.");
      } else {
        toast.error("Transaction failed. Please try again.");
      }
      setSelectedBookingId(null);
      setPendingBookingForCheckIn(null);
    }
  }, [txError, setSelectedBookingId, setPendingBookingForCheckIn]);

  // Handle checkInBooking transaction error
  React.useEffect(() => {
    if (checkInTxError) {
      toast.warning("Payment released but booking status update failed. This is not critical.");
      onReset();
      onRefetch();
    }
  }, [checkInTxError, onRefetch, onReset]);

  return {
    handleConfirmCheckIn,
    isPending,
    isTxLoading,
    isCheckInPending,
    isCheckInLoading,
  };
}
