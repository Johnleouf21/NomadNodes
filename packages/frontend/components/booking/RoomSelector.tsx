"use client";

import * as React from "react";
import { Plus, Minus, Users, Loader2, Check, BedDouble } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePonderRoomTypes, RoomTypeWithMeta_data } from "@/hooks/usePonderRoomTypes";
import { useCheckMultipleAvailability } from "@/lib/hooks/property/useAvailability";
import { cn } from "@/lib/utils";
import type { BookingRoom } from "@/lib/store/useBookingStore";

interface RoomSelectorProps {
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  selectedRooms: BookingRoom[];
  currentRoomTokenId: bigint;
  onAddRoom: (room: BookingRoom) => void;
  onRemoveRoom: (tokenId: bigint) => void;
  onUpdateQuantity: (tokenId: bigint, quantity: number) => void;
}

interface AvailableRoomCardProps {
  room: RoomTypeWithMeta_data;
  selectedQuantity: number;
  isCurrentRoom: boolean;
  isAvailable: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

function AvailableRoomCard({
  room,
  selectedQuantity,
  isCurrentRoom,
  isAvailable,
  onAdd,
  onRemove,
}: AvailableRoomCardProps) {
  const maxSupply = Number(room.totalSupply || 1n);
  const pricePerNight = room.meta_data?.pricePerNight || 0;
  const maxGuests = room.meta_data?.maxGuests || Number(room.maxGuests || 2n);
  const currency = room.meta_data?.currency || "USD";
  const currencySymbol = currency === "EUR" ? "€" : "$";

  // Only allow adding if room is available AND not at max capacity
  const canAddMore = isAvailable && selectedQuantity < maxSupply;
  const isSelected = selectedQuantity > 0;

  return (
    <Card
      className={cn(
        "transition-all",
        isSelected && "ring-primary ring-2",
        !isAvailable && "opacity-60"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Room Info */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <BedDouble className="text-muted-foreground h-4 w-4" />
              <h4 className="truncate font-medium">{room.name}</h4>
              {isCurrentRoom && (
                <Badge variant="secondary" className="text-xs">
                  Current
                </Badge>
              )}
              {!isAvailable && (
                <Badge variant="destructive" className="text-xs">
                  Sold Out
                </Badge>
              )}
              {isSelected && (
                <Badge variant="default" className="text-xs">
                  <Check className="mr-1 h-3 w-3" />
                  {selectedQuantity}
                </Badge>
              )}
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {maxGuests} guest{maxGuests > 1 ? "s" : ""}
              </span>
              <span>•</span>
              <span className="text-foreground font-medium">
                {currencySymbol}
                {pricePerNight}/night
              </span>
              <span>•</span>
              <span className="text-muted-foreground">
                {maxSupply} unit{maxSupply > 1 ? "s" : ""}
              </span>
            </div>

            {room.meta_data?.description && (
              <p className="text-muted-foreground mt-2 line-clamp-2 text-xs">
                {room.meta_data.description}
              </p>
            )}
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            {isSelected ? (
              <>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={onRemove}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{selectedQuantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onAdd}
                  disabled={!canAddMore}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onAdd}
                disabled={!isAvailable || maxSupply === 0}
              >
                {!isAvailable ? (
                  "Sold Out"
                ) : (
                  <>
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Selected room total */}
        {isSelected && (
          <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
            <span className="text-muted-foreground">
              {selectedQuantity} room{selectedQuantity > 1 ? "s" : ""} × {currencySymbol}
              {pricePerNight}
            </span>
            <span className="font-semibold">
              {currencySymbol}
              {(pricePerNight * selectedQuantity).toFixed(2)}/night
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RoomSelector({
  propertyId,
  checkIn,
  checkOut,
  selectedRooms,
  currentRoomTokenId,
  onAddRoom,
  onRemoveRoom,
  onUpdateQuantity,
}: RoomSelectorProps) {
  // Fetch all room types for this property (cached via React Query)
  const { data: roomTypes, isLoading: isLoadingRoomTypes } = usePonderRoomTypes(propertyId);

  // Extract tokenIds for availability check
  const tokenIds = React.useMemo(() => {
    if (!roomTypes) return [];
    return roomTypes.map((rt: RoomTypeWithMeta_data) => BigInt(rt.tokenId));
  }, [roomTypes]);

  // Check availability for all room types using multicall
  const { availabilityMap, isLoading: isLoadingAvailability } = useCheckMultipleAvailability(
    tokenIds,
    checkIn,
    checkOut,
    tokenIds.length > 0
  );

  const isLoading = isLoadingRoomTypes || isLoadingAvailability;

  // Get selected quantity for a room
  const getSelectedQuantity = (tokenId: bigint): number => {
    const tokenIdStr = tokenId.toString();
    const room = selectedRooms.find((r) => r.tokenId.toString() === tokenIdStr);
    return room?.quantity || 0;
  };

  // Check if a room is available using the availabilityMap
  const isRoomAvailable = (tokenId: bigint): boolean => {
    return availabilityMap.get(tokenId.toString()) ?? false;
  };

  // Handle adding a room
  const handleAddRoom = React.useCallback(
    (room: RoomTypeWithMeta_data) => {
      const pricePerNight = room.meta_data?.pricePerNight || 0;
      const maxGuests = room.meta_data?.maxGuests || Number(room.maxGuests || 2n);
      const currency = room.meta_data?.currency || "USD";

      onAddRoom({
        tokenId: room.tokenId,
        roomName: room.name,
        pricePerNight,
        maxGuests,
        quantity: 1,
        currency,
      });
    },
    [onAddRoom]
  );

  // Handle removing a room
  const handleRemoveRoom = React.useCallback(
    (tokenId: bigint) => {
      const tokenIdStr = tokenId.toString();
      const room = selectedRooms.find((r) => r.tokenId.toString() === tokenIdStr);
      const currentQuantity = room?.quantity || 0;

      if (currentQuantity <= 1) {
        onRemoveRoom(tokenId);
      } else {
        onUpdateQuantity(tokenId, currentQuantity - 1);
      }
    },
    [selectedRooms, onRemoveRoom, onUpdateQuantity]
  );

  // Memoize sorted rooms
  const sortedRooms = React.useMemo(() => {
    if (!roomTypes || roomTypes.length === 0) return [];

    const currentRoomTokenIdStr = currentRoomTokenId.toString();
    return [...roomTypes].sort((a, b) => {
      if (a.tokenId.toString() === currentRoomTokenIdStr) return -1;
      if (b.tokenId.toString() === currentRoomTokenIdStr) return 1;
      const priceA = a.meta_data?.pricePerNight || 0;
      const priceB = b.meta_data?.pricePerNight || 0;
      return priceA - priceB;
    });
  }, [roomTypes, currentRoomTokenId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (sortedRooms.length === 0) {
    return (
      <p className="text-muted-foreground p-4 text-center text-sm">
        No other rooms available at this property.
      </p>
    );
  }

  const currentRoomTokenIdStr = currentRoomTokenId.toString();

  return (
    <div className="space-y-3">
      {sortedRooms.map((room) => (
        <AvailableRoomCard
          key={room.id}
          room={room}
          selectedQuantity={getSelectedQuantity(room.tokenId)}
          isCurrentRoom={room.tokenId.toString() === currentRoomTokenIdStr}
          isAvailable={isRoomAvailable(room.tokenId)}
          onAdd={() => handleAddRoom(room)}
          onRemove={() => handleRemoveRoom(room.tokenId)}
        />
      ))}
    </div>
  );
}
