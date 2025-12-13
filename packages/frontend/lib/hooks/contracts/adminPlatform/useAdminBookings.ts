/**
 * Admin Bookings Hooks
 */

import { useQuery } from "@tanstack/react-query";
import { PONDER_URL } from "./constants";
import type { RecentBooking } from "./types";

/**
 * Fetch recent bookings for activity feed
 */
export function useRecentBookings(limit: number = 10) {
  return useQuery<RecentBooking[]>({
    queryKey: ["recentBookings", limit],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            bookings(limit: ${limit}, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                propertyId
                roomTypeId
                traveler
                status
                totalPrice
                checkInDate
                checkOutDate
                escrowAddress
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.bookings?.items || [];
    },
  });
}

/**
 * Fetch bookings filtered by status
 */
export function useBookingsByStatus(status?: string) {
  return useQuery<RecentBooking[]>({
    queryKey: ["bookingsByStatus", status],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const whereClause = status ? `where: { status: "${status}" }` : "";
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            bookings(${whereClause}, limit: 1000, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                propertyId
                traveler
                status
                totalPrice
                checkInDate
                checkOutDate
                createdAt
                escrowAddress
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.bookings?.items || [];
    },
  });
}
