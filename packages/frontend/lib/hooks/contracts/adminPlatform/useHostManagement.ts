/**
 * Host Management Hooks
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { CONTRACTS } from "@/lib/contracts";
import { PONDER_URL } from "./constants";
import type { Address } from "viem";
import type { PonderHost } from "./types";

/**
 * Get host profile from contract
 */
export function useHostProfile(hostAddress: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.hostSBT,
    functionName: "getProfile",
    args: hostAddress ? [hostAddress] : undefined,
    query: {
      enabled: !!hostAddress,
    },
  });
}

/**
 * Suspend a host (owner only)
 */
export function useSuspendHost() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const suspendHost = (hostAddress: Address) => {
    writeContract({
      ...CONTRACTS.hostSBT,
      functionName: "suspendHost",
      args: [hostAddress],
    });
  };

  return { suspendHost, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Unsuspend a host (owner only)
 */
export function useUnsuspendHost() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const unsuspendHost = (hostAddress: Address) => {
    writeContract({
      ...CONTRACTS.hostSBT,
      functionName: "unsuspendHost",
      args: [hostAddress],
    });
  };

  return { unsuspendHost, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Fetch all hosts from Ponder
 */
export function usePonderHosts() {
  return useQuery<PonderHost[]>({
    queryKey: ["adminHosts"],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            hosts(limit: 1000, orderBy: "memberSince", orderDirection: "desc") {
              items {
                id
                wallet
                tokenId
                tier
                isSuperHost
                averageRating
                totalPropertiesListed
                totalBookingsReceived
                completedBookings
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
      return result.data?.hosts?.items || [];
    },
  });
}
