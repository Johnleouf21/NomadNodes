"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchFromIPFS } from "@/lib/utils/ipfs";
import type { RoomTypeData } from "@/lib/hooks/property/types";

export interface PonderRoomType {
  id: string;
  tokenId: bigint;
  propertyId: string;
  roomTypeId: bigint;
  name: string;
  ipfsHash: string;
  pricePerNight: bigint;
  cleaningFee: bigint;
  maxGuests: bigint;
  totalSupply: bigint;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface RoomTypeWithMeta_data extends PonderRoomType {
  meta_data: RoomTypeData | null;
}

export interface PropertyPriceInfo {
  lowestPrice: number;
  highestPrice: number;
  allPrices: number[]; // All room type prices for filtering
  currency: "USD" | "EUR";
  roomTypesCount: number;
}

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

// Cache for room type IPFS meta_data
const roomTypeMeta_dataCache = new Map<string, RoomTypeData | null>();

/**
 * Fetch room type meta_data from IPFS with caching
 */
async function fetchRoomTypeMeta_data(ipfsHash: string): Promise<RoomTypeData | null> {
  if (roomTypeMeta_dataCache.has(ipfsHash)) {
    return roomTypeMeta_dataCache.get(ipfsHash) || null;
  }

  try {
    const meta_data = await fetchFromIPFS<RoomTypeData>(ipfsHash);
    roomTypeMeta_dataCache.set(ipfsHash, meta_data);
    return meta_data;
  } catch {
    roomTypeMeta_dataCache.set(ipfsHash, null);
    return null;
  }
}

/**
 * Fetch room types for multiple properties from Ponder
 */
async function fetchRoomTypesForProperties(
  _propertyIds: string[]
): Promise<Map<string, PonderRoomType[]>> {
  if (_propertyIds.length === 0) {
    return new Map();
  }

  // Build GraphQL query to fetch room types for all properties
  const propertyIdList = _propertyIds.map((id) => `"${id}"`).join(", ");

  const graphqlQuery = `
    query {
      roomTypes(where: { propertyId_in: [${propertyIdList}], isActive: true, isDeleted: false }, limit: 1000) {
        items {
          id
          tokenId
          propertyId
          roomTypeId
          name
          ipfsHash
          pricePerNight
          cleaningFee
          maxGuests
          totalSupply
          isActive
          isDeleted
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
    throw new Error("Failed to fetch room types from Ponder");
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  // Convert string values to bigints
  const rawItems = result.data?.roomTypes?.items || [];
  const roomTypes: PonderRoomType[] = rawItems.map((item: any) => ({
    ...item,
    tokenId: BigInt(item.tokenId),
    roomTypeId: BigInt(item.roomTypeId || 0),
    pricePerNight: BigInt(item.pricePerNight || 0),
    cleaningFee: BigInt(item.cleaningFee || 0),
    maxGuests: BigInt(item.maxGuests || 2),
    totalSupply: BigInt(item.totalSupply || 1),
    createdAt: BigInt(item.createdAt || 0),
    updatedAt: BigInt(item.updatedAt || 0),
  }));

  // Group room types by propertyId
  const groupedRoomTypes = new Map<string, PonderRoomType[]>();

  for (const roomType of roomTypes) {
    const existing = groupedRoomTypes.get(roomType.propertyId) || [];
    existing.push(roomType);
    groupedRoomTypes.set(roomType.propertyId, existing);
  }

  return groupedRoomTypes;
}

/**
 * Fetch price info for multiple properties
 * Returns a map of propertyId -> lowest price and currency
 * Uses IPFS metadata for accurate pricing (same source as property detail page)
 */
export async function fetchPropertyPrices(
  _propertyIds: string[]
): Promise<Map<string, PropertyPriceInfo>> {
  const priceMap = new Map<string, PropertyPriceInfo>();

  if (_propertyIds.length === 0) {
    return priceMap;
  }

  try {
    // Fetch room types for all properties
    const roomTypesMap = await fetchRoomTypesForProperties(_propertyIds);

    // Fetch IPFS metadata for each room type to get accurate prices
    for (const [_propertyId, roomTypes] of roomTypesMap) {
      if (roomTypes.length === 0) continue;

      const allPrices: number[] = [];
      let currency: "USD" | "EUR" = "USD";

      // Fetch metadata from IPFS for each room type (same as property detail page)
      for (const roomType of roomTypes) {
        if (roomType.ipfsHash && roomType.ipfsHash !== "QmPlaceholder") {
          const metadata = await fetchFromIPFS<RoomTypeData>(roomType.ipfsHash);
          if (metadata?.pricePerNight && metadata.pricePerNight > 0) {
            allPrices.push(metadata.pricePerNight);
            // Use the currency from metadata
            if (metadata.currency) {
              currency = metadata.currency as "USD" | "EUR";
            }
          }
        }
      }

      if (allPrices.length > 0) {
        priceMap.set(_propertyId, {
          lowestPrice: Math.min(...allPrices),
          highestPrice: Math.max(...allPrices),
          allPrices,
          currency,
          roomTypesCount: roomTypes.length,
        });
      }
    }

    return priceMap;
  } catch (error) {
    console.error("Failed to fetch property prices:", error);
    return priceMap;
  }
}

/**
 * Hook to fetch room types for a single property with their IPFS meta_data
 */
export function usePonderRoomTypes(_propertyId: string | undefined) {
  return useQuery({
    queryKey: ["ponderRoomTypes", _propertyId],
    queryFn: async (): Promise<RoomTypeWithMeta_data[]> => {
      if (!_propertyId) return [];

      const roomTypesMap = await fetchRoomTypesForProperties([_propertyId]);
      const roomTypes = roomTypesMap.get(_propertyId) || [];

      // Fetch meta_data for all room types in parallel
      const meta_dataPromises = roomTypes.map(async (roomType) => {
        const meta_data = await fetchRoomTypeMeta_data(roomType.ipfsHash);
        return { ...roomType, meta_data };
      });

      return Promise.all(meta_dataPromises);
    },
    enabled: !!_propertyId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

/**
 * Hook to fetch price info for multiple properties
 */
export function usePropertyPrices(_propertyIds: string[]) {
  return useQuery({
    queryKey: ["propertyPrices", _propertyIds],
    queryFn: () => fetchPropertyPrices(_propertyIds),
    enabled: _propertyIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
