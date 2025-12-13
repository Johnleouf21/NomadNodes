"use client";

/**
 * PropertyRoomTypes - Step for adding room types during property creation
 *
 * Refactored from a 443-line file into modular components and hooks.
 */

import { ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { useRoomTypeForm } from "./hooks";
import { ExistingRoomsList, RoomTypeForm } from "./components";
import type { PropertyRoomTypesProps } from "./types";

/**
 * Property creation step for room types
 */
export function PropertyRoomTypes({
  roomTypes,
  onNext,
  onBack,
  onRoomTypesChange,
}: PropertyRoomTypesProps) {
  const { t } = useTranslation();

  const {
    currentRoom,
    errors,
    setErrors,
    handleAddRoom,
    handleRemoveRoom,
    updateCurrentRoom,
    toggleAmenity,
  } = useRoomTypeForm({ roomTypes, onRoomTypesChange });

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
        <ExistingRoomsList roomTypes={roomTypes} onRemoveRoom={handleRemoveRoom} />

        <RoomTypeForm
          currentRoom={currentRoom}
          errors={errors}
          roomTypesCount={roomTypes.length}
          onUpdateRoom={updateCurrentRoom}
          onToggleAmenity={toggleAmenity}
          onAddRoom={handleAddRoom}
        />

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
