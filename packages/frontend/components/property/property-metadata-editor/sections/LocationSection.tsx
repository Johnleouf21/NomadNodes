"use client";

import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { SectionProps } from "../types";

/**
 * Location section (country, city, address)
 */
export function LocationSection({
  metadata,
  setMetadata,
  errors,
  isLoading,
  isExpanded,
  onToggle,
}: SectionProps) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 font-semibold">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 px-4 pb-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">
              Country <span className="text-destructive">*</span>
            </Label>
            <Input
              id="country"
              value={metadata.country}
              onChange={(e) => setMetadata({ ...metadata, country: e.target.value })}
              placeholder="e.g., Indonesia"
              disabled={isLoading}
              className={errors.country ? "border-destructive" : ""}
            />
            {errors.country && <p className="text-destructive text-sm">{errors.country}</p>}
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              value={metadata.city}
              onChange={(e) => setMetadata({ ...metadata, city: e.target.value })}
              placeholder="e.g., Bali"
              disabled={isLoading}
              className={errors.city ? "border-destructive" : ""}
            />
            {errors.city && <p className="text-destructive text-sm">{errors.city}</p>}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            value={metadata.address}
            onChange={(e) => setMetadata({ ...metadata, address: e.target.value })}
            placeholder="e.g., 123 Beach Road"
            disabled={isLoading}
          />
          <p className="text-muted-foreground text-xs">
            <MapPin className="mr-1 inline h-3 w-3" />
            The full address is only shared with confirmed guests
          </p>
        </div>

        {/* Location Preview */}
        {metadata.city && metadata.country && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground text-sm font-medium">Location display:</p>
            <p className="text-base font-semibold">
              {metadata.city}, {metadata.country}
            </p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
