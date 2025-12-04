"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BedDouble,
  Users,
  DollarSign,
  Loader2,
  ExternalLink,
  Wifi,
  Car,
  Tv,
  Wind,
  Utensils,
  Waves,
  Check,
  Home,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchFromIPFS, getIPFSUrl } from "@/lib/utils/ipfs";
import type { RoomTypeData } from "@/lib/hooks/property/types";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

interface RoomDetailModalProps {
  tokenId: string | null;
  propertyId: string | null;
  propertyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Fetch room type from Ponder
async function fetchRoomType(tokenId: string) {
  const graphqlQuery = `
    query {
      roomTypes(where: { tokenId: "${tokenId}" }, limit: 1) {
        items {
          id
          tokenId
          propertyId
          name
          ipfsHash
          pricePerNight
          cleaningFee
          maxGuests
          totalSupply
          isActive
        }
      }
    }
  `;

  const response = await fetch(`${PONDER_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: graphqlQuery }),
  });

  if (!response.ok) throw new Error("Failed to fetch room type");

  const result = await response.json();
  if (result.errors) throw new Error(result.errors[0]?.message || "GraphQL error");

  return result.data?.roomTypes?.items?.[0] || null;
}

// Amenity icons mapping
const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  parking: Car,
  tv: Tv,
  "air conditioning": Wind,
  "air-conditioning": Wind,
  ac: Wind,
  kitchen: Utensils,
  pool: Waves,
};

export function RoomDetailModal({
  tokenId,
  propertyId,
  propertyName,
  open,
  onOpenChange,
}: RoomDetailModalProps) {
  const router = useRouter();

  // Fetch room type data from Ponder
  const { data: roomType, isLoading: loadingRoom } = useQuery({
    queryKey: ["roomType", tokenId],
    queryFn: () => fetchRoomType(tokenId!),
    enabled: !!tokenId && open,
  });

  // Fetch IPFS metadata
  const { data: metadata, isLoading: loadingMetadata } = useQuery({
    queryKey: ["roomTypeMetadata", roomType?.ipfsHash],
    queryFn: () => fetchFromIPFS<RoomTypeData>(roomType.ipfsHash),
    enabled: !!roomType?.ipfsHash && open,
  });

  const isLoading = loadingRoom || loadingMetadata;

  // Parse data
  const pricePerNight = roomType ? Number(roomType.pricePerNight) / 1e6 : 0;
  const cleaningFee = roomType ? Number(roomType.cleaningFee) / 1e6 : 0;
  const maxGuests = roomType ? Number(roomType.maxGuests) : 0;
  const totalSupply = roomType ? Number(roomType.totalSupply) : 0;

  // Get image
  const imageUrl = metadata?.images?.[0]
    ? metadata.images[0].startsWith("http")
      ? metadata.images[0]
      : getIPFSUrl(metadata.images[0])
    : null;

  const handleViewProperty = () => {
    if (propertyId) {
      router.push(`/property/${propertyId}`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5" />
            Room Details
          </DialogTitle>
          <DialogDescription>{propertyName}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : !roomType ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BedDouble className="text-muted-foreground/30 mb-4 h-12 w-12" />
            <p className="text-muted-foreground">Room information not available</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Room Image */}
            <div className="relative overflow-hidden rounded-lg">
              {imageUrl ? (
                <img src={imageUrl} alt={roomType.name} className="h-48 w-full object-cover" />
              ) : (
                <div className="bg-muted flex h-48 w-full items-center justify-center">
                  <BedDouble className="text-muted-foreground/30 h-16 w-16" />
                </div>
              )}
              {roomType.isActive && (
                <Badge className="absolute top-3 right-3 bg-green-500/90">Available</Badge>
              )}
            </div>

            {/* Room Name & Description */}
            <div>
              <h3 className="text-xl font-bold">{metadata?.name || roomType.name}</h3>
              {metadata?.description && (
                <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">
                  {metadata.description}
                </p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Users className="text-muted-foreground mx-auto mb-1 h-5 w-5" />
                <p className="font-semibold">{maxGuests}</p>
                <p className="text-muted-foreground text-xs">Max Guests</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <DollarSign className="text-muted-foreground mx-auto mb-1 h-5 w-5" />
                <p className="font-semibold">${pricePerNight}</p>
                <p className="text-muted-foreground text-xs">Per Night</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Home className="text-muted-foreground mx-auto mb-1 h-5 w-5" />
                <p className="font-semibold">{totalSupply}</p>
                <p className="text-muted-foreground text-xs">Units</p>
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 font-semibold">
                <DollarSign className="h-4 w-4" />
                Pricing
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price per night</span>
                  <span className="font-medium">${pricePerNight.toFixed(2)} USDC</span>
                </div>
                {cleaningFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cleaning fee</span>
                    <span className="font-medium">${cleaningFee.toFixed(2)} USDC</span>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            {metadata?.amenities && metadata.amenities.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <Sparkles className="h-4 w-4" />
                    Room Amenities
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {metadata.amenities.map((amenity, index) => {
                      const IconComponent = amenityIcons[amenity.toLowerCase()] || Check;
                      return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <IconComponent className="text-primary h-4 w-4" />
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button className="flex-1" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button className="flex-1" onClick={handleViewProperty}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Property
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
