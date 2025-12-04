/**
 * Hook for fetching IPFS metadata
 * Uses React Query for caching and deduplication
 */

import { useQuery } from "@tanstack/react-query";
import { fetchFromIPFS } from "@/lib/utils/ipfs";
import type { PropertyMetadata, RoomTypeData } from "./types";

interface UseIPFSMetadataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Generic hook to fetch any IPFS data with React Query caching
 */
export function useIPFSData<T = any>(ipfsHash: string | undefined): UseIPFSMetadataResult<T> {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["ipfs", ipfsHash],
    queryFn: async () => {
      if (!ipfsHash || ipfsHash === "QmPlaceholder") {
        return null;
      }
      return fetchFromIPFS<T>(ipfsHash);
    },
    enabled: !!ipfsHash && ipfsHash !== "QmPlaceholder",
    staleTime: 10 * 60 * 1000, // IPFS data is immutable, cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook to fetch property metadata from IPFS
 */
export function usePropertyMetadata(ipfsHash: string | undefined) {
  return useIPFSData<PropertyMetadata>(ipfsHash);
}

/**
 * Hook to fetch room type metadata from IPFS
 */
export function useRoomTypeMetadata(ipfsHash: string | undefined) {
  return useIPFSData<RoomTypeData>(ipfsHash);
}

/**
 * Hook to fetch property metadata with blockchain data combined
 * This combines the blockchain property data with IPFS metadata
 */
export function usePropertyWithMetadata(propertyId: bigint | undefined) {
  const { usePropertyById } = require("./usePropertyQueries");
  const { data: propertyData, isLoading: isLoadingProperty } = usePropertyById(propertyId);

  const ipfsHash = propertyData ? (propertyData as any).ipfsMetadataHash : undefined;
  const { data: metadata, isLoading: isLoadingMetadata } = usePropertyMetadata(ipfsHash);

  return {
    propertyData,
    metadata,
    isLoading: isLoadingProperty || isLoadingMetadata,
    hasMetadata: !!metadata && ipfsHash !== "QmPlaceholder",
  };
}

/**
 * Hook to fetch room type metadata with blockchain data combined
 */
export function useRoomTypeWithMetadata(tokenId: bigint | undefined) {
  const { useRoomTypeById } = require("./usePropertyQueries");
  const { data: roomTypeData, isLoading: isLoadingRoomType } = useRoomTypeById(tokenId);

  const ipfsHash = roomTypeData ? (roomTypeData as any).ipfsMetadataHash : undefined;
  const { data: metadata, isLoading: isLoadingMetadata } = useRoomTypeMetadata(ipfsHash);

  return {
    roomTypeData,
    metadata,
    isLoading: isLoadingRoomType || isLoadingMetadata,
    hasMetadata: !!metadata && ipfsHash !== "QmPlaceholder",
  };
}
