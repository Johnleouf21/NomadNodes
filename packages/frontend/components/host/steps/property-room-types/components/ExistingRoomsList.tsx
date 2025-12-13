"use client";

/**
 * List of existing room types
 */

import { Bed, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/hooks/useTranslation";
import type { RoomTypeData } from "@/lib/hooks/usePropertyNFT";
import { ROOM_AMENITIES } from "../types";

interface ExistingRoomsListProps {
  roomTypes: RoomTypeData[];
  onRemoveRoom: (index: number) => void;
}

/**
 * Display list of added room types
 */
export function ExistingRoomsList({ roomTypes, onRemoveRoom }: ExistingRoomsListProps) {
  const { t } = useTranslation();

  if (roomTypes.length === 0) return null;

  return (
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
                    <p className="text-muted-foreground line-clamp-2 text-sm">{room.description}</p>
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
              <Button variant="ghost" size="sm" onClick={() => onRemoveRoom(index)}>
                <Trash2 className="text-destructive h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
