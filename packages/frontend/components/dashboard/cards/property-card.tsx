"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star, Eye, Edit, Power, MoreVertical, MapPin, Bed, Users, Calendar } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { useSetPropertyActive } from "@/lib/hooks/usePropertyNFT";
import { getIPFSUrl } from "@/lib/utils/ipfs";

export interface PropertyCardData {
  id: bigint;
  name: string;
  description?: string;
  location: string;
  country?: string;
  city?: string;
  isActive: boolean;
  totalBookings: number;
  rating: number;
  totalReviews: number;
  propertyType: string;
  images: string[];
  amenities: string[];
  roomTypesCount: number;
  totalRooms: number;
  maxGuests: number;
  createdAt?: Date;
}

interface PropertyCardProps {
  property: PropertyCardData;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { t: _t } = useTranslation();
  const router = useRouter();
  const { setPropertyActive, isPending } = useSetPropertyActive();

  const handleViewProperty = () => {
    router.push(`/property/${property.id}`);
  };

  const handleEditProperty = () => {
    router.push(`/property/${property.id}/edit`);
  };

  const handleManageCalendar = () => {
    router.push("/host/calendar");
  };

  const handleToggleActive = () => {
    setPropertyActive(property.id, !property.isActive);
  };

  // Convert IPFS hashes to URLs for the carousel
  const imageUrls = React.useMemo(() => {
    return (property.images || []).map((img) => getIPFSUrl(img));
  }, [property.images]);

  // Format property type for display
  const propertyTypeLabel = property.propertyType
    ? property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)
    : "Property";

  // Get top amenities to display (max 3)
  const displayAmenities = property.amenities?.slice(0, 3) || [];

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      {/* Image Carousel Section */}
      <div className="relative">
        <ImageCarousel
          images={imageUrls}
          alt={property.name}
          aspectRatio="none"
          showIndicators={true}
          showArrows={true}
          className="h-48 w-full"
          onImageClick={handleViewProperty}
        />

        {/* Status Badge Overlay */}
        <div className="absolute top-3 left-3 z-10">
          <Badge variant={property.isActive ? "default" : "secondary"} className="shadow-sm">
            {property.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1 pr-2">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {propertyTypeLabel}
              </Badge>
              {property.rating > 0 && (
                <div className="flex items-center text-sm">
                  <Star className="mr-0.5 h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{property.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground ml-1">({property.totalReviews})</span>
                </div>
              )}
            </div>
            <h3 className="line-clamp-1 font-bold">{property.name}</h3>
            <div className="text-muted-foreground mt-1 flex items-center text-sm">
              <MapPin className="mr-1 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">
                {property.city && property.country
                  ? `${property.city}, ${property.country}`
                  : property.location}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewProperty}>
                <Eye className="mr-2 h-4 w-4" />
                View Property
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEditProperty}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleManageCalendar}>
                <Calendar className="mr-2 h-4 w-4" />
                Manage Calendar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleToggleActive} disabled={isPending}>
                <Power className="mr-2 h-4 w-4" />
                {isPending ? "Processing..." : property.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Grid */}
        <div className="bg-muted/50 mb-3 grid grid-cols-3 gap-2 rounded-lg p-2">
          <div className="text-center">
            <div className="text-muted-foreground flex items-center justify-center">
              <Bed className="mr-1 h-3.5 w-3.5" />
              <span className="text-xs">Rooms</span>
            </div>
            <p className="font-semibold">{property.roomTypesCount}</p>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground flex items-center justify-center">
              <Users className="mr-1 h-3.5 w-3.5" />
              <span className="text-xs">Guests</span>
            </div>
            <p className="font-semibold">{property.maxGuests || "-"}</p>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground flex items-center justify-center">
              <Calendar className="mr-1 h-3.5 w-3.5" />
              <span className="text-xs">Bookings</span>
            </div>
            <p className="font-semibold">{property.totalBookings}</p>
          </div>
        </div>

        {/* Amenities */}
        {displayAmenities.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {displayAmenities.map((amenity, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs font-normal">
                {amenity}
              </Badge>
            ))}
            {property.amenities?.length > 3 && (
              <Badge variant="secondary" className="text-xs font-normal">
                +{property.amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="flex-1" variant="outline" size="sm" onClick={handleViewProperty}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <Button className="flex-1" size="sm" onClick={handleEditProperty}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
