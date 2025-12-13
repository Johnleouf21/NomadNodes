"use client";

import { Save, X, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyMetadataView } from "./PropertyMetadataView";
import { usePropertyMetadataEditor } from "./usePropertyMetadataEditor";
import { BasicInfoSection, LocationSection, PhotosSection, AmenitiesSection } from "./sections";
import type { PropertyMetadataEditorProps } from "./types";

/**
 * Property metadata editor component
 */
export function PropertyMetadataEditor({
  propertyId,
  currentMetadata,
  currentMetadataURI,
  onUpdate,
}: PropertyMetadataEditorProps) {
  const {
    isEditing,
    setIsEditing,
    expandedSections,
    metadata,
    setMetadata,
    errors,
    setErrors,
    isLoading,
    toggleSection,
    toggleAmenity,
    toggleRule,
    handleSave,
    handleCancel,
  } = usePropertyMetadataEditor({
    propertyId,
    currentMetadata,
    currentMetadataURI,
    onUpdate,
  });

  // View Mode
  if (!isEditing) {
    return (
      <PropertyMetadataView
        currentMetadata={currentMetadata}
        currentMetadataURI={currentMetadataURI}
        onEdit={() => setIsEditing(true)}
      />
    );
  }

  // Edit Mode
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Edit Property Metadata</CardTitle>
            <CardDescription>Update information stored on IPFS</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Section 1: Basic Information */}
        <BasicInfoSection
          metadata={metadata}
          setMetadata={setMetadata}
          errors={errors}
          setErrors={setErrors}
          isLoading={isLoading}
          isExpanded={expandedSections.basic}
          onToggle={() => toggleSection("basic")}
        />

        {/* Section 2: Location */}
        <LocationSection
          metadata={metadata}
          setMetadata={setMetadata}
          errors={errors}
          setErrors={setErrors}
          isLoading={isLoading}
          isExpanded={expandedSections.location}
          onToggle={() => toggleSection("location")}
        />

        {/* Section 3: Photos */}
        <PhotosSection
          metadata={metadata}
          setMetadata={setMetadata}
          errors={errors}
          setErrors={setErrors}
          isLoading={isLoading}
          isExpanded={expandedSections.photos}
          onToggle={() => toggleSection("photos")}
        />

        {/* Section 4: Amenities & Rules */}
        <AmenitiesSection
          metadata={metadata}
          isLoading={isLoading}
          isExpanded={expandedSections.amenities}
          onToggle={() => toggleSection("amenities")}
          onToggleAmenity={toggleAmenity}
          onToggleRule={toggleRule}
        />

        {/* IPFS Upload Notice */}
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/50">
          <div className="flex items-start gap-2">
            <Upload className="mt-0.5 h-4 w-4 text-orange-600 dark:text-orange-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                IPFS Upload Required
              </p>
              <p className="text-xs text-orange-800 dark:text-orange-200">
                Saving will upload your metadata to IPFS and update the blockchain with the new
                hash. This requires a transaction.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={isLoading} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
