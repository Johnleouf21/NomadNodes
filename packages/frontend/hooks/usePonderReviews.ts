"use client";

import { useQuery } from "@tanstack/react-query";

export interface PonderReview {
  id: string;
  reviewId: string;
  propertyId: string;
  reviewer: string;
  reviewee: string;
  rating: number;
  isFlagged: boolean;
  helpfulVotes: string;
  unhelpfulVotes: string;
  createdAt: string;
}

interface UsePonderReviewsOptions {
  reviewerAddress?: string;
  revieweeAddress?: string;
  propertyId?: string;
  limit?: number;
}

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

export function usePonderReviews(options: UsePonderReviewsOptions) {
  const { reviewerAddress, revieweeAddress, propertyId, limit = 20 } = options;

  const query = useQuery({
    queryKey: ["reviews", { reviewerAddress, revieweeAddress, propertyId, limit }],
    queryFn: async () => {
      const whereConditions: string[] = [];

      if (reviewerAddress) {
        whereConditions.push(`reviewer: "${reviewerAddress.toLowerCase()}"`);
      }

      if (revieweeAddress) {
        whereConditions.push(`reviewee: "${revieweeAddress.toLowerCase()}"`);
      }

      if (propertyId) {
        whereConditions.push(`propertyId: "${propertyId}"`);
      }

      if (whereConditions.length === 0) {
        return [];
      }

      const whereClause = `where: { ${whereConditions.join(", ")} }`;

      const graphqlQuery = `
        query {
          reviews(${whereClause}, limit: ${limit}, orderBy: "createdAt", orderDirection: "desc") {
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
        throw new Error("Failed to fetch reviews from Ponder");
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || "GraphQL error");
      }

      return result.data?.reviews?.items || [];
    },
    enabled: !!(reviewerAddress || revieweeAddress || propertyId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    reviews: (query.data || []) as PonderReview[],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Helper to render stars
export function renderStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;
  return "★".repeat(fullStars) + "☆".repeat(emptyStars);
}
