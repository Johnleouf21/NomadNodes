"use client";

import { useQuery } from "@tanstack/react-query";

export type TravelerTier = "Newcomer" | "Regular" | "Trusted" | "Elite";

export interface PonderTraveler {
  id: string;
  tokenId: string;
  wallet: string;
  tier: TravelerTier;
  averageRating: string; // 0-500 (5.00 stars = 500)
  totalBookings: string;
  completedStays: string;
  cancelledBookings: string;
  totalReviewsReceived: string;
  isSuspended: boolean;
  memberSince: string;
  lastActivityAt: string;
  updatedAt: string;
}

interface UsePonderTravelerOptions {
  walletAddress?: string;
}

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

export function usePonderTraveler(options: UsePonderTravelerOptions) {
  const { walletAddress } = options;

  const query = useQuery({
    queryKey: ["traveler", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;

      const graphqlQuery = `
        query {
          travelers(where: { wallet: "${walletAddress.toLowerCase()}" }, limit: 1) {
            items {
              id
              tokenId
              wallet
              tier
              averageRating
              totalBookings
              completedStays
              cancelledBookings
              totalReviewsReceived
              isSuspended
              memberSince
              lastActivityAt
              updatedAt
            }
          }
        }
      `;

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: graphqlQuery }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch traveler from Ponder");
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || "GraphQL error");
      }

      const items = result.data?.travelers?.items || [];
      return items[0] || null;
    },
    enabled: !!walletAddress,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    traveler: query.data as PonderTraveler | null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Helper function to format rating (0-500 to 0-5)
export function formatTravelerRating(rating: string | number): number {
  const numRating = typeof rating === "string" ? parseInt(rating, 10) : rating;
  return numRating / 100;
}

// Helper function to get tier badge color
export function getTierColor(tier: TravelerTier): string {
  switch (tier) {
    case "Elite":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30";
    case "Trusted":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30";
    case "Regular":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
    case "Newcomer":
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30";
  }
}

// Helper function to get tier icon
export function getTierEmoji(tier: TravelerTier): string {
  switch (tier) {
    case "Elite":
      return "👑";
    case "Trusted":
      return "⭐";
    case "Regular":
      return "🎒";
    case "Newcomer":
    default:
      return "🌱";
  }
}
