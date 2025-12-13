/**
 * Hook for fetching and managing review data
 */

import * as React from "react";
import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { fetchFromIPFS, type ReviewComment } from "@/lib/utils/ipfs";
import type { PonderReview } from "@/hooks/usePonderReviews";
import type { ReviewStruct } from "../types";

interface UseReviewDataParams {
  existingReview?: PonderReview | null;
  bookingEscrowAddress: string | null;
  bookingId: string;
  open: boolean;
}

interface UseReviewDataResult {
  reviewData: ReviewStruct | undefined;
  reviewComment: string | null;
  loadingComment: boolean;
  isLoadingReviewData: boolean;
  reviewBelongsToThisBooking: boolean;
}

export function useReviewData({
  existingReview,
  bookingEscrowAddress,
  bookingId,
  open,
}: UseReviewDataParams): UseReviewDataResult {
  const [reviewComment, setReviewComment] = React.useState<string | null>(null);
  const [loadingComment, setLoadingComment] = React.useState(false);
  const currentBookingRef = React.useRef<string | null>(null);

  // Reset state when booking changes
  React.useEffect(() => {
    const newBookingId = bookingId || null;
    if (newBookingId !== currentBookingRef.current) {
      currentBookingRef.current = newBookingId;
      setReviewComment(null);
      setLoadingComment(false);
    }
  }, [bookingId]);

  // Fetch review data from contract
  const {
    data: reviewDataRaw,
    isLoading: isLoadingReviewData,
    refetch: refetchReviewData,
  } = useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "getReview",
    args: existingReview?.reviewId ? [BigInt(existingReview.reviewId)] : undefined,
    query: {
      enabled: !!existingReview?.reviewId && open,
    },
  });
  const reviewData = reviewDataRaw as ReviewStruct | undefined;

  // Fetch escrow address from EscrowFactory
  const { data: reviewEscrowAddress } = useReadContract({
    ...CONTRACTS.escrowFactory,
    functionName: "escrows",
    args: reviewData?.escrowId ? [reviewData.escrowId] : undefined,
    query: {
      enabled: !!reviewData?.escrowId && open,
    },
  });

  // Check if the review belongs to this specific booking
  const reviewBelongsToThisBooking = React.useMemo(() => {
    if (!existingReview || !reviewData || !bookingEscrowAddress || !reviewEscrowAddress) {
      return false;
    }

    const bookingEscrowAddr = bookingEscrowAddress.toLowerCase();
    const reviewEscrowAddr = (reviewEscrowAddress as string).toLowerCase();

    return reviewEscrowAddr === bookingEscrowAddr;
  }, [existingReview, reviewData, bookingEscrowAddress, reviewEscrowAddress]);

  // Refetch review data when sheet opens
  React.useEffect(() => {
    if (open && existingReview?.reviewId) {
      setReviewComment(null);
      refetchReviewData();
    }
  }, [open, existingReview?.reviewId, refetchReviewData]);

  // Fetch review comment from IPFS
  React.useEffect(() => {
    async function fetchReviewComment() {
      if (!reviewBelongsToThisBooking) {
        setReviewComment(null);
        return;
      }

      const ipfsHash = reviewData?.ipfsCommentHash;
      if (!ipfsHash) {
        setReviewComment(null);
        return;
      }

      setLoadingComment(true);
      try {
        const data = await fetchFromIPFS<ReviewComment>(ipfsHash);
        if (data?.comment) {
          setReviewComment(data.comment);
        } else {
          setReviewComment(null);
        }
      } catch (error) {
        console.warn("Failed to fetch review comment from IPFS:", error);
        setReviewComment(null);
      } finally {
        setLoadingComment(false);
      }
    }

    if (open && reviewData) {
      fetchReviewComment();
    }
  }, [reviewData, reviewBelongsToThisBooking, open]);

  return {
    reviewData,
    reviewComment,
    loadingComment,
    isLoadingReviewData,
    reviewBelongsToThisBooking,
  };
}
