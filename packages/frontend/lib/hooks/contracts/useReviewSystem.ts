/**
 * Review System Contract Hooks
 * Covers ReviewRegistry and ReviewValidator
 */

import { useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import type { Address } from "viem";

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

export function useGetHostReviews(host: Address) {
  return useReadContract({
    ...CONTRACTS.reviewRegistry,
    functionName: "getHostReviews",
    args: [host],
  });
}

export function useCanReview(bookingId: bigint, reviewer: Address) {
  return useReadContract({
    ...CONTRACTS.reviewRegistry,
    functionName: "canReview",
    args: [bookingId, reviewer],
  });
}

export function useHasReviewed(bookingId: bigint, reviewer: Address) {
  return useReadContract({
    ...CONTRACTS.reviewRegistry,
    functionName: "hasReviewed",
    args: [bookingId, reviewer],
  });
}

// ===== ReviewValidator Hooks =====

export function useValidateReview(
  propertyId: bigint,
  rating: number,
  comment: string,
  reviewer: Address
) {
  return useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "validateReview",
    args: [propertyId, rating, comment, reviewer],
  });
}

export function useCanReviewProperty(bookingId: bigint, reviewer: Address) {
  return useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "canReviewProperty",
    args: [bookingId, reviewer],
  });
}

// Write Hooks
export function useSubmitReview() {
  return useWriteContract();
}

export function useReportReview() {
  return useWriteContract();
}

export function useRemoveReview() {
  return useWriteContract();
}

// Event Hooks
export function useWatchReviewSubmitted(
  onLogs: (logs: any[]) => void,
  options?: { enabled?: boolean }
) {
  useWatchContractEvent({
    ...CONTRACTS.reviewRegistry,
    eventName: "ReviewSubmitted",
    onLogs,
    ...options,
  });
}

export function useWatchReviewReported(
  onLogs: (logs: any[]) => void,
  options?: { enabled?: boolean }
) {
  useWatchContractEvent({
    ...CONTRACTS.reviewRegistry,
    eventName: "ReviewReported",
    onLogs,
    ...options,
  });
}

export function useWatchReviewRemoved(
  onLogs: (logs: any[]) => void,
  options?: { enabled?: boolean }
) {
  useWatchContractEvent({
    ...CONTRACTS.reviewRegistry,
    eventName: "ReviewRemoved",
    onLogs,
    ...options,
  });
}
