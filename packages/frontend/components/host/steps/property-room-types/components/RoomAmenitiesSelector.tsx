"use client";

/**
 * Amenities selector for room type
 */

import { Label } from "@/components/ui/label";
import { ROOM_AMENITIES } from "../types";

interface RoomAmenitiesSelectorProps {
  selectedAmenities: string[];
  onToggle: (amenityId: string) => void;
}

/**
 * Grid of amenity buttons
 */
export function RoomAmenitiesSelector({ selectedAmenities, onToggle }: RoomAmenitiesSelectorProps) {
  return (
    <div className="space-y-3 sm:col-span-2">
      <Label>Room Amenities</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ROOM_AMENITIES.map((amenity) => {
          const Icon = amenity.icon;
          const isSelected = selectedAmenities.includes(amenity.id);
          return (
            <button
              key={amenity.id}
              type="button"
              onClick={() => onToggle(amenity.id)}
              className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input hover:bg-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {amenity.label}
            </button>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs">Select amenities available in this room type</p>
    </div>
  );
}
