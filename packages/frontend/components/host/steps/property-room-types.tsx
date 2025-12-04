"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Bed,
  Wifi,
  Car,
  Tv,
  Wind,
  Coffee,
  Bath,
  Sofa,
  Mountain,
  Image as ImageIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { ImageUpload } from "@/components/ui/image-upload";
import type { RoomTypeData } from "@/lib/hooks/usePropertyNFT";

// Room-specific amenities
const ROOM_AMENITIES = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "tv", label: "TV", icon: Tv },
  { id: "ac", label: "Air Conditioning", icon: Wind },
  { id: "minibar", label: "Minibar", icon: Coffee },
  { id: "private_bathroom", label: "Private Bathroom", icon: Bath },
  { id: "balcony", label: "Balcony", icon: Mountain },
  { id: "seating_area", label: "Seating Area", icon: Sofa },
  { id: "parking", label: "Parking", icon: Car },
];

interface PropertyRoomTypesProps {
  data: any;
  roomTypes: RoomTypeData[];
  onNext: (data: any) => void;
  onBack: () => void;
  onRoomTypesChange: (roomTypes: RoomTypeData[]) => void;
}

export function PropertyRoomTypes({
  data: _data,
  roomTypes,
  onNext,
  onBack,
  onRoomTypesChange,
}: PropertyRoomTypesProps) {
  const { t } = useTranslation();
  const [currentRoom, setCurrentRoom] = useState<Partial<RoomTypeData>>({
    name: "",
    description: "",
    maxSupply: 1,
    pricePerNight: 0,
    currency: "USD",
    maxGuests: 2,
    minStayNights: 1,
    maxStayNights: 30,
    amenities: [],
    images: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
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
  };

  const handleAddRoom = () => {
    if (validate()) {
      const newRoomTypes = [...roomTypes, currentRoom as RoomTypeData];
      onRoomTypesChange(newRoomTypes);

      // Reset form
      setCurrentRoom({
        name: "",
        description: "",
        maxSupply: 1,
        pricePerNight: 0,
        currency: "USD",
        maxGuests: 2,
        minStayNights: 1,
        maxStayNights: 30,
        amenities: [],
        images: [],
      });
      setErrors({});
    }
  };

  const handleRemoveRoom = (index: number) => {
    const newRoomTypes = roomTypes.filter((_, i) => i !== index);
    onRoomTypesChange(newRoomTypes);
  };

  const handleNext = () => {
    if (roomTypes.length === 0) {
      setErrors({ general: t("property_creation.error_add_room") });
      return;
    }
    onNext({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("property_creation.room_types_title")}</CardTitle>
        <CardDescription>{t("property_creation.room_types_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Room Types */}
        {roomTypes.length > 0 && (
          <div className="space-y-3">
            <Label className="text-base">{t("property_creation.your_room_types")}</Label>
            <div className="space-y-2">
              {roomTypes.map((room, index) => (
                <div key={index} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Bed className="text-muted-foreground mt-1 h-5 w-5" />
                      <div className="space-y-1">
                        <p className="font-medium">{room.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {room.maxSupply} {t("property_creation.units")} • {room.pricePerNight}{" "}
                          {room.currency === "EUR" ? "€" : "$"}/{t("property_creation.per_night")} •{" "}
                          {room.maxGuests} {t("hero.guests")}
                        </p>
                        {room.description && (
                          <p className="text-muted-foreground line-clamp-2 text-sm">
                            {room.description}
                          </p>
                        )}
                        {room.amenities && room.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {room.amenities.map((amenityId) => {
                              const amenity = ROOM_AMENITIES.find((a) => a.id === amenityId);
                              if (!amenity) return null;
                              const Icon = amenity.icon;
                              return (
                                <span
                                  key={amenityId}
                                  className="bg-secondary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                                >
                                  <Icon className="h-3 w-3" />
                                  {amenity.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {room.images && room.images.length > 0 && (
                          <p className="text-muted-foreground flex items-center gap-1 text-xs">
                            <ImageIcon className="h-3 w-3" />
                            {room.images.length} photo{room.images.length > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveRoom(index)}>
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Room Type */}
        <div className="space-y-4 rounded-lg border-2 border-dashed p-6">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            <Label className="text-base">
              {roomTypes.length === 0
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
                onChange={(e) => setCurrentRoom({ ...currentRoom, name: e.target.value })}
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
                onChange={(e) => setCurrentRoom({ ...currentRoom, description: e.target.value })}
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
                onChange={(e) =>
                  setCurrentRoom({ ...currentRoom, maxSupply: parseInt(e.target.value) || 1 })
                }
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
                  onChange={(e) =>
                    setCurrentRoom({
                      ...currentRoom,
                      pricePerNight: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`flex-1 ${errors.pricePerNight ? "border-destructive" : ""}`}
                />
                <select
                  value={currentRoom.currency || "USD"}
                  onChange={(e) =>
                    setCurrentRoom({ ...currentRoom, currency: e.target.value as "USD" | "EUR" })
                  }
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
                onChange={(e) =>
                  setCurrentRoom({ ...currentRoom, maxGuests: parseInt(e.target.value) || 1 })
                }
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
                onChange={(e) =>
                  setCurrentRoom({ ...currentRoom, minStayNights: parseInt(e.target.value) || 1 })
                }
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
                onChange={(e) =>
                  setCurrentRoom({ ...currentRoom, maxStayNights: parseInt(e.target.value) || 30 })
                }
                className={errors.maxStayNights ? "border-destructive" : ""}
              />
              {errors.maxStayNights && (
                <p className="text-destructive text-sm">{errors.maxStayNights}</p>
              )}
            </div>

            {/* Room Amenities */}
            <div className="space-y-3 sm:col-span-2">
              <Label>Room Amenities</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ROOM_AMENITIES.map((amenity) => {
                  const Icon = amenity.icon;
                  const isSelected = currentRoom.amenities?.includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => {
                        const currentAmenities = currentRoom.amenities || [];
                        const newAmenities = isSelected
                          ? currentAmenities.filter((a) => a !== amenity.id)
                          : [...currentAmenities, amenity.id];
                        setCurrentRoom({ ...currentRoom, amenities: newAmenities });
                      }}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {amenity.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-muted-foreground text-xs">
                Select amenities available in this room type
              </p>
            </div>

            {/* Room Images */}
            <div className="space-y-3 sm:col-span-2">
              <Label>Room Photos</Label>
              <ImageUpload
                images={currentRoom.images || []}
                onChange={(images) => setCurrentRoom({ ...currentRoom, images })}
                maxImages={5}
                label="Upload room photos"
              />
            </div>
          </div>

          <Button onClick={handleAddRoom} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            {t("property_creation.add_room_type")}
          </Button>
        </div>

        {errors.general && <p className="text-destructive text-sm">{errors.general}</p>}

        {/* Actions */}
        <div className="flex justify-between gap-4 pt-4">
          <Button onClick={onBack} variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
          <Button onClick={handleNext} size="lg" disabled={roomTypes.length === 0}>
            {t("common.next")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
