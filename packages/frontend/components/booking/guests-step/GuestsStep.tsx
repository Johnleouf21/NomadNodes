"use client";

/**
 * GuestsStep component - main component for guest selection step
 */

import * as React from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useBookingStore } from "@/lib/store/useBookingStore";

import type { GuestsStepProps } from "./types";
import { useGuestsState, useRoomManagement, usePriceSummary } from "./hooks";
import {
  GuestCounter,
  CapacityStatus,
  RoomSelectorSection,
  PriceSummarySection,
  SpecialRequests,
} from "./components";

export function GuestsStep({
  onNext,
  onBack,
  maxGuests = 10,
  initialGuests = 1,
  propertyId,
  currentRoomTokenId,
  currentRoomName,
  currentRoomPrice = 0,
  currentRoomCurrency = "USD",
  checkIn,
  checkOut,
  totalNights = 1,
}: GuestsStepProps) {
  const { bookingData, addRoom, calculateTotal } = useBookingStore();
  const selectedRooms = bookingData.rooms;

  // Guest state management
  const {
    adults,
    setAdults,
    children,
    setChildren,
    specialRequests,
    setSpecialRequests,
    showRoomSelector,
    setShowRoomSelector,
    totalGuests,
    totalCapacity,
    isOverCapacity,
    additionalGuestsNeeded,
  } = useGuestsState({
    initialGuests,
    maxGuests,
    selectedRooms,
  });

  // Room management
  const { handleAddRoom, handleRemoveRoom, updateRoomQuantity } = useRoomManagement();

  // Price summary calculation
  const priceSummary = usePriceSummary({
    selectedRooms,
    currentRoomPrice,
    currentRoomName,
    currentRoomCurrency,
    totalNights,
  });

  // Track if we've already initialized the room
  const hasInitialized = React.useRef(false);

  // Initialize current room in booking - only once on mount
  React.useEffect(() => {
    if (!hasInitialized.current && currentRoomTokenId && selectedRooms.length === 0) {
      hasInitialized.current = true;
      addRoom({
        tokenId: currentRoomTokenId,
        roomName: currentRoomName || "Room",
        pricePerNight: currentRoomPrice,
        maxGuests: maxGuests,
        quantity: 1,
        currency: currentRoomCurrency,
      });
    }
  }, [
    currentRoomTokenId,
    currentRoomName,
    currentRoomPrice,
    maxGuests,
    currentRoomCurrency,
    selectedRooms.length,
    addRoom,
  ]);

  // Recalculate total when rooms change
  React.useEffect(() => {
    calculateTotal();
  }, [selectedRooms, calculateTotal]);

  // Auto-show room selector when over capacity
  React.useEffect(() => {
    if (isOverCapacity && !showRoomSelector) {
      setShowRoomSelector(true);
    }
  }, [isOverCapacity, showRoomSelector, setShowRoomSelector]);

  const handleNext = () => {
    if (totalGuests < 1) {
      toast.error("At least 1 guest is required");
      return;
    }

    if (isOverCapacity) {
      toast.error(
        `You need to add more rooms to accommodate ${totalGuests} guests. Current capacity: ${totalCapacity}`
      );
      return;
    }

    onNext(totalGuests, specialRequests);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Number of Guests
        </CardTitle>
        <CardDescription>
          Current capacity: <strong>{totalCapacity}</strong> guest{totalCapacity !== 1 ? "s" : ""}
          {selectedRooms.length > 1 &&
            ` across ${selectedRooms.reduce((t, r) => t + r.quantity, 0)} rooms`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adults */}
        <GuestCounter
          label="Adults"
          description="Ages 13 or above"
          value={adults}
          min={1}
          onChange={setAdults}
        />

        {/* Children */}
        <GuestCounter
          label="Children"
          description="Ages 2-12"
          value={children}
          min={0}
          onChange={setChildren}
        />

        {/* Total Guests & Capacity Status */}
        <CapacityStatus
          totalGuests={totalGuests}
          totalCapacity={totalCapacity}
          isOverCapacity={isOverCapacity}
          additionalGuestsNeeded={additionalGuestsNeeded}
        />

        {/* Room Selector Section */}
        {propertyId && checkIn && checkOut && (
          <RoomSelectorSection
            propertyId={propertyId}
            checkIn={checkIn}
            checkOut={checkOut}
            selectedRooms={selectedRooms}
            currentRoomTokenId={currentRoomTokenId || 0n}
            showRoomSelector={showRoomSelector}
            isOverCapacity={isOverCapacity}
            onShowRoomSelector={() => setShowRoomSelector(true)}
            onAddRoom={handleAddRoom}
            onRemoveRoom={handleRemoveRoom}
            onUpdateQuantity={updateRoomQuantity}
          />
        )}

        {/* Price Summary */}
        {selectedRooms.length > 0 && (
          <PriceSummarySection priceSummary={priceSummary} totalNights={totalNights} />
        )}

        {/* Special Requests */}
        <SpecialRequests value={specialRequests} onChange={setSpecialRequests} />

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back to Dates
          </Button>
          <Button onClick={handleNext} disabled={totalGuests < 1 || isOverCapacity}>
            {isOverCapacity
              ? `Add Room${additionalGuestsNeeded > maxGuests ? "s" : ""} First`
              : "Continue to Payment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
