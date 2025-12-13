"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ImageUpload } from "@/components/ui/image-upload";

interface PhotosSectionProps {
  expanded: boolean;
  onToggle: () => void;
  images: string[];
  onImagesChange: (images: string[]) => void;
}

/**
 * Photos section with image upload
 */
export function PhotosSection({ expanded, onToggle, images, onImagesChange }: PhotosSectionProps) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-3 text-sm font-medium">
          <span className="flex items-center gap-2">
            Photos
            {images.length > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {images.length}
              </span>
            )}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 px-3 pb-3">
        <ImageUpload
          images={images}
          onChange={onImagesChange}
          maxImages={5}
          label="Upload Room Photos"
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
