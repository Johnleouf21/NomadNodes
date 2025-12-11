/**
 * Admin Review Moderation Hooks
 * For ReviewValidator contract management
 */

import * as React from "react";
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import type { Address } from "viem";

// Review Status enum matching contract
export enum ReviewStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Published = 3,
}

export interface PendingReviewData {
  reviewId: bigint;
  escrowId: bigint;
  propertyId: bigint;
  bookingIndex: bigint;
  reviewer: Address;
  reviewee: Address;
  rating: number;
  ipfsCommentHash: string;
  submittedAt: bigint;
  status: ReviewStatus;
  moderationNote: string;
  moderator: Address;
  travelerToHost: boolean;
}

// ===== Read Hooks =====

/**
 * Check if the current user is a moderator
 */
export function useIsModerator(address: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "isModerator",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get the contract owner
 */
export function useReviewValidatorOwner() {
  return useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "owner",
  });
}

/**
 * Get the count of pending reviews
 */
export function useGetPendingCount() {
  return useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "getPendingCount",
  });
}

/**
 * Get pending reviews with pagination
 */
export function useGetPendingReviews(offset: number, limit: number) {
  return useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "getPendingReviews",
    args: [BigInt(offset), BigInt(limit)],
  });
}

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
 * Get auto-approve threshold
 */
export function useAutoApproveThreshold() {
  return useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "autoApproveThreshold",
  });
}

/**
 * Get total review count
 */
export function useReviewCounter() {
  return useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "reviewCounter",
  });
}

/**
 * Get a single review by ID
 */
export function useGetReview(reviewId: bigint | undefined) {
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
 * Get all reviews with a specific status
 * Uses multicall to fetch all reviews efficiently
 */
export function useGetReviewsByStatus(status: ReviewStatus) {
  const { data: reviewCount } = useReviewCounter();

  // Create an array of contract calls to get each review
  const contracts = React.useMemo(() => {
    if (reviewCount === undefined || reviewCount === 0n) return [];

    const count = Number(reviewCount);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calls: any[] = [];
    for (let i = 0; i < count; i++) {
      calls.push({
        address: CONTRACTS.reviewValidator.address,
        abi: CONTRACTS.reviewValidator.abi,
        functionName: "getReview",
        args: [BigInt(i)],
      });
    }
    return calls;
  }, [reviewCount]);

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
    },
  });

  // Filter reviews by status
  const filteredReviews = React.useMemo(() => {
    if (!data) return [];

    return data
      .map((result, index) => {
        if (result.status === "success" && result.result) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const review = result.result as any;
          if (review.status === status) {
            return {
              reviewId: BigInt(index),
              escrowId: review.escrowId as bigint,
              propertyId: review.propertyId as bigint,
              bookingIndex: review.bookingIndex as bigint,
              reviewer: review.reviewer as Address,
              reviewee: review.reviewee as Address,
              rating: Number(review.rating),
              ipfsCommentHash: review.ipfsCommentHash as string,
              submittedAt: review.submittedAt as bigint,
              status: Number(review.status) as ReviewStatus,
              moderationNote: review.moderationNote as string,
              moderator: review.moderator as Address,
              travelerToHost: review.travelerToHost as boolean,
            } as PendingReviewData;
          }
        }
        return null;
      })
      .filter((r): r is PendingReviewData => r !== null);
  }, [data, status]);

  return {
    data: filteredReviews,
    isLoading,
    error,
    refetch,
  };
}

// ===== Write Hooks =====

/**
 * Approve a pending review
 */
export function useApproveReview() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approveReview = (reviewId: bigint) => {
    writeContract({
      ...CONTRACTS.reviewValidator,
      functionName: "approveReview",
      args: [reviewId],
    });
  };

  return {
    approveReview,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Reject a pending review
 */
export function useRejectReview() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const rejectReview = (reviewId: bigint, reason: string) => {
    writeContract({
      ...CONTRACTS.reviewValidator,
      functionName: "rejectReview",
      args: [reviewId, reason],
    });
  };

  return {
    rejectReview,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Publish an approved review
 */
export function usePublishReview() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
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
    reset,
  };
}

/**
 * Batch approve multiple reviews
 */
export function useBatchApprove() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const batchApprove = (reviewIds: bigint[]) => {
    writeContract({
      ...CONTRACTS.reviewValidator,
      functionName: "batchApprove",
      args: [reviewIds],
    });
  };

  return {
    batchApprove,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Batch publish multiple reviews
 */
export function useBatchPublish() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const batchPublish = (reviewIds: bigint[]) => {
    writeContract({
      ...CONTRACTS.reviewValidator,
      functionName: "batchPublish",
      args: [reviewIds],
    });
  };

  return {
    batchPublish,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Set moderator status (owner only)
 */
export function useSetModerator() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setModerator = (moderator: Address, status: boolean) => {
    writeContract({
      ...CONTRACTS.reviewValidator,
      functionName: "setModerator",
      args: [moderator, status],
    });
  };

  return {
    setModerator,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Set auto-approve settings (owner only)
 */
export function useSetAutoApprove() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setAutoApprove = (enabled: boolean, threshold: number) => {
    writeContract({
      ...CONTRACTS.reviewValidator,
      functionName: "setAutoApprove",
      args: [enabled, BigInt(threshold)],
    });
  };

  return {
    setAutoApprove,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}
