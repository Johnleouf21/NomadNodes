"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PropertyInfoCardProps {
  propertyType: string;
  totalBookings: number;
  averageRating: number;
  totalReviews: number;
}

export function PropertyInfoCard({
  propertyType,
  totalBookings,
  averageRating,
  totalReviews,
}: PropertyInfoCardProps) {
  const formattedRating = averageRating > 0 ? (averageRating / 100).toFixed(1) : "N/A";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Information</CardTitle>
        <CardDescription>Blockchain data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Type:</span>
          <span className="font-medium capitalize">{propertyType}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Bookings:</span>
          <span className="font-medium">{totalBookings}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Average Rating:</span>
          <span className="font-medium">{formattedRating}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Reviews:</span>
          <span className="font-medium">{totalReviews}</span>
        </div>
      </CardContent>
    </Card>
  );
}
