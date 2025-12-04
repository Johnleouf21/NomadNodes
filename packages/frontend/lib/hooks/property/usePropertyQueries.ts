/**
 * Read-only hooks for Property contracts (PropertyRegistry + RoomTypeNFT)
 */

import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import type { Address } from "viem";

/**
 * Get a single property by ID from PropertyRegistry
 */
export function usePropertyById(propertyId: bigint | undefined) {
  return useReadContract({
    ...CONTRACTS.propertyRegistry,
    functionName: "getProperty",
    args: propertyId ? [propertyId] : undefined,
    query: {
      enabled: !!propertyId && propertyId > 0n,
    },
  });
}

/**
 * Get all room type token IDs for a property from RoomTypeNFT
 */
export function usePropertyRoomTypes(propertyId: bigint | undefined) {
  return useReadContract({
    ...CONTRACTS.roomTypeNFT,
    functionName: "getPropertyRoomTypes",
    args: propertyId ? [propertyId] : undefined,
    query: {
      enabled: !!propertyId && propertyId > 0n,
    },
  });
}

/**
 * Get a single room type by token ID from RoomTypeNFT
 */
export function useRoomTypeById(tokenId: bigint | undefined) {
  return useReadContract({
    ...CONTRACTS.roomTypeNFT,
    functionName: "getRoomType",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId && tokenId > 0n,
    },
  });
}

/**
 * Get total properties count from PropertyRegistry
 */
export function useTotalProperties() {
  return useReadContract({
    ...CONTRACTS.propertyRegistry,
    functionName: "totalProperties",
  });
}

/**
 * Check if an address is the owner of a property
 */
export function useIsPropertyOwner(propertyId: bigint | undefined, account: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.propertyRegistry,
    functionName: "isPropertyOwner",
    args: propertyId && account ? [propertyId, account] : undefined,
    query: {
      enabled: !!propertyId && !!account && propertyId > 0n,
    },
  });
}

/**
 * Get property owner address
 */
export function usePropertyOwner(propertyId: bigint | undefined) {
  return useReadContract({
    ...CONTRACTS.propertyRegistry,
    functionName: "propertyOwner",
    args: propertyId ? [propertyId] : undefined,
    query: {
      enabled: !!propertyId && propertyId > 0n,
    },
  });
}

/**
 * Get room type URI (metadata)
 */
export function useRoomTypeURI(tokenId: bigint | undefined) {
  return useReadContract({
    ...CONTRACTS.roomTypeNFT,
    functionName: "uri",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId && tokenId > 0n,
    },
  });
}

/**
 * Get room type balance for an account
 */
export function useRoomTypeBalance(account: Address | undefined, tokenId: bigint | undefined) {
  return useReadContract({
    ...CONTRACTS.roomTypeNFT,
    functionName: "balanceOf",
    args: account && tokenId ? [account, tokenId] : undefined,
    query: {
      enabled: !!account && !!tokenId && tokenId > 0n,
    },
  });
}

/**
 * Encode property ID and room type ID into token ID
 */
export function useEncodeTokenId(propertyId: bigint | undefined, roomTypeId: bigint | undefined) {
  return useReadContract({
    ...CONTRACTS.roomTypeNFT,
    functionName: "encodeTokenId",
    args:
      propertyId !== undefined && roomTypeId !== undefined ? [propertyId, roomTypeId] : undefined,
    query: {
      enabled: propertyId !== undefined && roomTypeId !== undefined,
    },
  });
}

/**
 * Decode token ID into property ID and room type ID
 */
export function useDecodeTokenId(tokenId: bigint | undefined) {
  return useReadContract({
    ...CONTRACTS.roomTypeNFT,
    functionName: "decodeTokenId",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId && tokenId > 0n,
    },
  });
}

/**
 * Get all properties for a host via HostSBT.getHostProperties
 */
export function usePropertiesByHost(hostAddress: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.hostSBT,
    functionName: "getHostProperties",
    args: hostAddress ? [hostAddress] : undefined,
    query: {
      enabled: !!hostAddress,
    },
  });
}

/**
 * Convenience hook to fetch all properties with their IDs for a host
 * Uses HostSBT.getHostProperties to get property IDs
 */
export function useHostProperties(hostAddress: Address | undefined) {
  const { data, isLoading, refetch, error } = useReadContract({
    ...CONTRACTS.hostSBT,
    functionName: "getHostProperties",
    args: hostAddress ? [hostAddress] : undefined,
    query: {
      enabled: !!hostAddress,
    },
  });

  return {
    propertyIds: data as bigint[] | undefined,
    isLoading,
    error,
    refetch,
  };
}
