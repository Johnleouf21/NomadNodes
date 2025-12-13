import { useQuery } from "@tanstack/react-query";
import { PONDER_URL } from "./constants";
import { getDateFilterTimestamp } from "./utils";
import type { UserReview, DateFilterOption } from "./types";

/**
 * Fetch reviews submitted by user
 */
export function useUserReviewsSubmitted(
  address: string | undefined,
  dateFilter?: DateFilterOption
) {
  const minTimestamp = dateFilter ? getDateFilterTimestamp(dateFilter) : null;

  return useQuery<UserReview[]>({
    queryKey: ["userReviewsSubmitted", address, dateFilter],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!address,
    queryFn: async () => {
      if (!address) return [];

      const whereConditions = [`reviewer: "${address.toLowerCase()}"`];
      if (minTimestamp) {
        whereConditions.push(`createdAt_gte: "${minTimestamp}"`);
      }
      const whereClause = `{ ${whereConditions.join(", ")} }`;

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            reviews(where: ${whereClause}, limit: 100, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                reviewId
                propertyId
                reviewer
                reviewee
                rating
                helpfulVotes
                unhelpfulVotes
                createdAt
                isFlagged
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
 * Fetch reviews received by user
 */
export function useUserReviewsReceived(address: string | undefined) {
  return useQuery<UserReview[]>({
    queryKey: ["userReviewsReceived", address],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!address,
    queryFn: async () => {
      if (!address) return [];

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            reviews(where: { reviewee: "${address.toLowerCase()}" }, limit: 100, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                reviewId
                propertyId
                reviewer
                reviewee
                rating
                helpfulVotes
                unhelpfulVotes
                createdAt
                isFlagged
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
 * Fetch reviews for all host's properties (with React Query caching)
 */
export function useHostPropertyReviews(propertyIds: string[] | undefined) {
  return useQuery<UserReview[]>({
    queryKey: ["hostPropertyReviews", propertyIds],
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!propertyIds && propertyIds.length > 0,
    queryFn: async () => {
      if (!propertyIds || propertyIds.length === 0) return [];

      const propIdsList = propertyIds.map((id) => `"${id}"`).join(", ");

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            reviews(where: { propertyId_in: [${propIdsList}] }, limit: 1000, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                reviewId
                propertyId
                reviewer
                reviewee
                rating
                helpfulVotes
                unhelpfulVotes
                createdAt
                isFlagged
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
