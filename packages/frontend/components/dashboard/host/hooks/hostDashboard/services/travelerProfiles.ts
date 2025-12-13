/**
 * Traveler profiles service
 */

import { PONDER_URL } from "../../../constants";
import type { TravelerProfile } from "../../../types";

/**
 * Fetch traveler profiles from Ponder GraphQL
 */
export async function fetchTravelerProfiles(
  travelerAddresses: string[]
): Promise<Map<string, TravelerProfile>> {
  const map = new Map<string, TravelerProfile>();

  if (travelerAddresses.length === 0) {
    return map;
  }

  try {
    const addressList = travelerAddresses.map((a) => `"${a}"`).join(", ");

    const reviewsQuery = `
      query {
        reviews(where: { reviewee_in: [${addressList}] }, limit: 1000) {
          items {
            reviewee
            rating
            isFlagged
          }
        }
      }
    `;

    const response = await fetch(`${PONDER_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: reviewsQuery }),
    });

    if (!response.ok) {
      return map;
    }

    const result = await response.json();
    const reviews = result.data?.reviews?.items || [];

    // Group ratings by traveler
    const reviewsByTraveler = new Map<string, { ratings: number[]; total: number }>();

    for (const review of reviews) {
      const wallet = review.reviewee.toLowerCase();
      if (!reviewsByTraveler.has(wallet)) {
        reviewsByTraveler.set(wallet, { ratings: [], total: 0 });
      }
      const data = reviewsByTraveler.get(wallet)!;
      if (!review.isFlagged) {
        data.ratings.push(Number(review.rating));
      }
      data.total++;
    }

    // Build profile map
    for (const wallet of travelerAddresses) {
      const data = reviewsByTraveler.get(wallet);
      if (data && data.ratings.length > 0) {
        const avgRating = data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length;
        map.set(wallet, {
          wallet,
          averageRating: avgRating,
          totalReviewsReceived: data.ratings.length,
        });
      } else {
        map.set(wallet, {
          wallet,
          averageRating: 0,
          totalReviewsReceived: 0,
        });
      }
    }

    return map;
  } catch (error) {
    console.error("Failed to fetch traveler profiles:", error);
    return map;
  }
}
