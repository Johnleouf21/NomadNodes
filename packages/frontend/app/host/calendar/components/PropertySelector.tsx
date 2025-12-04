"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePropertyById, usePropertyMetadata } from "@/lib/hooks/usePropertyNFT";

interface PropertySelectorProps {
  propertyIds: bigint[];
  selectedPropertyId: bigint | null;
  onPropertyChange: (propertyId: bigint) => void;
  isLoading: boolean;
}

export function PropertySelector({
  propertyIds,
  selectedPropertyId,
  onPropertyChange,
  isLoading,
}: PropertySelectorProps) {
  const router = useRouter();
  const { data: propertyData } = usePropertyById(selectedPropertyId || undefined);
  const data = propertyData as any;
  const { data: propertyMetadata } = usePropertyMetadata(data?.ipfsMetadataHash);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading properties...</p>;
  }

  if (!propertyIds || propertyIds.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">
            You don't have any properties yet. Create one to start managing availability.
          </p>
          <Button onClick={() => router.push("/host/create-property")}>Create Property</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mb-6 flex items-center gap-4">
      <label className="text-sm font-medium">Select Property:</label>
      <Select
        value={selectedPropertyId?.toString() || ""}
        onValueChange={(value) => onPropertyChange(BigInt(value))}
      >
        <SelectTrigger className="w-[300px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {propertyIds.map((id) => (
            <PropertySelectItem key={id.toString()} propertyId={id} />
          ))}
        </SelectContent>
      </Select>
      {propertyData ? (
        <Badge variant="outline">
          {String(propertyMetadata?.location || data?.location || "Unknown Location")}
        </Badge>
      ) : null}
    </div>
  );
}

// Helper component to display property name in select
function PropertySelectItem({ propertyId }: { propertyId: bigint }) {
  const { data: propertyData } = usePropertyById(propertyId);
  const data = propertyData as any;
  const { data: metadata } = usePropertyMetadata(data?.ipfsMetadataHash);

  return (
    <SelectItem value={propertyId.toString()}>
      {metadata?.name || `Property #${propertyId.toString()}`}
    </SelectItem>
  );
}
