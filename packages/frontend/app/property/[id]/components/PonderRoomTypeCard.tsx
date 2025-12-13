"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, Calendar, Clock, Bed, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { useAuth } from "@/lib/hooks/useAuth";
import { getIPFSUrl } from "@/lib/utils/ipfs";
import { formatAmenityName } from "./utils";
import type { PonderRoomTypeCardProps } from "./types";

/**
 * Room type card that uses pre-loaded Ponder data with metadata
 */
export function PonderRoomTypeCard({
  roomType,
  propertyId,
  isAvailable = true,
}: PonderRoomTypeCardProps) {
  const router = useRouter();
  const { address } = useAuth();
  const metadata = roomType.meta_data;

  // Get image URLs
  const imageUrls = useMemo(() => {
    if (!metadata?.images || metadata.images.length === 0) {
      return [];
    }
    return metadata.images.map((img) => getIPFSUrl(img));
  }, [metadata?.images]);

  const canBook = !!address && isAvailable;
  const pricePerNight = metadata?.pricePerNight || 0;
  const currency = metadata?.currency || "USD";
  const currencySymbol = currency === "EUR" ? "€" : "$";
  const maxSupply = Number(roomType.totalSupply || 0);
  const maxGuests = metadata?.maxGuests || Number(roomType.maxGuests || 0);
  const minStayNights = metadata?.minStayNights || 1;
  const maxStayNights = metadata?.maxStayNights || 30;

  return (
    <div className="bg-card overflow-hidden rounded-xl border transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        {/* Room Image */}
        <div className="relative h-48 w-full shrink-0 sm:h-auto sm:w-48">
          {imageUrls.length > 0 ? (
            <ImageCarousel
              images={imageUrls}
              alt={metadata?.name || roomType.name}
              aspectRatio="none"
              className="h-full w-full"
              showIndicators={imageUrls.length > 1}
              showArrows={imageUrls.length > 1}
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <ImageIcon className="text-muted-foreground/50 h-12 w-12" />
            </div>
          )}
        </div>

        {/* Room Details */}
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-semibold">{metadata?.name || roomType.name}</h4>
              {!isAvailable && (
                <Badge variant="destructive" className="text-xs">
                  Épuisé
                </Badge>
              )}
            </div>
            {metadata?.description && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {metadata.description}
              </p>
            )}
          </div>

          {/* Room Features */}
          <div className="text-muted-foreground mb-3 flex flex-wrap items-center gap-3 text-sm">
            {maxGuests > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {maxGuests} guest{maxGuests !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {minStayNights > 0 && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Min {minStayNights} night{minStayNights !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {maxStayNights > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Max {maxStayNights} nights</span>
              </div>
            )}
            {maxSupply > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>
                  {maxSupply} unit{maxSupply !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Room Amenities (compact) */}
          {metadata?.amenities && metadata.amenities.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {metadata.amenities.slice(0, 4).map((amenity) => (
                <Badge key={amenity} variant="outline" className="text-xs">
                  {formatAmenityName(amenity)}
                </Badge>
              ))}
              {metadata.amenities.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{metadata.amenities.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* Price and Book Button */}
          <div className="mt-auto flex items-end justify-between">
            <div>
              {pricePerNight > 0 ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">
                    {currencySymbol}
                    {pricePerNight.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground text-sm">/ night</span>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Price on request</span>
              )}
            </div>
            <Button
              onClick={() => router.push(`/property/${propertyId}/book/${roomType.tokenId}`)}
              disabled={!canBook}
              size="sm"
              variant={!isAvailable ? "secondary" : "default"}
            >
              {!address ? "Connect Wallet" : !isAvailable ? "Épuisé" : "Book Now"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
