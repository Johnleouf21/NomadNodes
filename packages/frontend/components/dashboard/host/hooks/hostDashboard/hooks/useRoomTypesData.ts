"use client";

/**
 * Hook to manage room types data
 */

import * as React from "react";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { RoomTypeWithCurrency, RoomTypeInfo } from "../../../types";
import { fetchRoomTypes } from "../services/roomTypes";

interface UseRoomTypesDataReturn {
  roomTypesMap: Map<string, RoomTypeWithCurrency>;
  getRoomTypeInfo: (booking: PonderBooking) => RoomTypeInfo;
}

/**
 * Fetch and manage room types data
 */
export function useRoomTypesData(propertyIdStrings: string[]): UseRoomTypesDataReturn {
  const [roomTypesMap, setRoomTypesMap] = React.useState<Map<string, RoomTypeWithCurrency>>(
    new Map()
  );

  React.useEffect(() => {
    async function loadRoomTypes() {
      if (propertyIdStrings.length === 0) return;
      const types = await fetchRoomTypes(propertyIdStrings);
      setRoomTypesMap(types);
    }

    loadRoomTypes();
  }, [propertyIdStrings]);

  const getRoomTypeInfo = React.useCallback(
    (booking: PonderBooking): RoomTypeInfo => {
      const roomType = roomTypesMap.get(booking.roomTypeId);
      return {
        name: roomType?.name || `Room #${booking.roomTypeId}`,
        currency: roomType?.currency || "USD",
      };
    },
    [roomTypesMap]
  );

  return { roomTypesMap, getRoomTypeInfo };
}
