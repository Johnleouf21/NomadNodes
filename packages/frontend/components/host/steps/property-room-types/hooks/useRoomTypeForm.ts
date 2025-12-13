"use client";

/**
 * Hook for room type form state and validation
 */

import { useState, useCallback } from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import type { RoomTypeData } from "@/lib/hooks/usePropertyNFT";
import { DEFAULT_ROOM } from "../types";

interface UseRoomTypeFormProps {
  roomTypes: RoomTypeData[];
  onRoomTypesChange: (roomTypes: RoomTypeData[]) => void;
}

/**
 * Manage room type form state
 */
export function useRoomTypeForm({ roomTypes, onRoomTypesChange }: UseRoomTypeFormProps) {
  const { t } = useTranslation();
  const [currentRoom, setCurrentRoom] = useState<Partial<RoomTypeData>>(DEFAULT_ROOM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!currentRoom.name || currentRoom.name.trim().length < 3) {
      newErrors.name = t("property_creation.error_room_name");
    }

    if (!currentRoom.maxSupply || currentRoom.maxSupply < 1) {
      newErrors.maxSupply = t("property_creation.error_room_supply");
    }

    if (!currentRoom.pricePerNight || currentRoom.pricePerNight <= 0) {
      newErrors.pricePerNight = t("property_creation.error_room_price");
    }

    if (!currentRoom.maxGuests || currentRoom.maxGuests < 1) {
      newErrors.maxGuests = t("property_creation.error_room_guests");
    }

    if (!currentRoom.minStayNights || currentRoom.minStayNights < 1) {
      newErrors.minStayNights = "Minimum stay must be at least 1 night";
    }

    if (!currentRoom.maxStayNights || currentRoom.maxStayNights < 1) {
      newErrors.maxStayNights = "Maximum stay must be at least 1 night";
    }

    if (
      currentRoom.minStayNights &&
      currentRoom.maxStayNights &&
      currentRoom.minStayNights > currentRoom.maxStayNights
    ) {
      newErrors.maxStayNights = "Maximum stay must be greater than minimum stay";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentRoom, t]);

  const handleAddRoom = useCallback(() => {
    if (validate()) {
      const newRoomTypes = [...roomTypes, currentRoom as RoomTypeData];
      onRoomTypesChange(newRoomTypes);
      setCurrentRoom(DEFAULT_ROOM);
      setErrors({});
    }
  }, [validate, roomTypes, currentRoom, onRoomTypesChange]);

  const handleRemoveRoom = useCallback(
    (index: number) => {
      const newRoomTypes = roomTypes.filter((_, i) => i !== index);
      onRoomTypesChange(newRoomTypes);
    },
    [roomTypes, onRoomTypesChange]
  );

  const updateCurrentRoom = useCallback((updates: Partial<RoomTypeData>) => {
    setCurrentRoom((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleAmenity = useCallback((amenityId: string) => {
    setCurrentRoom((prev) => {
      const currentAmenities = prev.amenities || [];
      const isSelected = currentAmenities.includes(amenityId);
      const newAmenities = isSelected
        ? currentAmenities.filter((a) => a !== amenityId)
        : [...currentAmenities, amenityId];
      return { ...prev, amenities: newAmenities };
    });
  }, []);

  return {
    currentRoom,
    errors,
    setErrors,
    handleAddRoom,
    handleRemoveRoom,
    updateCurrentRoom,
    toggleAmenity,
  };
}
