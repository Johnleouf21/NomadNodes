"use client";

import { useQuery } from "@tanstack/react-query";

export interface PonderBooking {
  id: string;
  tokenId: string;
  bookingIndex: string;
  propertyId: string;
  roomTypeId: string;
  traveler: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: string;
  escrowAddress: string | null;
  status: "Pending" | "Confirmed" | "CheckedIn" | "Completed" | "Cancelled";
  createdAt: string;
  updatedAt: string;
}

interface UsePonderBookingsOptions {
  travelerAddress?: string;
  propertyId?: string;
  propertyIds?: string[]; // Support multiple property IDs for host dashboard
  limit?: number;
}

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

export function usePonderBookings(options: UsePonderBookingsOptions) {
  const { travelerAddress, propertyId, propertyIds, limit = 50 } = options;

  const query = useQuery({
    queryKey: ["bookings", { travelerAddress, propertyId, propertyIds, limit }],
    queryFn: async () => {
      const whereConditions: string[] = [];

      if (travelerAddress) {
        whereConditions.push(`traveler: "${travelerAddress}"`);
      }

      if (propertyId) {
        whereConditions.push(`propertyId: "${propertyId}"`);
      }

      // If we have multiple propertyIds, we need to fetch for each and combine
      if (propertyIds && propertyIds.length > 0) {
        // GraphQL doesn't support OR easily, so we fetch all and filter client-side
        const graphqlQuery = `
          query {
            bookings(limit: ${limit * propertyIds.length}, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                tokenId
                bookingIndex
                propertyId
                roomTypeId
                traveler
                checkInDate
                checkOutDate
                totalPrice
                escrowAddress
                status
                createdAt
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
          throw new Error("Failed to fetch bookings from Ponder");
        }

        const result = await response.json();

        if (result.errors) {
          throw new Error(result.errors[0]?.message || "GraphQL error");
        }

        const allBookings = result.data?.bookings?.items || [];
        // Filter to only include bookings for the specified property IDs
        return allBookings.filter((b: PonderBooking) => propertyIds.includes(b.propertyId));
      }

      if (whereConditions.length === 0) {
        return [];
      }

      const whereClause = `where: { ${whereConditions.join(", ")} }`;

      const graphqlQuery = `
        query {
          bookings(${whereClause}, limit: ${limit}, orderBy: "createdAt", orderDirection: "desc") {
            items {
              id
              tokenId
              bookingIndex
              propertyId
              roomTypeId
              traveler
              checkInDate
              checkOutDate
              totalPrice
              escrowAddress
              status
              createdAt
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
        throw new Error("Failed to fetch bookings from Ponder");
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || "GraphQL error");
      }

      return result.data?.bookings?.items || [];
    },
    enabled: !!(travelerAddress || propertyId || (propertyIds && propertyIds.length > 0)),
  });

  return {
    bookings: (query.data || []) as PonderBooking[],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
