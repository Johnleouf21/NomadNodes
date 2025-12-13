"use client";

/**
 * Hook for cancellation transaction
 */

import * as React from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { useInvalidateQueries } from "@/hooks/useInvalidateQueries";
import { ESCROW_ABI } from "../types";

interface UseCancellationProps {
  escrowAddress: string | null;
  yourRefund: number;
  currencyLabel: string;
  onSuccess?: () => void;
  onOpenChange: (open: boolean) => void;
}

export function useCancellation({
  escrowAddress,
  yourRefund,
  currencyLabel,
  onSuccess,
  onOpenChange,
}: UseCancellationProps) {
  const { invalidateAfterBooking } = useInvalidateQueries();

  // Cancel booking transaction
  const {
    writeContract,
    data: txHash,
    isPending: isCancelling,
    error: cancelError,
  } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle cancel
  const handleCancel = React.useCallback(() => {
    if (!escrowAddress) return;

    writeContract({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "cancelBooking",
    });
  }, [escrowAddress, writeContract]);

  // Handle success with cache invalidation
  React.useEffect(() => {
    if (isSuccess) {
      toast.success("Booking cancelled successfully", {
        description: `You will receive ${yourRefund.toFixed(2)} ${currencyLabel} refund`,
      });
      onSuccess?.();
      onOpenChange(false);
      invalidateAfterBooking(3000);
    }
  }, [isSuccess, yourRefund, currencyLabel, onSuccess, onOpenChange, invalidateAfterBooking]);

  // Handle error
  React.useEffect(() => {
    if (cancelError) {
      toast.error("Failed to cancel booking", {
        description: cancelError.message,
      });
    }
  }, [cancelError]);

  const isProcessing = isCancelling || isConfirming;

  return {
    handleCancel,
    isProcessing,
    isCancelling,
    isConfirming,
  };
}
