"use client";

/**
 * Hook to manage booking transactions
 */

import * as React from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import { toast } from "sonner";
import { ESCROW_ABI } from "../../../constants";

interface UseBookingTransactionsReturn {
  // Contract write
  writeContract: ReturnType<typeof useWriteContract>["writeContract"];
  txHash: `0x${string}` | undefined;
  isWritePending: boolean;
  isTxLoading: boolean;
  isTxSuccess: boolean;

  // Escrow write
  writeEscrow: ReturnType<typeof useWriteContract>["writeContract"];

  // Action state
  pendingAction: string | null;
  setPendingAction: (action: string | null) => void;
  pendingEscrowRelease: PonderBooking | null;
  setPendingEscrowRelease: (booking: PonderBooking | null) => void;

  // Loading helper
  isActionPending: (bookingId: string) => boolean;
}

/**
 * Manage booking transactions and their effects
 */
export function useBookingTransactions(refetchBookings: () => void): UseBookingTransactionsReturn {
  // Action state
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const [pendingEscrowRelease, setPendingEscrowRelease] = React.useState<PonderBooking | null>(
    null
  );

  // Contract interactions for BookingManager
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Contract interactions for Escrow
  const { writeContract: writeEscrow, data: escrowTxHash } = useWriteContract();
  const { isSuccess: isEscrowTxSuccess } = useWaitForTransactionReceipt({
    hash: escrowTxHash,
  });

  // Handle BookingManager transaction success
  React.useEffect(() => {
    if (isTxSuccess && pendingAction) {
      if (pendingEscrowRelease && pendingEscrowRelease.escrowAddress) {
        toast.success("Check-in confirmed! Now releasing payment...", {
          description: "Please confirm the second transaction",
        });
        writeEscrow({
          address: pendingEscrowRelease.escrowAddress as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: "autoReleaseToHost",
        });
        setPendingAction(null);
      } else {
        toast.success("Action completed successfully");
        setPendingAction(null);
        setTimeout(() => refetchBookings(), 2000);
      }
    }
  }, [isTxSuccess, pendingAction, pendingEscrowRelease, writeEscrow, refetchBookings]);

  // Handle Escrow transaction success
  React.useEffect(() => {
    if (isEscrowTxSuccess && pendingEscrowRelease) {
      toast.success("Payment released! You can now withdraw in the Revenue tab.");
      setPendingEscrowRelease(null);
      setTimeout(() => refetchBookings(), 2000);
    }
  }, [isEscrowTxSuccess, pendingEscrowRelease, refetchBookings]);

  // Loading helper
  const isActionPending = React.useCallback(
    (bookingId: string) => pendingAction === bookingId && (isWritePending || isTxLoading),
    [pendingAction, isWritePending, isTxLoading]
  );

  return {
    writeContract,
    txHash,
    isWritePending,
    isTxLoading,
    isTxSuccess,
    writeEscrow,
    pendingAction,
    setPendingAction,
    pendingEscrowRelease,
    setPendingEscrowRelease,
    isActionPending,
  };
}
