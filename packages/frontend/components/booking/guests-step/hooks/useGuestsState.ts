"use client";

/**
 * Hook for guests state management
 */

import * as React from "react";
import type { BookingRoom } from "@/lib/store/useBookingStore";

interface UseGuestsStateProps {
  initialGuests: number;
  maxGuests: number;
  selectedRooms: BookingRoom[];
}

/**
 * Manage guests count and capacity calculations
 */
export function useGuestsState({ initialGuests, maxGuests, selectedRooms }: UseGuestsStateProps) {
  const [adults, setAdults] = React.useState(Math.max(1, initialGuests));
  const [children, setChildren] = React.useState(0);
  const [specialRequests, setSpecialRequests] = React.useState("");
  const [showRoomSelector, setShowRoomSelector] = React.useState(false);

  const totalGuests = adults + children;

  // Calculate total capacity from selected rooms
  const totalCapacity = React.useMemo(() => {
    if (selectedRooms.length === 0) {
      return maxGuests;
    }
    return selectedRooms.reduce((total, room) => total + room.maxGuests * room.quantity, 0);
  }, [selectedRooms, maxGuests]);

  const isOverCapacity = totalGuests > totalCapacity;
  const capacityExcess = totalGuests - totalCapacity;
  const additionalGuestsNeeded = Math.max(0, capacityExcess);

  return {
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
  };
}
