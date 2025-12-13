import { useQuery } from "@tanstack/react-query";
import { PONDER_URL } from "./constants";
import type { HostProfileData, TravelerProfileData } from "./types";

/**
 * Fetch host profile from Ponder
 */
export function useHostProfile(address: string | undefined) {
  return useQuery<HostProfileData | null>({
    queryKey: ["hostProfile", address],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!address,
    queryFn: async () => {
      if (!address) return null;

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            hosts(where: { wallet: "${address.toLowerCase()}" }, limit: 1) {
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
      return result.data?.hosts?.items?.[0] || null;
    },
  });
}

/**
 * Fetch traveler profile from Ponder
 */
export function useTravelerProfile(address: string | undefined) {
  return useQuery<TravelerProfileData | null>({
    queryKey: ["travelerProfile", address],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!address,
    queryFn: async () => {
      if (!address) return null;

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            travelers(where: { wallet: "${address.toLowerCase()}" }, limit: 1) {
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
      return result.data?.travelers?.items?.[0] || null;
    },
  });
}
