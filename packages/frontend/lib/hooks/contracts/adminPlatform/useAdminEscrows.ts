/**
 * Admin Escrows Hooks
 */

import { useQuery } from "@tanstack/react-query";
import { PONDER_URL } from "./constants";
import type { EscrowData } from "./types";

/**
 * Fetch all escrows
 */
export function useAllEscrows() {
  return useQuery<EscrowData[]>({
    queryKey: ["allEscrows"],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            escrows(limit: 1000, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                tokenId
                traveler
                host
                currency
                price
                checkIn
                checkOut
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.escrows?.items || [];
    },
  });
}
