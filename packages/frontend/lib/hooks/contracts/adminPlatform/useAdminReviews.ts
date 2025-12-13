/**
 * Admin Reviews Hooks
 */

import { useQuery } from "@tanstack/react-query";
import { PONDER_URL } from "./constants";
import type { PonderReview } from "./types";

/**
 * Fetch all published reviews from Ponder
 */
export function usePonderReviews(limit: number = 100) {
  return useQuery<PonderReview[]>({
    queryKey: ["adminReviews", limit],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            reviews(limit: ${limit}, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                reviewId
                propertyId
                reviewer
                reviewee
                rating
                isFlagged
                helpfulVotes
                unhelpfulVotes
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.reviews?.items || [];
    },
  });
}

/**
 * Fetch reviews for a specific property
 */
export function usePropertyReviews(propertyId: string | undefined) {
  return useQuery<PonderReview[]>({
    queryKey: ["propertyReviews", propertyId],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!propertyId,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            reviews(where: { propertyId: "${propertyId}" }, limit: 100, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                reviewId
                propertyId
                reviewer
                reviewee
                rating
                isFlagged
                helpfulVotes
                unhelpfulVotes
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.reviews?.items || [];
    },
  });
}

/**
 * Fetch flagged reviews (for moderation)
 */
export function useFlaggedReviews() {
  return useQuery<PonderReview[]>({
    queryKey: ["flaggedReviews"],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            reviews(where: { isFlagged: true }, limit: 100, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                reviewId
                propertyId
                reviewer
                reviewee
                rating
                isFlagged
                helpfulVotes
                unhelpfulVotes
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.reviews?.items || [];
    },
  });
}
