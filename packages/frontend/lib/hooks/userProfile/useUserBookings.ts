import { useQuery } from "@tanstack/react-query";
import { PONDER_URL } from "./constants";
import { getDateFilterTimestamp } from "./utils";
import type { UserBooking, DateFilterOption } from "./types";

/**
 * Fetch user's bookings (as traveler)
 */
export function useUserBookings(address: string | undefined, dateFilter?: DateFilterOption) {
  const minTimestamp = dateFilter ? getDateFilterTimestamp(dateFilter) : null;

  return useQuery<UserBooking[]>({
    queryKey: ["userBookings", address, dateFilter],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!address,
    queryFn: async () => {
      if (!address) return [];

      const whereConditions = [`traveler: "${address.toLowerCase()}"`];
      if (minTimestamp) {
        whereConditions.push(`createdAt_gte: "${minTimestamp}"`);
      }
      const whereClause = `{ ${whereConditions.join(", ")} }`;

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            bookings(where: ${whereClause}, limit: 100, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                propertyId
                roomTypeId
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
