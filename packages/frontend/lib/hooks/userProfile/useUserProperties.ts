import { useQuery } from "@tanstack/react-query";
import { PONDER_URL } from "./constants";
import { getDateFilterTimestamp } from "./utils";
import type { UserProperty, DateFilterOption } from "./types";

/**
 * Fetch user's properties (as host)
 */
export function useUserProperties(address: string | undefined, dateFilter?: DateFilterOption) {
  const minTimestamp = dateFilter ? getDateFilterTimestamp(dateFilter) : null;

  return useQuery<UserProperty[]>({
    queryKey: ["userProperties", address, dateFilter],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!address,
    queryFn: async () => {
      if (!address) return [];

      const whereConditions = [`host: "${address.toLowerCase()}"`];
      if (minTimestamp) {
        whereConditions.push(`createdAt_gte: "${minTimestamp}"`);
      }
      const whereClause = `{ ${whereConditions.join(", ")} }`;

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            propertys(where: ${whereClause}, limit: 100, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                propertyId
                host
                location
                propertyType
                isActive
                averageRating
                totalRatings
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.propertys?.items || [];
    },
  });
}
