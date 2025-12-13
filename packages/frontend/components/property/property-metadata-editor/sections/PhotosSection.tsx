"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ImageUpload } from "@/components/ui/image-upload";
import type { SectionProps } from "../types";

/**
 * Photos section
 */
export function PhotosSection({
  metadata,
  setMetadata,
  errors,
  setErrors,
  isLoading: _isLoading,
  isExpanded,
  onToggle,
}: SectionProps) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 font-semibold">
          <span className="flex items-center gap-2">
            Photos
            {metadata.images.length > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {metadata.images.length}
              </span>
            )}
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 px-4 pb-4">
        <ImageUpload
          images={metadata.images}
          onChange={(newImages) => {
            setMetadata({ ...metadata, images: newImages });
            if (errors.images) {
              setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.images;
                return newErrors;
              });
            }
          }}
          maxImages={10}
          label="Upload Photos"
        />
        {errors.images && <p className="text-destructive text-sm">{errors.images}</p>}
        <p className="text-muted-foreground text-sm">
          The first image will be used as the cover photo. Drag to reorder.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
