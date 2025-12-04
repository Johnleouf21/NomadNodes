"use client";

import * as React from "react";
import { Users, Plus, Minus, AlertTriangle, BedDouble, ShoppingCart, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { RoomSelector } from "./RoomSelector";
import { useBookingStore, type BookingRoom } from "@/lib/store/useBookingStore";
import { cn } from "@/lib/utils";

interface GuestsStepProps {
  onNext: (guests: number, specialRequests: string) => void;
  onBack: () => void;
  maxGuests?: number;
  initialGuests?: number;
  propertyId?: bigint;
  currentRoomTokenId?: bigint;
  currentRoomName?: string;
  currentRoomPrice?: number;
  currentRoomCurrency?: "USD" | "EUR";
  checkIn?: Date | null;
  checkOut?: Date | null;
  totalNights?: number;
}

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
  const { bookingData, addRoom, removeRoom, updateRoomQuantity, calculateTotal } =
    useBookingStore();

  // Initialize with the initial guests from search (default to adults)
  const [adults, setAdults] = React.useState(Math.max(1, initialGuests));
  const [children, setChildren] = React.useState(0);
  const [specialRequests, setSpecialRequests] = React.useState("");
  const [showRoomSelector, setShowRoomSelector] = React.useState(false);

  const totalGuests = adults + children;
  const selectedRooms = bookingData.rooms;

  // Calculate total capacity from selected rooms
  const totalCapacity = React.useMemo(() => {
    if (selectedRooms.length === 0) {
      return maxGuests; // Single room mode
    }
    return selectedRooms.reduce((total, room) => total + room.maxGuests * room.quantity, 0);
  }, [selectedRooms, maxGuests]);

  const isOverCapacity = totalGuests > totalCapacity;
  const capacityExcess = totalGuests - totalCapacity;
  const additionalGuestsNeeded = Math.max(0, capacityExcess);

  // Calculate price summary
  const priceSummary = React.useMemo(() => {
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

  // Track if we've already initialized the room
  const hasInitialized = React.useRef(false);

  // Initialize current room in booking - only once on mount
  React.useEffect(() => {
    // Only initialize once and only if we have a valid tokenId
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
  }, [isOverCapacity, showRoomSelector]);

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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Adults</Label>
              <p className="text-muted-foreground text-sm">Ages 13 or above</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAdults(Math.max(1, adults - 1))}
                disabled={adults <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{adults}</span>
              <Button variant="outline" size="icon" onClick={() => setAdults(adults + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Children */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Children</Label>
              <p className="text-muted-foreground text-sm">Ages 2-12</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setChildren(Math.max(0, children - 1))}
                disabled={children <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{children}</span>
              <Button variant="outline" size="icon" onClick={() => setChildren(children + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Total Guests & Capacity Status */}
        <div
          className={cn(
            "rounded-lg border p-4",
            isOverCapacity
              ? "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
              : totalGuests === totalCapacity
                ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950"
                : "bg-muted/50"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users
                className={cn(
                  "h-5 w-5",
                  isOverCapacity ? "text-orange-600" : "text-muted-foreground"
                )}
              />
              <span className="font-medium">Total Guests</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-lg font-bold", isOverCapacity ? "text-orange-600" : "")}>
                {totalGuests}
              </span>
              <span className="text-muted-foreground">/ {totalCapacity}</span>
            </div>
          </div>

          {!isOverCapacity && totalGuests === totalCapacity && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Perfect! Rooms at full capacity.
            </div>
          )}

          {isOverCapacity && (
            <p className="mt-2 text-sm text-orange-600">
              Need {additionalGuestsNeeded} more spot{additionalGuestsNeeded > 1 ? "s" : ""} - add
              another room below
            </p>
          )}
        </div>

        {/* Over capacity - Room selector */}
        {isOverCapacity && (
          <Alert
            variant="default"
            className="border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
          >
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800 dark:text-orange-200">Add More Rooms</AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              Your group of <strong>{totalGuests}</strong> needs more space. Add rooms below to
              accommodate everyone.
            </AlertDescription>
          </Alert>
        )}

        {/* Room Selector Section */}
        {propertyId && checkIn && checkOut && (
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
                <Button variant="outline" size="sm" onClick={() => setShowRoomSelector(true)}>
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
                onAddRoom={handleAddRoom}
                onRemoveRoom={handleRemoveRoom}
                onUpdateQuantity={updateRoomQuantity}
              />
            )}
          </div>
        )}

        {/* Price Summary */}
        {selectedRooms.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-muted-foreground h-5 w-5" />
                <span className="font-medium">Price Summary</span>
              </div>

              <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
                {priceSummary.rooms.map((room, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {room.name} {room.quantity > 1 && `× ${room.quantity}`}
                    </span>
                    <span>
                      {priceSummary.currencySymbol}
                      {room.pricePerNight.toFixed(2)}/night
                    </span>
                  </div>
                ))}

                <Separator className="my-2" />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Per night</span>
                  <span className="font-medium">
                    {priceSummary.currencySymbol}
                    {priceSummary.perNight.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {totalNights} night{totalNights > 1 ? "s" : ""}
                  </span>
                  <span className="text-lg font-semibold">
                    {priceSummary.currencySymbol}
                    {priceSummary.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Special Requests */}
        <div className="space-y-2">
          <Label htmlFor="special-requests">Special Requests (Optional)</Label>
          <Textarea
            id="special-requests"
            placeholder="Any special requirements or requests for your stay..."
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <p className="text-muted-foreground text-xs">{specialRequests.length}/500 characters</p>
        </div>

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
