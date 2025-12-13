"use client";

import { Home } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PropertyPerformance } from "../types";

interface PropertyPerformanceCardProps {
  propertyPerformance: PropertyPerformance[];
}

/**
 * Property performance ranking card
 */
export function PropertyPerformanceCard({ propertyPerformance }: PropertyPerformanceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Property Performance
        </CardTitle>
        <CardDescription>Revenue by property</CardDescription>
      </CardHeader>
      <CardContent>
        {propertyPerformance.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No bookings yet</p>
        ) : (
          <div className="space-y-4">
            {propertyPerformance.slice(0, 5).map((property) => (
              <div key={property.id} className="flex items-center gap-3">
                <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg">
                  {property.image ? (
                    <img
                      src={property.image}
                      alt={property.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Home className="text-muted-foreground h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{property.name}</p>
                  <p className="text-muted-foreground text-xs">{property.bookings} bookings</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{property.revenue.toFixed(2)}</p>
                  <p className="text-muted-foreground text-xs">stables</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
