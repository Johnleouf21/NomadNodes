"use client";

import * as React from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export interface PropertyFiltersState {
  propertyType: string;
  priceRange: [number, number];
  amenities: string[];
}

interface PropertyFiltersProps {
  filters: PropertyFiltersState;
  onFiltersChange: (filters: PropertyFiltersState) => void;
}

const PROPERTY_TYPES = [
  { value: "all", label: "All Properties" },
  { value: "hotel", label: "Hotel" },
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "cabin", label: "Cabin" },
];

const AMENITIES = [
  { value: "wifi", label: "WiFi" },
  { value: "pool", label: "Pool" },
  { value: "kitchen", label: "Kitchen" },
  { value: "parking", label: "Parking" },
  { value: "air_conditioning", label: "Air Conditioning" },
  { value: "heating", label: "Heating" },
  { value: "washer", label: "Washer" },
  { value: "dryer", label: "Dryer" },
  { value: "tv", label: "TV" },
  { value: "gym", label: "Gym" },
  { value: "hot_tub", label: "Hot Tub" },
  { value: "beach_access", label: "Beach Access" },
];

const DEFAULT_FILTERS: PropertyFiltersState = {
  propertyType: "all",
  priceRange: [0, 1000],
  amenities: [],
};

export function PropertyFilters({ filters, onFiltersChange }: PropertyFiltersProps) {
  const { t } = useTranslation();

  const handlePropertyTypeChange = (value: string) => {
    onFiltersChange({ ...filters, propertyType: value });
  };

  const handlePriceRangeChange = (value: number[]) => {
    onFiltersChange({ ...filters, priceRange: [value[0], value[1]] });
  };

  const handleAmenityToggle = (amenity: string, checked: boolean) => {
    const newAmenities = checked
      ? [...filters.amenities, amenity]
      : filters.amenities.filter((a) => a !== amenity);
    onFiltersChange({ ...filters, amenities: newAmenities });
  };

  const handleClearAll = () => {
    onFiltersChange(DEFAULT_FILTERS);
  };

  const hasActiveFilters =
    filters.propertyType !== "all" ||
    filters.priceRange[0] !== 0 ||
    filters.priceRange[1] !== 1000 ||
    filters.amenities.length > 0;

  const activeFilterCount =
    (filters.propertyType !== "all" ? 1 : 0) +
    (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 1000 ? 1 : 0) +
    filters.amenities.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <CardTitle>{t("common.filters")}</CardTitle>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            <X className="mr-1 h-3 w-3" />
            {t("filters.clear_all")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Type */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">{t("filters.property_type")}</Label>
          <RadioGroup
            value={filters.propertyType || "all"}
            onValueChange={handlePropertyTypeChange}
          >
            {PROPERTY_TYPES.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <RadioGroupItem value={type.value} id={`type-${type.value}`} />
                <Label htmlFor={`type-${type.value}`} className="cursor-pointer font-normal">
                  {type.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Price Range */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">{t("filters.price_range")}</Label>
          <div className="px-2">
            <Slider
              min={0}
              max={1000}
              step={10}
              value={filters.priceRange}
              onValueChange={handlePriceRangeChange}
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">${filters.priceRange[0]}</span>
            <span className="text-muted-foreground">per night</span>
            <span className="font-medium">
              ${filters.priceRange[1]}
              {filters.priceRange[1] >= 1000 && "+"}
            </span>
          </div>
        </div>

        <Separator />

        {/* Amenities */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">{t("filters.amenities")}</Label>
          <div className="grid grid-cols-1 gap-2">
            {AMENITIES.map((amenity) => (
              <div key={amenity.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity.value}`}
                  checked={filters.amenities.includes(amenity.value)}
                  onCheckedChange={(checked) =>
                    handleAmenityToggle(amenity.value, checked as boolean)
                  }
                />
                <Label htmlFor={`amenity-${amenity.value}`} className="cursor-pointer font-normal">
                  {amenity.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Active Amenities Display */}
        {filters.amenities.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Selected amenities</Label>
              <div className="flex flex-wrap gap-1">
                {filters.amenities.map((amenity) => {
                  const amenityLabel = AMENITIES.find((a) => a.value === amenity)?.label || amenity;
                  return (
                    <Badge
                      key={amenity}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleAmenityToggle(amenity, false)}
                    >
                      {amenityLabel}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { DEFAULT_FILTERS };
