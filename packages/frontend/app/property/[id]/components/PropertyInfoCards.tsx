"use client";

import { Info, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAmenityIcon, formatAmenityName } from "./utils";

interface PropertyDescriptionProps {
  description: string;
}

/**
 * Property description card
 */
export function PropertyDescription({ description }: PropertyDescriptionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          About this property
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{description}</p>
      </CardContent>
    </Card>
  );
}

interface PropertyAmenitiesProps {
  amenities: string[];
}

/**
 * Property amenities card
 */
export function PropertyAmenities({ amenities }: PropertyAmenitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Amenities
        </CardTitle>
        <CardDescription>What this property offers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {amenities.map((amenity) => (
            <div
              key={amenity}
              className="bg-muted/50 flex items-center gap-2 rounded-lg border p-3"
            >
              {getAmenityIcon(amenity)}
              <span className="text-sm">{formatAmenityName(amenity)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface PropertyHouseRulesProps {
  houseRules: string[];
}

/**
 * Property house rules card
 */
export function PropertyHouseRules({ houseRules }: PropertyHouseRulesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          House Rules
        </CardTitle>
        <CardDescription>Please follow these rules during your stay</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {houseRules.map((rule, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <span className="text-muted-foreground">{rule}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
