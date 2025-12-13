"use client";

/**
 * Form for adding a new room type
 */

import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { useTranslation } from "@/lib/hooks/useTranslation";
import type { RoomTypeData } from "@/lib/hooks/usePropertyNFT";
import { RoomAmenitiesSelector } from "./RoomAmenitiesSelector";

interface RoomTypeFormProps {
  currentRoom: Partial<RoomTypeData>;
  errors: Record<string, string>;
  roomTypesCount: number;
  onUpdateRoom: (updates: Partial<RoomTypeData>) => void;
  onToggleAmenity: (amenityId: string) => void;
  onAddRoom: () => void;
}

/**
 * Form to create a new room type
 */
export function RoomTypeForm({
  currentRoom,
  errors,
  roomTypesCount,
  onUpdateRoom,
  onToggleAmenity,
  onAddRoom,
}: RoomTypeFormProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 rounded-lg border-2 border-dashed p-6">
      <div className="flex items-center gap-2">
        <Plus className="h-5 w-5" />
        <Label className="text-base">
          {roomTypesCount === 0
            ? t("property_creation.add_first_room")
            : t("property_creation.add_another_room")}
        </Label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Room Name */}
        <div className="space-y-2">
          <Label htmlFor="roomName">
            {t("property_creation.room_name")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="roomName"
            placeholder={t("property_creation.room_name_placeholder")}
            value={currentRoom.name}
            onChange={(e) => onUpdateRoom({ name: e.target.value })}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
        </div>

        {/* Room Description */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="roomDescription">Room Description</Label>
          <Textarea
            id="roomDescription"
            placeholder="Describe this room type (e.g., spacious room with ocean view, modern furniture, king-size bed...)"
            value={currentRoom.description}
            onChange={(e) => onUpdateRoom({ description: e.target.value })}
            rows={3}
          />
          <p className="text-muted-foreground text-xs">
            Help guests understand what makes this room special
          </p>
        </div>

        {/* Number of Units */}
        <div className="space-y-2">
          <Label htmlFor="maxSupply">
            {t("property_creation.number_of_units")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="maxSupply"
            type="number"
            min="1"
            placeholder={t("property_creation.units_placeholder")}
            value={currentRoom.maxSupply}
            onChange={(e) => onUpdateRoom({ maxSupply: parseInt(e.target.value) || 1 })}
            className={errors.maxSupply ? "border-destructive" : ""}
          />
          {errors.maxSupply && <p className="text-destructive text-sm">{errors.maxSupply}</p>}
          <p className="text-muted-foreground text-xs">{t("property_creation.units_help")}</p>
        </div>

        {/* Price Per Night */}
        <div className="space-y-2">
          <Label htmlFor="pricePerNight">
            {t("property_creation.price_per_night")} <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="pricePerNight"
              type="number"
              step="1"
              min="0"
              placeholder="100"
              value={currentRoom.pricePerNight || ""}
              onChange={(e) => onUpdateRoom({ pricePerNight: parseFloat(e.target.value) || 0 })}
              className={`flex-1 ${errors.pricePerNight ? "border-destructive" : ""}`}
            />
            <select
              value={currentRoom.currency || "USD"}
              onChange={(e) => onUpdateRoom({ currency: e.target.value as "USD" | "EUR" })}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring w-24 rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
            </select>
          </div>
          {errors.pricePerNight && (
            <p className="text-destructive text-sm">{errors.pricePerNight}</p>
          )}
          <p className="text-muted-foreground text-xs">
            Price will be converted to USDC/EURC at payment time (1:1 ratio)
          </p>
        </div>

        {/* Max Guests */}
        <div className="space-y-2">
          <Label htmlFor="maxGuests">
            {t("property_creation.max_guests")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="maxGuests"
            type="number"
            min="1"
            placeholder={t("property_creation.guests_placeholder")}
            value={currentRoom.maxGuests}
            onChange={(e) => onUpdateRoom({ maxGuests: parseInt(e.target.value) || 1 })}
            className={errors.maxGuests ? "border-destructive" : ""}
          />
          {errors.maxGuests && <p className="text-destructive text-sm">{errors.maxGuests}</p>}
        </div>

        {/* Min Stay Nights */}
        <div className="space-y-2">
          <Label htmlFor="minStayNights">
            Minimum Stay (nights) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="minStayNights"
            type="number"
            min="1"
            placeholder="1"
            value={currentRoom.minStayNights}
            onChange={(e) => onUpdateRoom({ minStayNights: parseInt(e.target.value) || 1 })}
            className={errors.minStayNights ? "border-destructive" : ""}
          />
          {errors.minStayNights && (
            <p className="text-destructive text-sm">{errors.minStayNights}</p>
          )}
        </div>

        {/* Max Stay Nights */}
        <div className="space-y-2">
          <Label htmlFor="maxStayNights">
            Maximum Stay (nights) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="maxStayNights"
            type="number"
            min="1"
            placeholder="30"
            value={currentRoom.maxStayNights}
            onChange={(e) => onUpdateRoom({ maxStayNights: parseInt(e.target.value) || 30 })}
            className={errors.maxStayNights ? "border-destructive" : ""}
          />
          {errors.maxStayNights && (
            <p className="text-destructive text-sm">{errors.maxStayNights}</p>
          )}
        </div>

        {/* Room Amenities */}
        <RoomAmenitiesSelector
          selectedAmenities={currentRoom.amenities || []}
          onToggle={onToggleAmenity}
        />

        {/* Room Images */}
        <div className="space-y-3 sm:col-span-2">
          <Label>Room Photos</Label>
          <ImageUpload
            images={currentRoom.images || []}
            onChange={(images) => onUpdateRoom({ images })}
            maxImages={5}
            label="Upload room photos"
          />
        </div>
      </div>

      <Button onClick={onAddRoom} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        {t("property_creation.add_room_type")}
      </Button>
    </div>
  );
}
