"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Users } from "lucide-react";
import { formatAddress } from "@/lib/utils";

interface PropertyCardProps {
  property: {
    id: number;
    name: string;
    location: string;
    propertyType: string;
    pricePerNight: number;
    rating: number;
    reviews: number;
    image: string;
    host: string;
    maxGuests: number;
  };
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Link href={`/property/${property.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={property.image}
            alt={property.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <Badge
            variant="secondary"
            className="bg-background/90 absolute top-2 right-2 backdrop-blur"
          >
            {property.propertyType}
          </Badge>
        </div>

        <CardContent className="p-4">
          {/* Location */}
          <div className="text-muted-foreground mb-2 flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3" />
            <span>{property.location}</span>
          </div>

          {/* Name */}
          <h3 className="mb-2 line-clamp-1 text-lg font-semibold">{property.name}</h3>

          {/* Rating & Reviews */}
          <div className="mb-3 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{property.rating}</span>
            </div>
            <span className="text-muted-foreground text-sm">({property.reviews} reviews)</span>
          </div>

          {/* Max Guests */}
          <div className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
            <Users className="h-4 w-4" />
            <span>Up to {property.maxGuests} guests</span>
          </div>

          {/* Price & Host */}
          <div className="flex items-end justify-between border-t pt-3">
            <div>
              <p className="text-muted-foreground text-sm">From</p>
              <p className="text-xl font-bold">
                ${property.pricePerNight}
                <span className="text-muted-foreground text-sm font-normal"> / night</span>
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
