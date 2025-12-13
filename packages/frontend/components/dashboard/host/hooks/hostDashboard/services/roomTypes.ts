/**
 * Room types service
 */

import { PONDER_URL } from "../../../constants";
import { fetchFromIPFS } from "@/lib/utils/ipfs";
import type { RoomTypeData } from "@/lib/hooks/property/types";
import type { RoomTypeWithCurrency } from "../../../types";

interface RoomTypeItem {
  id: string;
  tokenId: string;
  propertyId: string;
  roomTypeId: string;
  name: string;
  ipfsHash: string;
  pricePerNight: string;
  isActive: boolean;
}

/**
 * Fetch room types from Ponder GraphQL
 */
export async function fetchRoomTypes(
  propertyIdStrings: string[]
): Promise<Map<string, RoomTypeWithCurrency>> {
  const map = new Map<string, RoomTypeWithCurrency>();

  if (propertyIdStrings.length === 0) {
    return map;
  }

  try {
    const propertyIdList = propertyIdStrings.map((id) => `"${id}"`).join(", ");

    const graphqlQuery = `
      query {
        roomTypes(where: { propertyId_in: [${propertyIdList}] }, limit: 1000) {
          items {
            id
            tokenId
            propertyId
            roomTypeId
            name
            ipfsHash
            pricePerNight
            isActive
          }
        }
      }
    `;

    const response = await fetch(`${PONDER_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: graphqlQuery }),
    });

    if (!response.ok) {
      return map;
    }

    const result = await response.json();
    const items: RoomTypeItem[] = result.data?.roomTypes?.items || [];

    // Fetch currency from IPFS metadata in parallel
    await Promise.all(
      items.map(async (item) => {
        let currency: "USD" | "EUR" = "USD";

        if (item.ipfsHash) {
          try {
            const metadata = await fetchFromIPFS<RoomTypeData>(item.ipfsHash);
            if (metadata?.currency) {
              currency = metadata.currency;
            }
          } catch {
            // Ignore IPFS fetch errors
          }
        }

        map.set(item.tokenId, {
          id: item.id,
          tokenId: BigInt(item.tokenId),
          propertyId: item.propertyId,
          roomTypeId: BigInt(item.roomTypeId || 0),
          name: item.name,
          pricePerNight: BigInt(item.pricePerNight || 0),
          cleaningFee: BigInt(0),
          maxGuests: BigInt(2),
          totalSupply: BigInt(1),
          createdAt: BigInt(0),
          updatedAt: BigInt(0),
          ipfsHash: item.ipfsHash || "",
          isActive: item.isActive,
          isDeleted: false,
          currency,
        });
      })
    );

    return map;
  } catch (error) {
    console.error("Failed to fetch room types:", error);
    return map;
  }
}
