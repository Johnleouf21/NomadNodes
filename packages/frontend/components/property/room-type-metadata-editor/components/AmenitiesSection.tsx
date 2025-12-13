"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ROOM_AMENITIES_LIST } from "../constants";

interface AmenitiesSectionProps {
  expanded: boolean;
  onToggle: () => void;
  selectedAmenities: string[];
  onToggleAmenity: (amenityId: string) => void;
  isLoading: boolean;
}

/**
 * Amenities section with checkboxes
 */
export function AmenitiesSection({
  expanded,
  onToggle,
  selectedAmenities,
  onToggleAmenity,
  isLoading,
}: AmenitiesSectionProps) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-3 text-sm font-medium">
          Room Amenities
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 px-3 pb-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {ROOM_AMENITIES_LIST.map((amenity) => {
            const Icon = amenity.icon;
            const isSelected = selectedAmenities.includes(amenity.id);
            return (
              <label
                key={amenity.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm transition-colors ${
                  isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleAmenity(amenity.id)}
                  disabled={isLoading}
                />
                <Icon
                  className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                />
                <span>{amenity.label}</span>
              </label>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
