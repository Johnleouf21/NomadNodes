"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AMENITIES_LIST, HOUSE_RULES_LIST } from "../constants";
import type { PropertyMetadata } from "@/lib/hooks/property/types";

interface AmenitiesSectionProps {
  metadata: PropertyMetadata;
  isLoading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleAmenity: (amenityId: string) => void;
  onToggleRule: (ruleId: string) => void;
}

/**
 * Amenities and house rules section
 */
export function AmenitiesSection({
  metadata,
  isLoading,
  isExpanded,
  onToggle,
  onToggleAmenity,
  onToggleRule,
}: AmenitiesSectionProps) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 font-semibold">
          <span>Amenities & House Rules</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-6 px-4 pb-4">
        {/* Amenities */}
        <div className="space-y-3">
          <Label>What amenities do you offer?</Label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {AMENITIES_LIST.map((amenity) => {
              const Icon = amenity.icon;
              const isSelected = metadata.amenities.includes(amenity.id);
              return (
                <label
                  key={amenity.id}
                  htmlFor={`amenity-${amenity.id}`}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Checkbox
                    id={`amenity-${amenity.id}`}
                    checked={isSelected}
                    onCheckedChange={() => onToggleAmenity(amenity.id)}
                    disabled={isLoading}
                  />
                  <Icon
                    className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span className="text-sm font-medium">{amenity.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* House Rules */}
        <div className="space-y-3">
          <Label>House Rules</Label>
          <div className="space-y-2">
            {HOUSE_RULES_LIST.map((rule) => (
              <label
                key={rule.id}
                htmlFor={`rule-${rule.id}`}
                className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <Checkbox
                  id={`rule-${rule.id}`}
                  checked={metadata.houseRules.includes(rule.id)}
                  onCheckedChange={() => onToggleRule(rule.id)}
                  disabled={isLoading}
                />
                <span className="text-sm">{rule.label}</span>
              </label>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
