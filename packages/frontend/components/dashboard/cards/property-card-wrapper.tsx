"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePropertyById,
  usePropertyMetadata,
  usePropertyRoomTypes,
} from "@/lib/hooks/usePropertyNFT";
import { PropertyCard, type PropertyCardData } from "./property-card";

interface PropertyCardWrapperProps {
  propertyId: bigint;
}

/**
 * Wrapper component that loads property data from blockchain
 * and IPFS metadata, then passes it to PropertyCard for display
 */
export function PropertyCardWrapper({ propertyId }: PropertyCardWrapperProps) {
  const { data: propertyData, isLoading: isLoadingProperty, refetch } = usePropertyById(propertyId);

  // Fetch IPFS metadata
  const data = propertyData as any;
  const ipfsHash = data?.ipfsMetadataHash;
  const { data: metadata, isLoading: isLoadingMetadata } = usePropertyMetadata(ipfsHash);

  // Fetch room types for this property
  const { data: roomTypeIds, isLoading: _isLoadingRoomTypes } = usePropertyRoomTypes(propertyId);

  const isLoading = isLoadingProperty || isLoadingMetadata;

  if (isLoading) {
    return <PropertyCardSkeleton />;
  }

  if (!propertyData) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex h-[400px] flex-col items-center justify-center p-12">
          <p className="mb-2 text-sm font-semibold">Unable to load property</p>
          <p className="text-muted-foreground mb-4 text-xs">Property #{propertyId.toString()}</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate max guests from room types (we'd need to fetch each room type's data)
  // For now, use a reasonable estimate based on room count
  const roomTypesCount = (roomTypeIds as bigint[])?.length || 0;
  const estimatedMaxGuests = roomTypesCount * 2; // Rough estimate

  // Transform blockchain data to PropertyCardData format
  // Prefer IPFS metadata over blockchain data for display fields
  const property: PropertyCardData = {
    id: propertyId,
    name: metadata?.name || `Property #${propertyId.toString()}`,
    description: metadata?.description,
    location: metadata?.location || data.location || "Unknown Location",
    country: metadata?.country,
    city: metadata?.city,
    isActive: Boolean(data.isActive),
    totalBookings: Number(data.totalBookings || 0n),
    rating: Number(data.averageRating || 0n) / 100,
    totalReviews: Number(data.totalReviewsReceived || 0n),
    propertyType: metadata?.propertyType || data.propertyType || "unknown",
    images: metadata?.images || [],
    amenities: metadata?.amenities || [],
    roomTypesCount: roomTypesCount,
    totalRooms: roomTypesCount, // Could be enhanced with actual supply count
    maxGuests: estimatedMaxGuests,
    createdAt: data.createdAt ? new Date(Number(data.createdAt) * 1000) : undefined,
  };

  return <PropertyCard property={property} />;
}

/**
 * Skeleton loader for property card
 */
function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="h-48 w-full rounded-none" />

      <CardContent className="p-4">
        {/* Header skeleton */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>

        {/* Stats skeleton */}
        <div className="bg-muted/50 mb-3 grid grid-cols-3 gap-2 rounded-lg p-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-6" />
            </div>
          ))}
        </div>

        {/* Amenities skeleton */}
        <div className="mb-3 flex gap-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-12" />
        </div>

        {/* Buttons skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}
