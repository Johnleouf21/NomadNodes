"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RoomTypeMetadataEditorProps } from "./types";
import { useRoomTypeForm } from "./hooks";
import {
  ViewMode,
  BasicInfoSection,
  PhotosSection,
  AmenitiesSection,
  EditModeActions,
} from "./components";

/**
 * Room type metadata editor component
 * Allows editing room type details stored on IPFS
 */
export function RoomTypeMetadataEditor({
  tokenId,
  currentMetadata,
  _currentMetadataURI,
  onUpdate,
}: RoomTypeMetadataEditorProps) {
  const {
    isEditing,
    setIsEditing,
    expandedSections,
    toggleSection,
    metadata,
    setMetadata,
    errors,
    isLoading,
    toggleAmenity,
    handleSave,
    handleCancel,
  } = useRoomTypeForm({
    tokenId,
    currentMetadata,
    onUpdate,
  });

  // View Mode
  if (!isEditing) {
    return <ViewMode currentMetadata={currentMetadata} onEdit={() => setIsEditing(true)} />;
  }

  // Edit Mode
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit Room Details</CardTitle>
        <CardDescription className="text-xs">Update metadata stored on IPFS</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Basic Info */}
        <BasicInfoSection
          expanded={expandedSections.basic}
          onToggle={() => toggleSection("basic")}
          metadata={metadata}
          onMetadataChange={(updates) => setMetadata((prev) => ({ ...prev, ...updates }))}
          errors={errors}
          isLoading={isLoading}
        />

        {/* Photos */}
        <PhotosSection
          expanded={expandedSections.photos}
          onToggle={() => toggleSection("photos")}
          images={metadata.images || []}
          onImagesChange={(images) => setMetadata((prev) => ({ ...prev, images }))}
        />

        {/* Amenities */}
        <AmenitiesSection
          expanded={expandedSections.amenities}
          onToggle={() => toggleSection("amenities")}
          selectedAmenities={metadata.amenities || []}
          onToggleAmenity={toggleAmenity}
          isLoading={isLoading}
        />

        {/* Actions */}
        <EditModeActions isLoading={isLoading} onSave={handleSave} onCancel={handleCancel} />
      </CardContent>
    </Card>
  );
}
