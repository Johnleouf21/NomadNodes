"use client";

import { usePonderPropertiesInfinite, type PonderProperty } from "./usePonderProperties";
import { fetchFromIPFS } from "@/lib/utils/ipfs";
import { fetchPropertyPrices, type PropertyPriceInfo } from "./usePonderRoomTypes";
import type { PropertyMetadata } from "@/lib/hooks/property/types";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";

export interface PropertyWithMetadata extends PonderProperty {
  metadata: PropertyMetadata | null;
  priceInfo: PropertyPriceInfo | null;
}

interface UsePonderPropertiesWithMetadataOptions {
  isActive?: boolean;
  searchQuery?: string; // Search in name, location, city, country
  propertyType?: string;
  pageSize?: number;
}

// Cache for IPFS metadata to avoid refetching
const metadataCache = new Map<string, PropertyMetadata | null>();

/**
 * Fetch metadata for a single property with caching
 */
async function fetchPropertyMetadata(ipfsHash: string): Promise<PropertyMetadata | null> {
  if (metadataCache.has(ipfsHash)) {
    return metadataCache.get(ipfsHash) || null;
  }

  try {
    const metadata = await fetchFromIPFS<PropertyMetadata>(ipfsHash);
    metadataCache.set(ipfsHash, metadata);
    return metadata;
  } catch {
    metadataCache.set(ipfsHash, null);
    return null;
  }
}

/**
 * Hook that fetches properties from Ponder with pagination and enriches them with IPFS metadata
 * This allows client-side filtering by location/name since those are stored in IPFS
 */
export function usePonderPropertiesWithMetadata(
  options: UsePonderPropertiesWithMetadataOptions = {}
) {
  const { isActive = true, searchQuery, propertyType, pageSize = 12 } = options;

  // State for properties with loaded metadata
  const [propertiesWithMetadata, setPropertiesWithMetadata] = useState<PropertyWithMetadata[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // Track which property IDs we've already processed to avoid re-fetching
  const processedIdsRef = useRef<Set<string>>(new Set());
  // Track if we're currently loading to prevent concurrent loads
  const isLoadingRef = useRef(false);

  // Get properties from Ponder with infinite pagination
  const {
    properties: ponderProperties,
    loading: isLoadingPonder,
    loadingMore,
    error: ponderError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = usePonderPropertiesInfinite({
    isActive,
    pageSize,
  });

  // Create a stable key for ponderProperties to detect real changes
  const ponderPropertiesKey = useMemo(() => {
    return ponderProperties.map((p) => p.id).join(",");
  }, [ponderProperties]);

  // Load metadata and prices for new properties when ponderProperties changes
  useEffect(() => {
    // Prevent concurrent loads
    if (isLoadingRef.current) return;

    const loadMetadataAndPrices = async () => {
      if (ponderProperties.length === 0) {
        setPropertiesWithMetadata([]);
        processedIdsRef.current.clear();
        return;
      }

      // Find properties that haven't been processed yet
      const newProperties = ponderProperties.filter((p) => !processedIdsRef.current.has(p.id));

      if (newProperties.length === 0) {
        // All properties already processed, just update the order if needed
        setPropertiesWithMetadata((prev) => {
          const existingMap = new Map(prev.map((p) => [p.id, p]));
          return ponderProperties
            .map((p) => existingMap.get(p.id))
            .filter(Boolean) as PropertyWithMetadata[];
        });
        return;
      }

      isLoadingRef.current = true;
      setIsLoadingMetadata(true);

      try {
        // Mark these as being processed
        newProperties.forEach((p) => processedIdsRef.current.add(p.id));

        // Fetch metadata for new properties in parallel (all at once with IPFS caching)
        const newPropertiesWithMetadata = await Promise.all(
          newProperties.map(async (property) => {
            const metadata = await fetchPropertyMetadata(property.ipfsHash);
            return { ...property, metadata, priceInfo: null } as PropertyWithMetadata;
          })
        );

        // Fetch prices for the new properties
        const propertyIds = newPropertiesWithMetadata.map((p) => p.propertyId.toString());
        const pricesMap = await fetchPropertyPrices(propertyIds);

        // Attach price info to properties
        for (const property of newPropertiesWithMetadata) {
          const priceInfo = pricesMap.get(property.propertyId.toString());
          if (priceInfo) {
            property.priceInfo = priceInfo;
          }
        }

        // Merge with existing properties (preserving order)
        setPropertiesWithMetadata((prev) => {
          const existingMap = new Map(prev.map((p) => [p.id, p]));
          newPropertiesWithMetadata.forEach((p) => existingMap.set(p.id, p));

          // Return in the same order as ponderProperties
          return ponderProperties
            .map((p) => existingMap.get(p.id))
            .filter(Boolean) as PropertyWithMetadata[];
        });
      } finally {
        isLoadingRef.current = false;
        setIsLoadingMetadata(false);
      }
    };

    loadMetadataAndPrices();
  }, [ponderPropertiesKey]); // Only re-run when the actual property IDs change

  // Filter properties based on search query and property type (using IPFS metadata)
  const filteredProperties = useMemo(() => {
    return propertiesWithMetadata.filter((property) => {
      // Filter by property type
      if (propertyType && propertyType !== "all") {
        const metadataType = property.metadata?.propertyType;
        if (metadataType && metadataType.toLowerCase() !== propertyType.toLowerCase()) {
          return false;
        }
      }

      // Filter by search query (location, name, city, country)
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const metadata = property.metadata;

        if (!metadata) return false;

        const searchableFields = [
          metadata.name,
          metadata.location,
          metadata.city,
          metadata.country,
          metadata.address,
          metadata.description,
        ]
          .filter(Boolean)
          .map((f) => f?.toLowerCase() || "");

        const matches = searchableFields.some((field) => field.includes(query));
        if (!matches) return false;
      }

      return true;
    });
  }, [propertiesWithMetadata, searchQuery, propertyType]);

  // Handler to load more
  const loadMore = useCallback(() => {
    if (hasNextPage && !loadingMore && !isLoadingMetadata) {
      fetchNextPage();
    }
  }, [hasNextPage, loadingMore, isLoadingMetadata, fetchNextPage]);

  return {
    properties: filteredProperties,
    allProperties: propertiesWithMetadata,
    loading: isLoadingPonder,
    loadingMore: loadingMore || isLoadingMetadata,
    error: ponderError,
    hasNextPage,
    loadMore,
    refetch,
  };
}
