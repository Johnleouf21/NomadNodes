"use client";

/**
 * Hook for price summary calculations
 */

import * as React from "react";
import type { BookingRoom } from "@/lib/store/useBookingStore";
import type { PriceSummary } from "../types";

interface UsePriceSummaryProps {
  selectedRooms: BookingRoom[];
  currentRoomPrice: number;
  currentRoomName?: string;
  currentRoomCurrency: "USD" | "EUR";
  totalNights: number;
}

/**
 * Calculate price summary from selected rooms
 */
export function usePriceSummary({
  selectedRooms,
  currentRoomPrice,
  currentRoomName,
  currentRoomCurrency,
  totalNights,
}: UsePriceSummaryProps): PriceSummary {
  return React.useMemo(() => {
    const currencySymbol = currentRoomCurrency === "EUR" ? "€" : "$";

    if (selectedRooms.length === 0) {
      // Single room
      const perNight = currentRoomPrice;
      const total = perNight * totalNights;
      return {
        rooms: [{ name: currentRoomName || "Room", quantity: 1, pricePerNight: perNight }],
        perNight,
        total,
        currencySymbol,
      };
    }

    // Multi-room
    const perNight = selectedRooms.reduce(
      (sum, room) => sum + room.pricePerNight * room.quantity,
      0
    );
    const total = perNight * totalNights;

    return {
      rooms: selectedRooms.map((r) => ({
        name: r.roomName,
        quantity: r.quantity,
        pricePerNight: r.pricePerNight * r.quantity,
      })),
      perNight,
      total,
      currencySymbol,
    };
  }, [selectedRooms, currentRoomPrice, currentRoomName, currentRoomCurrency, totalNights]);
}
