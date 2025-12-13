"use client";

/**
 * Hook for room management
 */

import { toast } from "sonner";
import { useBookingStore, type BookingRoom } from "@/lib/store/useBookingStore";

/**
 * Manage room add/remove/update operations
 */
export function useRoomManagement() {
  const { bookingData, addRoom, removeRoom, updateRoomQuantity } = useBookingStore();
  const selectedRooms = bookingData.rooms;

  const handleAddRoom = (room: BookingRoom) => {
    addRoom(room);
    toast.success(`Added ${room.roomName}`);
  };

  const handleRemoveRoom = (tokenId: bigint) => {
    // Prevent removing the last room
    if (selectedRooms.length === 1 && selectedRooms[0].quantity === 1) {
      toast.error("You must have at least one room selected");
      return;
    }

    const tokenIdStr = tokenId.toString();
    const room = selectedRooms.find((r) => r.tokenId.toString() === tokenIdStr);
    if (room && room.quantity === 1) {
      removeRoom(tokenId);
      toast.info(`Removed ${room.roomName}`);
    } else {
      updateRoomQuantity(tokenId, (room?.quantity || 1) - 1);
    }
  };

  return {
    handleAddRoom,
    handleRemoveRoom,
    updateRoomQuantity,
  };
}
