/**
 * Traveler Management Hooks
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { CONTRACTS } from "@/lib/contracts";
import { PONDER_URL } from "./constants";
import type { Address } from "viem";
import type { PonderTraveler } from "./types";

/**
 * Get traveler profile from contract
 */
export function useTravelerProfile(travelerAddress: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.travelerSBT,
    functionName: "getProfile",
    args: travelerAddress ? [travelerAddress] : undefined,
    query: {
      enabled: !!travelerAddress,
    },
  });
}

/**
 * Suspend a traveler (owner only)
 */
export function useSuspendTraveler() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const suspendTraveler = (travelerAddress: Address) => {
    writeContract({
      ...CONTRACTS.travelerSBT,
      functionName: "suspendTraveler",
      args: [travelerAddress],
    });
  };

  return { suspendTraveler, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Unsuspend a traveler (owner only)
 */
export function useUnsuspendTraveler() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const unsuspendTraveler = (travelerAddress: Address) => {
    writeContract({
      ...CONTRACTS.travelerSBT,
      functionName: "unsuspendTraveler",
      args: [travelerAddress],
    });
  };

  return { unsuspendTraveler, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Fetch all travelers from Ponder
 */
export function usePonderTravelers() {
  return useQuery<PonderTraveler[]>({
    queryKey: ["adminTravelers"],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            travelers(limit: 1000, orderBy: "memberSince", orderDirection: "desc") {
              items {
                id
                wallet
                tokenId
                tier
                averageRating
                totalBookings
                completedStays
                cancelledBookings
                totalReviewsReceived
                isSuspended
                memberSince
                lastActivityAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      const items = result.data?.travelers?.items || [];
      return items.map((t: Record<string, unknown>) => ({
        ...t,
        cancellations: t.cancelledBookings,
      }));
    },
  });
}
