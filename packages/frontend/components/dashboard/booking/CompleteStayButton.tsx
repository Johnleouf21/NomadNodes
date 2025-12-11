"use client";

import * as React from "react";
import { Loader2, AlertCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { useInvalidateQueries } from "@/hooks/useInvalidateQueries";

const ESCROW_ABI = [
  {
    inputs: [],
    name: "autoReleaseToHost",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "status",
    outputs: [{ type: "uint8", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "checkIn",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface CompleteStayButtonProps {
  escrowAddress: string;
  checkInDate: Date;
  onSuccess?: () => void;
  /** Called when escrow is already completed and user wants to leave a review */
  onReviewClick?: () => void;
  /** Whether a review has already been given for this booking */
  hasReview?: boolean;
}

export function CompleteStayButton({
  escrowAddress,
  checkInDate,
  onSuccess,
  onReviewClick,
  hasReview = false,
}: CompleteStayButtonProps) {
  const { invalidateAfterBooking } = useInvalidateQueries();

  // Read escrow status
  const { data: escrowStatus, isLoading: isStatusLoading } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "status",
  });

  // Read check-in timestamp from contract
  const { data: checkInTimestamp } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "checkIn",
  });

  // Complete stay mutation
  const {
    writeContract: completeStay,
    data: completeHash,
    isPending: isCompletePending,
    error: completeError,
  } = useWriteContract();

  const { isLoading: isCompleteLoading, isSuccess: isCompleteSuccess } =
    useWaitForTransactionReceipt({
      hash: completeHash,
    });

  // Calculate timing based on contract data
  const now = Date.now();
  const checkInMs = checkInTimestamp ? Number(checkInTimestamp) * 1000 : checkInDate.getTime();

  // Check-in day ends at 23:59:59 UTC
  const checkInDayEnd = new Date(checkInMs);
  checkInDayEnd.setUTCHours(23, 59, 59, 999);
  const canComplete = now > checkInDayEnd.getTime() && escrowStatus === 0;

  // Status is not Pending (0) - already completed or other state
  const isAlreadyCompleted = escrowStatus !== undefined && escrowStatus !== 0;

  // Still within traveler's window (before 23:59 UTC of check-in day)
  const isTooEarly = now <= checkInDayEnd.getTime();

  // Success effect
  React.useEffect(() => {
    if (isCompleteSuccess) {
      toast.success("Stay completed! Payment released to host.");
      onSuccess?.();
      invalidateAfterBooking(3000);
    }
  }, [isCompleteSuccess, onSuccess, invalidateAfterBooking]);

  // Error effect
  React.useEffect(() => {
    if (completeError) {
      console.error("Complete stay error:", completeError);
      if (completeError.message.includes("InvalidStatus")) {
        toast.error("Cannot complete: Escrow is not in pending status");
      } else if (completeError.message.includes("TooEarlyForAction")) {
        toast.error("Cannot complete yet: Check-in day has not ended");
      } else {
        toast.error("Transaction failed. Please try again.");
      }
    }
  }, [completeError]);

  const handleComplete = () => {
    // Additional client-side checks before sending transaction
    if (isAlreadyCompleted) {
      toast.error("This booking has already been completed");
      return;
    }

    if (isTooEarly) {
      toast.error("You can complete this stay after 23:59 UTC of check-in day");
      return;
    }

    completeStay({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "autoReleaseToHost",
    });
  };

  const isProcessing = isCompletePending || isCompleteLoading;

  // If escrow is already completed, show Review button or "Reviewed" status
  if (isAlreadyCompleted) {
    // If already reviewed, show nothing (or a subtle indicator)
    if (hasReview) {
      return null;
    }
    // If onReviewClick is provided, show Review button
    if (onReviewClick) {
      return (
        <Button size="sm" variant="outline" onClick={onReviewClick}>
          <Star className="mr-1 h-3 w-3" />
          Review
        </Button>
      );
    }
    // Fallback: show disabled button
    return (
      <Button size="sm" variant="outline" disabled className="opacity-50">
        Completed
      </Button>
    );
  }

  // If status is still loading, show loading state
  if (isStatusLoading) {
    return (
      <Button size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // If too early, show disabled button with tooltip info
  if (isTooEarly) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled
        className="opacity-70"
        title="Available after 23:59 UTC of check-in day"
      >
        <AlertCircle className="mr-1 h-3 w-3" />
        Too Early
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className="bg-purple-600 hover:bg-purple-700"
      onClick={handleComplete}
      disabled={!canComplete || isProcessing}
    >
      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete"}
    </Button>
  );
}
