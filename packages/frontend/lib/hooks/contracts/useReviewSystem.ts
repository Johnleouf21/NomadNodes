/**
 * Review System Contract Hooks
 * Covers ReviewRegistry and ReviewValidator
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import type { Address } from "viem";

// ===== ReviewValidator Types =====

export interface PendingReview {
  reviewId: bigint;
  escrowId: bigint;
  propertyId: bigint;
  bookingIndex: bigint;
  reviewer: Address;
  reviewee: Address;
  rating: number;
  ipfsCommentHash: string;
  submittedAt: bigint;
  status: number; // 0=Pending, 1=Approved, 2=Rejected, 3=Published
  moderationNote: string;
  moderator: Address;
  travelerToHost: boolean;
}

// ===== Helper: Find escrowId from escrowAddress =====

/**
 * Hook to find escrowId from escrowAddress by iterating through user's escrows
 */
export function useFindEscrowId(
  userAddress: Address | undefined,
  escrowAddress: Address | undefined
) {
  // Get all escrow IDs for the user
  const { data: userEscrowIds } = useReadContract({
    ...CONTRACTS.escrowRegistry,
    functionName: "getUserEscrows",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!escrowAddress,
    },
  });

  // For now, return the escrowIds array - the component will need to resolve
  // We can't easily do multicall in hooks, so we return the IDs
  return {
    escrowIds: userEscrowIds as bigint[] | undefined,
  };
}

// ===== ReviewValidator Hooks =====

/**
 * Check if auto-approve is enabled
 */
export function useAutoApproveEnabled() {
  return useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "autoApproveEnabled",
  });
}

/**
 * Get a pending review by ID
 */
export function useGetPendingReview(reviewId: bigint | undefined) {
  return useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "getReview",
    args: reviewId !== undefined ? [reviewId] : undefined,
    query: {
      enabled: reviewId !== undefined,
    },
  });
}

/**
 * Check if escrow was already reviewed (DEPRECATED - use useHasReviewed instead)
 */
export function useEscrowAlreadyReviewed(escrowId: bigint | undefined) {
  return useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "escrowAlreadyReviewed",
    args: escrowId !== undefined ? [escrowId] : undefined,
    query: {
      enabled: escrowId !== undefined,
    },
  });
}

/**
 * Check if a review has been submitted for a specific direction
 * @param escrowId The escrow ID
 * @param travelerToHost true to check if traveler reviewed, false to check if host reviewed
 */
export function useHasReviewed(escrowId: bigint | undefined, travelerToHost: boolean) {
  return useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "hasReviewed",
    args: escrowId !== undefined ? [escrowId, travelerToHost] : undefined,
    query: {
      enabled: escrowId !== undefined,
    },
  });
}

/**
 * Get escrow address from escrowId
 */
export function useGetEscrowAddress(escrowId: bigint | undefined) {
  return useReadContract({
    ...CONTRACTS.escrowRegistry,
    functionName: "escrows",
    args: escrowId !== undefined ? [escrowId] : undefined,
    query: {
      enabled: escrowId !== undefined,
    },
  });
}

// ===== ReviewRegistry Hooks =====

export function useGetReview(reviewId: bigint) {
  return useReadContract({
    ...CONTRACTS.reviewRegistry,
    functionName: "getReview",
    args: [reviewId],
  });
}

export function useGetPropertyReviews(propertyId: bigint) {
  return useReadContract({
    ...CONTRACTS.reviewRegistry,
    functionName: "getPropertyReviews",
    args: [propertyId],
  });
}

export function useGetUserReviews(user: Address) {
  return useReadContract({
    ...CONTRACTS.reviewRegistry,
    functionName: "getUserReviews",
    args: [user],
  });
}

// ===== Submit Review Hook =====

interface SubmitReviewArgs {
  escrowId: bigint;
  propertyId: bigint;
  bookingIndex: bigint;
  reviewee: Address;
  rating: number;
  ipfsCommentHash: string;
  travelerToHost: boolean;
}

export function useSubmitReview() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitReview = (args: SubmitReviewArgs) => {
    console.log("useSubmitReview: calling writeContract with args:", {
      escrowId: args.escrowId.toString(),
      propertyId: args.propertyId.toString(),
      bookingIndex: args.bookingIndex.toString(),
      reviewee: args.reviewee,
      rating: args.rating,
      ipfsCommentHash: args.ipfsCommentHash,
      travelerToHost: args.travelerToHost,
    });

    writeContract(
      {
        ...CONTRACTS.reviewValidator,
        functionName: "submitReview",
        args: [
          args.escrowId,
          args.propertyId,
          args.bookingIndex,
          args.reviewee,
          args.rating,
          args.ipfsCommentHash,
          args.travelerToHost,
        ],
        // Explicit gas limit to avoid estimation issues
        gas: BigInt(500_000),
      },
      {
        onSuccess: (data) => {
          console.log("useSubmitReview: writeContract onSuccess, hash:", data);
        },
        onError: (err) => {
          console.error("useSubmitReview: writeContract onError:", err);
        },
      }
    );
  };

  return {
    submitReview,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ===== Publish Review Hook (for approved reviews) =====

export function usePublishReview() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const publishReview = (reviewId: bigint) => {
    writeContract({
      ...CONTRACTS.reviewValidator,
      functionName: "publishReview",
      args: [reviewId],
    });
  };

  return {
    publishReview,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
