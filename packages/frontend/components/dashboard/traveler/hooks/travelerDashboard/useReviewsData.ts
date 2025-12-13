"use client";

/**
 * Hook for reviews data fetching
 */

import * as React from "react";
import { useReadContracts } from "wagmi";
import { usePonderTraveler } from "@/hooks/usePonderTraveler";
import { usePonderReviews } from "@/hooks/usePonderReviews";
import { CONTRACTS } from "@/lib/contracts";
import type { Address } from "viem";

interface UseReviewsDataProps {
  address: Address | undefined;
}

/**
 * Fetch and process reviews data
 */
export function useReviewsData({ address }: UseReviewsDataProps) {
  // Fetch traveler profile from Ponder
  const { traveler, loading: loadingTraveler } = usePonderTraveler({
    walletAddress: address,
  });

  // Fetch reviews
  const { reviews: reviewsGiven, refetch: refetchReviewsGiven } = usePonderReviews({
    reviewerAddress: address,
  });

  const { reviews: reviewsReceived } = usePonderReviews({
    revieweeAddress: address,
  });

  // Calculate average rating from reviews, excluding flagged ones
  const { calculatedAvgRating, nonFlaggedReviewCount } = React.useMemo(() => {
    const nonFlagged = reviewsReceived.filter((r) => !r.isFlagged);
    if (nonFlagged.length === 0) return { calculatedAvgRating: null, nonFlaggedReviewCount: 0 };
    const sum = nonFlagged.reduce((acc, r) => acc + r.rating, 0);
    return {
      calculatedAvgRating: sum / nonFlagged.length,
      nonFlaggedReviewCount: nonFlagged.length,
    };
  }, [reviewsReceived]);

  // Batch fetch review data from contract
  const reviewContractCalls = React.useMemo(() => {
    if (!reviewsGiven || reviewsGiven.length === 0) return [];
    return reviewsGiven.map((review) => ({
      ...CONTRACTS.reviewValidator,
      functionName: "getReview" as const,
      args: [BigInt(review.reviewId)],
    }));
  }, [reviewsGiven]);

  const { data: reviewContractData } = useReadContracts({
    contracts: reviewContractCalls,
    query: { enabled: reviewContractCalls.length > 0 },
  } as unknown as Parameters<typeof useReadContracts>[0]);

  // Extract escrowIds from review contract data
  const escrowIds = React.useMemo(() => {
    if (!reviewContractData) return [];
    return (reviewContractData as { status: string; result?: { escrowId: bigint } }[])
      .filter((result) => result.status === "success" && result.result)
      .map((result) => result.result!.escrowId);
  }, [reviewContractData]);

  // Batch fetch escrow addresses
  const escrowAddressCalls = React.useMemo(() => {
    if (escrowIds.length === 0) return [];
    return escrowIds.map((escrowId) => ({
      address: CONTRACTS.escrowFactory.address,
      abi: CONTRACTS.escrowFactory.abi,
      functionName: "escrows" as const,
      args: [escrowId] as const,
    }));
  }, [escrowIds]);

  const { data: escrowAddressData } = useReadContracts({
    contracts: escrowAddressCalls,
    query: { enabled: escrowAddressCalls.length > 0 },
  } as unknown as Parameters<typeof useReadContracts>[0]);

  // Build Set of reviewed escrow addresses
  const reviewedEscrowAddresses = React.useMemo(() => {
    const addresses = new Set<string>();
    if (!escrowAddressData) return addresses;

    (escrowAddressData as { status: string; result?: string }[]).forEach((result) => {
      if (result.status === "success" && result.result) {
        addresses.add(result.result.toLowerCase());
      }
    });

    return addresses;
  }, [escrowAddressData]);

  return {
    traveler,
    loadingTraveler,
    reviewsGiven,
    reviewsReceived,
    refetchReviewsGiven,
    calculatedAvgRating,
    nonFlaggedReviewCount,
    reviewedEscrowAddresses,
  };
}
