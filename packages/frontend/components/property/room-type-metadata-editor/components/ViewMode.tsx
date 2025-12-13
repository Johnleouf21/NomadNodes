"use client";

import { Edit2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { RoomTypeData } from "@/lib/hooks/property/types";
import { ROOM_AMENITIES_LIST } from "../constants";

interface ViewModeProps {
  currentMetadata?: Partial<RoomTypeData>;
  onEdit: () => void;
}

/**
 * View mode display for room type metadata
 */
export function ViewMode({ currentMetadata, onEdit }: ViewModeProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Room Details</CardTitle>
            <CardDescription className="text-xs">Metadata stored on IPFS</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit2 className="mr-2 h-3 w-3" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-muted-foreground text-xs">Name</Label>
            <p className="text-sm font-medium">{currentMetadata?.name || "Not set"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Price per Night</Label>
            <p className="text-sm font-medium">
              {currentMetadata?.pricePerNight
                ? `${currentMetadata.pricePerNight} ${currentMetadata.currency || "USD"}`
                : "Not set"}
            </p>
          </div>
        </div>

        {currentMetadata?.description && (
          <div>
            <Label className="text-muted-foreground text-xs">Description</Label>
            <p className="text-sm">{currentMetadata.description}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label className="text-muted-foreground text-xs">Max Guests</Label>
            <p className="text-sm">{currentMetadata?.maxGuests || 2}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Min Stay</Label>
            <p className="text-sm">{currentMetadata?.minStayNights || 1} night(s)</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Max Stay</Label>
            <p className="text-sm">{currentMetadata?.maxStayNights || 30} nights</p>
          </div>
        </div>

        {currentMetadata?.amenities && currentMetadata.amenities.length > 0 && (
          <div>
            <Label className="text-muted-foreground text-xs">Room Amenities</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {currentMetadata.amenities.map((amenity) => {
                const info = ROOM_AMENITIES_LIST.find((a) => a.id === amenity);
                return (
                  <span key={amenity} className="bg-secondary rounded px-2 py-0.5 text-xs">
                    {info?.label || amenity}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {currentMetadata?.images && currentMetadata.images.length > 0 && (
          <div>
            <Label className="text-muted-foreground text-xs">Photos</Label>
            <p className="text-muted-foreground text-xs">{currentMetadata.images.length} photos</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
