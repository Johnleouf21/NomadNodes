/**
 * Hook for managing review form state and submission
 */

import * as React from "react";
import { useAccount, useReadContract } from "wagmi";
import { toast } from "sonner";
import { useSubmitReview } from "@/lib/hooks/contracts/useReviewSystem";
import { uploadReviewToIPFS } from "@/lib/utils/ipfs";
import { CONTRACTS } from "@/lib/contracts";
import { useInvalidateQueries } from "@/hooks/useInvalidateQueries";
import type { ReviewableBooking, ReviewWindowInfo } from "../types";

interface UseReviewFormParams {
  booking: ReviewableBooking | null;
  isTravelerReview: boolean;
  foundEscrowId: bigint | null;
  reviewWindowInfo: ReviewWindowInfo | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface UseReviewFormResult {
  rating: number;
  setRating: (rating: number) => void;
  comment: string;
  setComment: (comment: string) => void;
  isLoading: boolean;
  isCheckingReview: boolean;
  hasAlreadyReviewed: boolean | undefined;
  canSubmit: boolean;
  handleSubmit: () => Promise<void>;
}

export function useReviewForm({
  booking,
  isTravelerReview,
  foundEscrowId,
  reviewWindowInfo,
  onOpenChange,
  onSuccess,
}: UseReviewFormParams): UseReviewFormResult {
  const { address } = useAccount();
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const { invalidateAfterReview } = useInvalidateQueries();

  // Track handled success/error to prevent duplicate toasts
  const lastHandledSuccessHashRef = React.useRef<string | null>(null);
  const lastHandledErrorRef = React.useRef<string | null>(null);

  // Submit review hook
  const {
    submitReview,
    hash: submitHash,
    isPending: isSubmitting,
    isConfirming,
    isSuccess: isSubmitSuccess,
    error: submitError,
  } = useSubmitReview();

  // Check if user has already reviewed this booking
  const { data: hasAlreadyReviewedData, isLoading: isCheckingReview } = useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "hasReviewed",
    args: foundEscrowId !== null ? [foundEscrowId, isTravelerReview] : undefined,
    query: {
      enabled: foundEscrowId !== null,
    },
  });
  const hasAlreadyReviewed = hasAlreadyReviewedData as boolean | undefined;

  // Reset form when booking changes
  React.useEffect(() => {
    if (booking) {
      setRating(0);
      setComment("");
      lastHandledErrorRef.current = null;
    }
  }, [booking?.id]);

  // Handle success
  React.useEffect(() => {
    if (isSubmitSuccess && submitHash && lastHandledSuccessHashRef.current !== submitHash) {
      lastHandledSuccessHashRef.current = submitHash;
      toast.success("Review submitted successfully!", {
        description: "Your review is pending moderation and will be published soon.",
      });
      onOpenChange(false);
      onSuccess?.();
      invalidateAfterReview(3000);
    }
  }, [isSubmitSuccess, submitHash, onOpenChange, onSuccess, invalidateAfterReview]);

  // Handle error
  React.useEffect(() => {
    if (submitError && submitError.message !== lastHandledErrorRef.current) {
      lastHandledErrorRef.current = submitError.message;
      handleSubmitError(submitError.message);
    }
  }, [submitError]);

  const handleSubmit = async () => {
    if (!booking || !address || rating === 0 || foundEscrowId === null) {
      return;
    }

    try {
      setIsUploading(true);

      // Upload comment to IPFS
      const ipfsHash = await uploadReviewToIPFS(comment || "No comment provided.");

      setIsUploading(false);

      // Prepare review data
      const reviewData = {
        escrowId: foundEscrowId,
        propertyId: BigInt(booking.propertyId),
        bookingIndex: BigInt(booking.bookingIndex),
        reviewee: isTravelerReview ? booking.hostAddress : booking.travelerAddress,
        rating,
        ipfsCommentHash: ipfsHash,
        travelerToHost: isTravelerReview,
      };

      // Submit review to contract
      submitReview(reviewData);
    } catch (err) {
      console.error("Error during review submission:", err);
      setIsUploading(false);
      toast.error("Failed to upload review. Please try again.");
    }
  };

  const isLoading = isUploading || isSubmitting || isConfirming;
  const alreadyReviewed = hasAlreadyReviewed === true;
  const canSubmit =
    rating > 0 &&
    reviewWindowInfo?.isOpen === true &&
    foundEscrowId !== null &&
    !isLoading &&
    !alreadyReviewed;

  return {
    rating,
    setRating,
    comment,
    setComment,
    isLoading,
    isCheckingReview,
    hasAlreadyReviewed,
    canSubmit,
    handleSubmit,
  };
}

/**
 * Handle review submission errors with appropriate toast messages
 */
function handleSubmitError(errorMsg: string): void {
  console.error("Review submission error:", errorMsg);

  if (errorMsg.includes("AlreadyReviewed")) {
    toast.error("You have already submitted a review for this booking.");
  } else if (errorMsg.includes("InvalidRating")) {
    toast.error("Invalid rating. Please select between 1 and 5 stars.");
  } else if (errorMsg.includes("NotParticipant") || errorMsg.includes("NotBuyer")) {
    toast.error("You are not a participant in this booking.");
  } else if (errorMsg.includes("InvalidEscrow")) {
    toast.error("Invalid escrow. The booking data may be incorrect.");
  } else if (errorMsg.includes("EscrowNotCompleted")) {
    toast.error("The booking must be completed before you can leave a review.");
  } else if (errorMsg.includes("User rejected") || errorMsg.includes("User denied")) {
    toast.error("Transaction was rejected.");
  } else if (errorMsg.includes("intrinsic gas too low") || errorMsg.includes("out of gas")) {
    toast.error("Transaction ran out of gas. Please try again.");
  } else {
    const shortError = errorMsg.length > 100 ? errorMsg.substring(0, 100) + "..." : errorMsg;
    toast.error("Failed to submit review", {
      description: shortError,
    });
  }
}
