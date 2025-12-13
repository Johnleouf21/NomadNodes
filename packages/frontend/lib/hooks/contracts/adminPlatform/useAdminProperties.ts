/**
 * Admin Properties Hooks
 */

import { useQuery } from "@tanstack/react-query";
import { PONDER_URL } from "./constants";
import type { AdminProperty, RoomType } from "./types";

/**
 * Fetch all properties for admin oversight
 */
export function useAdminProperties() {
  return useQuery<AdminProperty[]>({
    queryKey: ["adminProperties"],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            propertys(limit: 1000, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                propertyId
                host
                isActive
                averageRating
                totalRatings
                propertyType
                location
                createdAt
                ipfsHash
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

/**
 * Fetch room types for a property
 */
export function usePropertyRoomTypes(propertyId: string | undefined) {
  return useQuery<RoomType[]>({
    queryKey: ["propertyRoomTypes", propertyId],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!propertyId,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            roomTypes(where: { propertyId: "${propertyId}" }, limit: 100) {
              items {
                id
                tokenId
                propertyId
                roomTypeId
                name
                pricePerNight
                cleaningFee
                maxGuests
                totalSupply
                isActive
                isDeleted
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.roomTypes?.items || [];
    },
  });
}

/**
 * Fetch all room types
 */
export function useAllRoomTypes() {
  return useQuery<RoomType[]>({
    queryKey: ["allRoomTypes"],
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            roomTypes(limit: 1000, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                tokenId
                propertyId
                roomTypeId
                name
                pricePerNight
                cleaningFee
                maxGuests
                totalSupply
                isActive
                isDeleted
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.roomTypes?.items || [];
    },
  });
}
