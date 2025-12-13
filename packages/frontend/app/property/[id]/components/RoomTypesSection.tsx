"use client";

import { Bed, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { GuestSelector } from "@/components/ui/guest-selector";
import { PonderRoomTypeCard } from "./PonderRoomTypeCard";
import type { RoomTypesSectionProps } from "./types";

/**
 * Room types section with date picker and availability
 */
export function RoomTypesSection({
  roomTypes,
  propertyId,
  totalRoomUnits,
  isLoading,
  isLoadingAvailability,
  hasUserDateFilters,
  availableRoomTypesCount,
  dateRange,
  onDateRangeChange,
  guests,
  onGuestsChange,
  calendarAvailableDates,
  calendarUnavailableDates,
  isLoadingCalendarAvailability,
}: RoomTypesSectionProps) {
  const totalRoomTypesCount = roomTypes.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bed className="h-5 w-5" />
          Room Types
        </CardTitle>
        <CardDescription>
          {totalRoomTypesCount > 0
            ? `${totalRoomTypesCount} room type${totalRoomTypesCount !== 1 ? "s" : ""} • ${totalRoomUnits} room${totalRoomUnits !== 1 ? "s" : ""} total`
            : "No rooms configured"}
        </CardDescription>
        {/* Interactive date and guest selection */}
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={onDateRangeChange}
                placeholder="Select dates to check availability"
                className="w-full"
                availableDates={calendarAvailableDates}
                unavailableDates={calendarUnavailableDates}
                availabilityLoading={isLoadingCalendarAvailability}
              />
            </div>
            <div className="w-full sm:w-40">
              <GuestSelector guests={guests} onGuestsChange={onGuestsChange} className="w-full" />
            </div>
          </div>
          {/* Availability status indicator */}
          {hasUserDateFilters && (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                isLoadingAvailability
                  ? "bg-muted/50"
                  : availableRoomTypesCount > 0
                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : "bg-red-500/10 text-red-700 dark:text-red-400"
              }`}
            >
              {isLoadingAvailability ? (
                <>
                  <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  <span>Checking availability...</span>
                </>
              ) : availableRoomTypesCount > 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    <strong>{availableRoomTypesCount}</strong> room type
                    {availableRoomTypesCount !== 1 ? "s" : ""} available for your dates
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <span>No rooms available for selected dates</span>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || (hasUserDateFilters && isLoadingAvailability) ? (
          <div className="flex items-center justify-center py-8">
            <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : roomTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bed className="text-muted-foreground/50 mb-2 h-12 w-12" />
            <p className="text-muted-foreground">No room types configured</p>
          </div>
        ) : (
          <div className="space-y-4">
            {roomTypes.map((roomType) => (
              <PonderRoomTypeCard
                key={roomType.id}
                roomType={roomType}
                propertyId={propertyId.toString()}
                isAvailable={roomType.isAvailable}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
