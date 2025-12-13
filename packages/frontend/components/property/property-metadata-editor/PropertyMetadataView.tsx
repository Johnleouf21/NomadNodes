"use client";

import { Edit2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AMENITIES_LIST, HOUSE_RULES_LIST } from "./constants";
import type { PropertyMetadataViewProps } from "./types";

/**
 * View mode for property metadata
 */
export function PropertyMetadataView({
  currentMetadata,
  currentMetadataURI,
  onEdit,
}: PropertyMetadataViewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Property Metadata</CardTitle>
            <CardDescription>Information stored on IPFS</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Name</Label>
            <p className="text-lg font-semibold">{currentMetadata?.name || "Not set"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Description</Label>
            <p className="text-sm">{currentMetadata?.description || "No description"}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Property Type</Label>
              <p className="text-sm font-medium capitalize">
                {currentMetadata?.propertyType || "Not set"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Location</Label>
              <p className="text-sm font-medium">
                {currentMetadata?.location ||
                  `${currentMetadata?.city || ""}, ${currentMetadata?.country || ""}` ||
                  "Not set"}
              </p>
            </div>
          </div>
        </div>

        {/* Photos */}
        {currentMetadata?.images && currentMetadata.images.length > 0 && (
          <div>
            <Label className="text-muted-foreground">
              Photos ({currentMetadata.images.length})
            </Label>
            <p className="text-muted-foreground text-sm">
              {currentMetadata.images.length} photos uploaded
            </p>
          </div>
        )}

        {/* Amenities */}
        {currentMetadata?.amenities && currentMetadata.amenities.length > 0 && (
          <div>
            <Label className="text-muted-foreground">Amenities</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {currentMetadata.amenities.map((amenity) => {
                const amenityInfo = AMENITIES_LIST.find((a) => a.id === amenity);
                return (
                  <span
                    key={amenity}
                    className="bg-secondary rounded-full px-3 py-1 text-xs capitalize"
                  >
                    {amenityInfo?.label || amenity.replace("_", " ")}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* House Rules */}
        {currentMetadata?.houseRules && currentMetadata.houseRules.length > 0 && (
          <div>
            <Label className="text-muted-foreground">House Rules</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {currentMetadata.houseRules.map((rule) => {
                const ruleInfo = HOUSE_RULES_LIST.find((r) => r.id === rule);
                return (
                  <span key={rule} className="bg-secondary rounded-full px-3 py-1 text-xs">
                    {ruleInfo?.label || rule.replace("_", " ")}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* IPFS Hash */}
        {currentMetadataURI && (
          <div>
            <Label className="text-muted-foreground">IPFS Hash</Label>
            <p className="text-muted-foreground font-mono text-xs">{currentMetadataURI}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
