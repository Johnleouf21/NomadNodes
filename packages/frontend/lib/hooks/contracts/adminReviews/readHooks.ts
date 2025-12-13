/**
 * Read Hooks for Admin Review Moderation
 */

import * as React from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import type { Address } from "viem";
import { ReviewStatus, type PendingReviewData } from "./types";

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
