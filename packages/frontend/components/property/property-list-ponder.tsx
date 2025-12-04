"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { PropertyCardPonderWithMetadata } from "./property-card-ponder";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  usePonderPropertiesWithMetadata,
  type PropertyWithMetadata,
} from "@/hooks/usePonderPropertiesWithMetadata";
import { useMemo } from "react";
import type { PropertyFiltersState } from "./property-filters";

interface PropertyListPonderProps {
  searchQuery: string;
  filters: PropertyFiltersState;
  searchFilters?: {
    checkIn?: Date;
    checkOut?: Date;
    guests?: number;
  };
}

export function PropertyListPonder({
  searchQuery,
  filters,
  searchFilters,
}: PropertyListPonderProps) {
  // Note: Availability filtering is done on the property detail page, not here
  // This is because checking availability for all properties would be too expensive
  // (would need to check all room types for all properties)
  // Users will see availability status when they click on a property

  // Get properties from Ponder with IPFS metadata and pagination
  const {
    properties,
    loading: isLoadingPonder,
    loadingMore,
    error,
    hasNextPage,
    loadMore,
  } = usePonderPropertiesWithMetadata({
    isActive: true,
    searchQuery: searchQuery || undefined,
    propertyType: filters.propertyType !== "all" ? filters.propertyType : undefined,
    pageSize: 12,
  });

  // Apply filters (price, amenities) - availability check happens on property detail page
  const filteredProperties = useMemo(() => {
    let result = properties;

    // Require priceInfo for metadata display
    result = result.filter((property: PropertyWithMetadata) => {
      return property.priceInfo && property.priceInfo.roomTypesCount > 0;
    });

    // Filter by amenities (property must have ALL selected amenities)
    if (filters.amenities && filters.amenities.length > 0) {
      result = result.filter((property: PropertyWithMetadata) => {
        const propertyAmenities = property.metadata?.amenities || [];
        // Normalize amenity names for comparison (lowercase, replace spaces with underscores)
        const normalizedPropertyAmenities = propertyAmenities.map((a) =>
          a.toLowerCase().replace(/\s+/g, "_")
        );
        return filters.amenities.every((filterAmenity) =>
          normalizedPropertyAmenities.includes(filterAmenity.toLowerCase())
        );
      });
    }

    // Filter by price range (check if at least one room type price is in range)
    const hasPriceFilter = filters.priceRange[0] > 0 || filters.priceRange[1] < 1000;
    if (hasPriceFilter) {
      result = result.filter((property: PropertyWithMetadata) => {
        const allPrices = property.priceInfo?.allPrices;
        // If no price info, exclude (already filtered above, but keep for safety)
        if (!allPrices || allPrices.length === 0) {
          return false;
        }
        // Check if at least one room type price is within the range
        const [minFilter, maxFilter] = filters.priceRange;
        return allPrices.some((price) => {
          const aboveMin = price >= minFilter;
          const belowMax = maxFilter >= 1000 || price <= maxFilter;
          return aboveMin && belowMax;
        });
      });
    }

    return result;
  }, [properties, filters.amenities, filters.priceRange]);

  const isLoading = isLoadingPonder;

  // Count active filters for display
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.propertyType && filters.propertyType !== "all") count++;
    if (filters.amenities.length > 0) count += filters.amenities.length;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) count++;
    return count;
  }, [filters]);

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
          {error.message || "Failed to fetch properties from indexer"}
        </p>
      </div>
    );
  }

  if (!filteredProperties || filteredProperties.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-medium">No properties found</p>
        <p className="text-muted-foreground text-sm">
          {activeFilterCount > 0
            ? "No properties match your search criteria. Try adjusting your filters."
            : "No properties available at the moment."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {filteredProperties.length} {filteredProperties.length === 1 ? "property" : "properties"}{" "}
          found
          {activeFilterCount > 0 &&
            ` (${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} applied)`}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property: PropertyWithMetadata) => (
          <PropertyCardPonderWithMetadata
            key={property.id}
            property={property}
            startingPrice={property.priceInfo?.lowestPrice}
            currency={property.priceInfo?.currency}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={loadingMore}
            className="min-w-[200px]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Properties"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
