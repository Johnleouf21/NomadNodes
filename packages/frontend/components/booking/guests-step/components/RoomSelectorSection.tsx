"use client";

/**
 * Room selector section component
 */

import * as React from "react";
import { BedDouble, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoomSelector } from "../../RoomSelector";
import type { BookingRoom } from "@/lib/store/useBookingStore";

interface RoomSelectorSectionProps {
  propertyId: bigint;
  checkIn: Date;
  checkOut: Date;
  selectedRooms: BookingRoom[];
  currentRoomTokenId: bigint;
  showRoomSelector: boolean;
  isOverCapacity: boolean;
  onShowRoomSelector: () => void;
  onAddRoom: (room: BookingRoom) => void;
  onRemoveRoom: (tokenId: bigint) => void;
  onUpdateQuantity: (tokenId: bigint, quantity: number) => void;
}

export function RoomSelectorSection({
  propertyId,
  checkIn,
  checkOut,
  selectedRooms,
  currentRoomTokenId,
  showRoomSelector,
  isOverCapacity,
  onShowRoomSelector,
  onAddRoom,
  onRemoveRoom,
  onUpdateQuantity,
}: RoomSelectorSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BedDouble className="text-muted-foreground h-5 w-5" />
          <span className="font-medium">Your Rooms</span>
          {selectedRooms.length > 0 && (
            <Badge variant="secondary">
              {selectedRooms.reduce((t, r) => t + r.quantity, 0)} selected
            </Badge>
          )}
        </div>
        {!showRoomSelector && !isOverCapacity && (
          <Button variant="outline" size="sm" onClick={onShowRoomSelector}>
            <Plus className="mr-1 h-4 w-4" />
            Add Rooms
          </Button>
        )}
      </div>

      {(showRoomSelector || isOverCapacity) && (
        <RoomSelector
          propertyId={propertyId.toString()}
          checkIn={checkIn}
          checkOut={checkOut}
          selectedRooms={selectedRooms}
          currentRoomTokenId={currentRoomTokenId || 0n}
          onAddRoom={onAddRoom}
          onRemoveRoom={onRemoveRoom}
          onUpdateQuantity={onUpdateQuantity}
        />
      )}
    </div>
  );
}
