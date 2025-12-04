"use client";

import * as React from "react";
import { Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSetPropertyActive } from "@/lib/hooks/usePropertyNFT";

interface PropertyStatusCardProps {
  propertyId: bigint;
  isActive: boolean;
}

export function PropertyStatusCard({ propertyId, isActive }: PropertyStatusCardProps) {
  const { setPropertyActive, isPending } = useSetPropertyActive();

  const handleToggle = () => {
    setPropertyActive(propertyId, !isActive);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Status</CardTitle>
        <CardDescription>Control whether your property is available for booking</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {isActive ? "Property is Active" : "Property is Inactive"}
            </p>
            <p className="text-muted-foreground text-sm">
              {isActive ? "Guests can book this property" : "Property is hidden from guests"}
            </p>
          </div>
          <Button
            onClick={handleToggle}
            disabled={isPending}
            variant={isActive ? "destructive" : "default"}
          >
            <Power className="mr-2 h-4 w-4" />
            {isPending ? "Processing..." : isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
