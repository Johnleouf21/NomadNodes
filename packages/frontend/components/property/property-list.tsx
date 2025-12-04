"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { PropertyCard } from "./property-card";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { usePropertySearchWithFilters, usePropertyById } from "@/lib/hooks/property";
import { useMemo } from "react";
import type { PropertyData } from "@/lib/hooks/property/types";

interface PropertyListProps {
  searchQuery: string;
  filters: {
    propertyType: string;
    minPrice: string;
    maxPrice: string;
    guests: string;
  };
  searchFilters?: {
    checkIn?: Date;
    checkOut?: Date;
    guests?: number;
  };
}

export function PropertyList({
  searchQuery: _searchQuery,
  filters,
  searchFilters,
}: PropertyListProps) {
  const { t } = useTranslation();

  // Use blockchain search with date/guest filters
  const {
    data: tokenIds,
    isLoading,
    error,
    isFiltered,
  } = usePropertySearchWithFilters({
    checkIn: searchFilters?.checkIn,
    checkOut: searchFilters?.checkOut,
    guests: searchFilters?.guests,
  });

  // Extract unique property IDs from token IDs
  const propertyIds = useMemo(() => {
    if (!tokenIds || tokenIds.length === 0) return [];

    // TokenId format: (propertyId << 128) | roomTypeId
    // Extract propertyId by shifting right 128 bits
    const uniquePropertyIds = new Set<string>();
    tokenIds.forEach((tokenId) => {
      const propertyId = tokenId >> 128n;
      uniquePropertyIds.add(propertyId.toString());
    });

    return Array.from(uniquePropertyIds).map((id) => BigInt(id));
  }, [tokenIds]);

  // Filter by property type if specified
  const filteredPropertyIds = useMemo(() => {
    if (!filters.propertyType || filters.propertyType === "all") {
      return propertyIds;
    }
    // For now, return all - property type filtering from metadata will be added when loading properties
    return propertyIds;
  }, [propertyIds, filters.propertyType]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-center">
        <p className="text-destructive text-lg font-medium">Error loading properties</p>
        <p className="text-muted-foreground text-sm">
          {(error as Error)?.message || "Failed to fetch properties from blockchain"}
        </p>
      </div>
    );
  }

  if (!filteredPropertyIds || filteredPropertyIds.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-medium">No properties found</p>
        <p className="text-muted-foreground text-sm">
          {isFiltered
            ? "No properties match your search criteria. Try adjusting your dates or guest count."
            : "No properties available at the moment."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {filteredPropertyIds.length}{" "}
          {filteredPropertyIds.length === 1 ? "property" : "properties"} found
          {isFiltered && " (filtered by availability)"}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPropertyIds.map((propertyId) => (
          <PropertyCardWrapper key={propertyId.toString()} propertyId={propertyId} />
        ))}
      </div>
    </div>
  );
}

// Wrapper component to load property data
function PropertyCardWrapper({ propertyId }: { propertyId: bigint }) {
  const { data, isLoading } = usePropertyById(propertyId);
  const property = data as PropertyData | undefined;

  if (isLoading) {
    return (
      <div className="bg-card flex h-64 items-center justify-center rounded-lg border">
        <Loader2 className="text-primary h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!property) return null;

  // Convert blockchain property to card format
  const propertyData = {
    id: Number(propertyId),
    name: property.ipfsMetadataHash, // Will be replaced with actual name from IPFS
    location: property.location,
    propertyType: property.propertyType,
    pricePerNight: 0, // Will need to get from room types
    rating: Number(property.averageRating) / 100, // Convert from basis points
    reviews: Number(property.totalRatings),
    image: "", // Will be loaded from IPFS
    host: property.hostWallet,
    maxGuests: 0, // Will aggregate from room types
  };

  return <PropertyCard property={propertyData} />;
}
