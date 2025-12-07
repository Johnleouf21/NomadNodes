"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { Star, MapPin, Home } from "lucide-react";
import { formatAddress } from "@/lib/utils";
import { useIPFSData } from "@/lib/hooks/property/useIPFSMetadata";
import { getIPFSUrl } from "@/lib/utils/ipfs";
import type { PropertyMetadata } from "@/lib/hooks/property/types";
import type { PonderProperty } from "@/hooks/usePonderProperties";
import type { PropertyWithMetadata } from "@/hooks/usePonderPropertiesWithMetadata";

interface PropertyCardPonderProps {
  property: PonderProperty;
}

interface PropertyCardPonderWithMetadataProps {
  property: PropertyWithMetadata;
  startingPrice?: number;
  currency?: string;
}

export function PropertyCardPonder({ property }: PropertyCardPonderProps) {
  // Fetch metadata from IPFS
  const { data: metadata, isLoading } = useIPFSData<PropertyMetadata>(property.ipfsHash);

  // Get first image URL or placeholder
  const coverImage = metadata?.images?.[0]
    ? getIPFSUrl(metadata.images[0])
    : "/placeholder-property.svg";

  // Calculate rating (stored as basis points in contract)
  const rating = Number(property.averageRating) / 100;
  const reviews = Number(property.totalRatings);

  // Display values
  const displayName = metadata?.name || `Property #${property.propertyId}`;
  const displayLocation = metadata?.location || property.location || "Location not set";
  const displayType = metadata?.propertyType || property.propertyType || "Property";

  if (isLoading) {
    return <PropertyCardSkeleton />;
  }

  return (
    <Link href={`/property/${property.propertyId}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        {/* Image */}
        <div className="bg-muted relative aspect-[4/3] overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt={displayName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-property.svg";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Home className="text-muted-foreground/50 h-12 w-12" />
            </div>
          )}
          <Badge
            variant="secondary"
            className="bg-background/90 absolute top-2 right-2 capitalize backdrop-blur"
          >
            {displayType}
          </Badge>
        </div>

        <CardContent className="p-4">
          {/* Location */}
          <div className="text-muted-foreground mb-2 flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{displayLocation}</span>
          </div>

          {/* Name */}
          <h3 className="mb-2 line-clamp-1 text-lg font-semibold">{displayName}</h3>

          {/* Description preview */}
          {metadata?.description && (
            <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
              {metadata.description}
            </p>
          )}

          {/* Rating & Reviews */}
          <div className="mb-3 flex items-center gap-2">
            {reviews > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{rating.toFixed(1)}</span>
                </div>
                <span className="text-muted-foreground text-sm">
                  ({reviews} {reviews === 1 ? "review" : "reviews"})
                </span>
              </>
            ) : (
              <span className="text-muted-foreground text-sm">No reviews yet</span>
            )}
          </div>

          {/* Amenities preview */}
          {metadata?.amenities && metadata.amenities.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {metadata.amenities.slice(0, 3).map((amenity) => (
                <Badge key={amenity} variant="outline" className="text-xs capitalize">
                  {amenity.replace("_", " ")}
                </Badge>
              ))}
              {metadata.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{metadata.amenities.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Rating & Host */}
          <div className="flex items-end justify-between border-t pt-3">
            <div>
              <p className="text-muted-foreground text-xs">
                {reviews} review{reviews !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Host</p>
              <p className="font-mono text-xs">{formatAddress(property.host)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Skeleton loader for the property card
function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-4">
        <Skeleton className="mb-2 h-4 w-1/2" />
        <Skeleton className="mb-2 h-6 w-3/4" />
        <Skeleton className="mb-3 h-4 w-full" />
        <Skeleton className="mb-3 h-4 w-1/3" />
        <div className="flex justify-between border-t pt-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Property card component that uses pre-loaded IPFS metadata
 * This avoids redundant IPFS fetches when metadata is already loaded
 */
export function PropertyCardPonderWithMetadata({
  property,
  startingPrice,
  currency = "USD",
}: PropertyCardPonderWithMetadataProps) {
  const metadata = property.metadata;

  // Get all image URLs
  const imageUrls = useMemo(() => {
    if (!metadata?.images || metadata.images.length === 0) {
      return [];
    }
    return metadata.images.map((img) => getIPFSUrl(img));
  }, [metadata?.images]);

  // Calculate rating (stored as basis points in contract)
  const rating = Number(property.averageRating) / 100;
  const reviews = Number(property.totalRatings);

  // Display values - prefer IPFS metadata
  const displayName = metadata?.name || `Property #${property.propertyId}`;
  const displayLocation =
    metadata?.city && metadata?.country
      ? `${metadata.city}, ${metadata.country}`
      : metadata?.location || "Location not set";
  const displayType = metadata?.propertyType || property.propertyType || "Property";

  return (
    <Link href={`/property/${property.propertyId}`}>
      <Card className="group dark:border-border dark:hover:border-primary dark:hover:ring-primary/30 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:border dark:hover:ring-2">
        {/* Image Carousel */}
        <div className="relative">
          <ImageCarousel
            images={imageUrls}
            alt={displayName}
            aspectRatio="wide"
            showIndicators={true}
            showArrows={true}
          />
          <Badge
            variant="secondary"
            className="bg-background/90 absolute top-2 right-2 z-10 capitalize backdrop-blur"
          >
            {displayType}
          </Badge>
        </div>

        <CardContent className="p-4">
          {/* Location & Rating Row */}
          <div className="mb-2 flex items-center justify-between">
            <div className="text-muted-foreground flex items-center gap-1 text-sm">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{displayLocation}</span>
            </div>
            {reviews > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Name */}
          <h3 className="mb-2 line-clamp-1 text-lg font-semibold">{displayName}</h3>

          {/* Description preview - single line */}
          {metadata?.description && (
            <p className="text-muted-foreground mb-3 line-clamp-1 text-sm">
              {metadata.description}
            </p>
          )}

          {/* Amenities preview */}
          {metadata?.amenities && metadata.amenities.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {metadata.amenities.slice(0, 3).map((amenity) => (
                <Badge key={amenity} variant="outline" className="text-xs capitalize">
                  {amenity.replace(/_/g, " ")}
                </Badge>
              ))}
              {metadata.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{metadata.amenities.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Price & Stats Footer */}
          <div className="flex items-end justify-between border-t pt-3">
            <div>
              {startingPrice !== undefined && startingPrice > 0 ? (
                <div>
                  <span className="text-lg font-bold">
                    {currency === "EUR" ? "€" : "$"}
                    {startingPrice.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground text-sm"> / night</span>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Price on request</p>
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              {reviews > 0 && (
                <span>
                  {reviews} {reviews === 1 ? "review" : "reviews"}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export { PropertyCardSkeleton };
