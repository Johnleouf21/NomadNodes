import { fetchFromIPFS } from "@/lib/utils/ipfs";
import type { RoomTypeData } from "@/lib/hooks/property/types";
import type { RoomTypeInfo } from "../types";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

// Fetch room types for multiple properties (with IPFS metadata for currency)
export async function fetchRoomTypesForBookings(
  propertyIds: string[]
): Promise<Map<string, RoomTypeInfo[]>> {
  if (propertyIds.length === 0) return new Map();

  const propertyIdList = propertyIds.map((id) => `"${id}"`).join(", ");

  const graphqlQuery = `
    query {
      roomTypes(where: { propertyId_in: [${propertyIdList}] }, limit: 1000) {
        items {
          id
          tokenId
          propertyId
          name
          ipfsHash
        }
      }
    }
  `;

  const response = await fetch(`${PONDER_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: graphqlQuery }),
  });

  if (!response.ok) throw new Error("Failed to fetch room types");

  const result = await response.json();
  if (result.errors) throw new Error(result.errors[0]?.message || "GraphQL error");

  const roomTypes = result.data?.roomTypes?.items || [];
  const grouped = new Map<string, RoomTypeInfo[]>();

  // Fetch IPFS metadata for each room type to get currency
  const roomTypesWithCurrency = await Promise.all(
    roomTypes.map(
      async (rt: {
        id: string;
        tokenId: string;
        propertyId: string;
        name: string;
        ipfsHash?: string;
      }) => {
        let currency: "USD" | "EUR" = "USD";
        if (rt.ipfsHash) {
          try {
            const metadata = await fetchFromIPFS<RoomTypeData>(rt.ipfsHash);
            if (metadata?.currency) {
              currency = metadata.currency;
            }
          } catch {
            // Ignore IPFS fetch errors, use default currency
          }
        }
        return { ...rt, currency };
      }
    )
  );

  for (const rt of roomTypesWithCurrency) {
    const existing = grouped.get(rt.propertyId) || [];
    existing.push(rt);
    grouped.set(rt.propertyId, existing);
  }

  return grouped;
}
