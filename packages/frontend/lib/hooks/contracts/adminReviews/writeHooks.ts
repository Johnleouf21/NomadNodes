/**
 * Write Hooks for Admin Review Moderation
 */

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import type { Address } from "viem";

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

/**
 * Flag a published review (ReviewRegistry)
 * This marks a review as inappropriate without deleting it
 */
export function useFlagReview() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const flagReview = (reviewId: bigint, reason: string) => {
    writeContract({
      ...CONTRACTS.reviewRegistry,
      functionName: "flagReview",
      args: [reviewId, reason],
    });
  };

  return {
    flagReview,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Unflag a review (ReviewRegistry)
 */
export function useUnflagReview() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const unflagReview = (reviewId: bigint) => {
    writeContract({
      ...CONTRACTS.reviewRegistry,
      functionName: "unflagReview",
      args: [reviewId],
    });
  };

  return {
    unflagReview,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}
