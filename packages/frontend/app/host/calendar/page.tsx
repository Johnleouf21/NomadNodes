"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/hooks/useAuth";
import { useHostProperties, usePropertyRoomTypes } from "@/lib/hooks/usePropertyNFT";
import { RoomCalendarAccordion } from "@/components/property/room-calendar-accordion";
import { CalendarPageHeader, PropertySelector } from "./components";

export default function HostCalendarPage() {
  const { address } = useAuth();
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<bigint | null>(null);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  // Fetch user's properties
  const { propertyIds, isLoading: isLoadingProperties } = useHostProperties(address);

  // Memoize propertyIds length to avoid unnecessary re-renders
  const firstPropertyId = propertyIds?.[0];

  // Auto-select first property - using primitive dependency
  React.useEffect(() => {
    if (firstPropertyId && !selectedPropertyId) {
      setSelectedPropertyId(firstPropertyId);
    }
  }, [firstPropertyId, selectedPropertyId]);

  const { data: roomTypeIds } = usePropertyRoomTypes(selectedPropertyId || undefined);

  const handlePreviousMonth = React.useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  }, []);

  const handleNextMonth = React.useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  }, []);

  // Memoize property IDs for PropertySelector to prevent unnecessary re-renders
  const memoizedPropertyIds = React.useMemo(() => propertyIds || [], [propertyIds]);

  return (
    <ProtectedRoute requireSBT="host">
      <div className="container py-8">
        <div className="mb-8">
          <CalendarPageHeader
            currentMonth={currentMonth}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />

          <PropertySelector
            propertyIds={memoizedPropertyIds}
            selectedPropertyId={selectedPropertyId}
            onPropertyChange={setSelectedPropertyId}
            isLoading={isLoadingProperties}
          />

          {/* Room Types Calendar Accordion */}
          {selectedPropertyId && (
            <>
              {!roomTypeIds || (roomTypeIds as bigint[]).length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      This property has no room types configured.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {(roomTypeIds as bigint[]).map((tokenId, index) => (
                    <RoomCalendarAccordion
                      key={tokenId.toString()}
                      tokenId={tokenId}
                      index={index}
                      currentMonth={currentMonth}
                    />
                  ))}
                </Accordion>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
