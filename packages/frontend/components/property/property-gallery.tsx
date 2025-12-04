"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Grid3X3, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { getIPFSUrl } from "@/lib/utils/ipfs";

interface PropertyGalleryProps {
  images: string[];
  propertyName: string;
}

export function PropertyGallery({ images, propertyName }: PropertyGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Convert IPFS hashes to URLs
  const imageUrls = images.map((img) => getIPFSUrl(img));

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") setLightboxOpen(false);
  };

  if (imageUrls.length === 0) {
    return (
      <div className="bg-muted flex h-[400px] w-full items-center justify-center rounded-lg">
        <div className="text-center">
          <Home className="text-muted-foreground/50 mx-auto h-16 w-16" />
          <p className="text-muted-foreground mt-2">No photos available</p>
        </div>
      </div>
    );
  }

  // Single image layout
  if (imageUrls.length === 1) {
    return (
      <div
        className="relative h-[400px] w-full cursor-pointer overflow-hidden rounded-lg"
        onClick={() => openLightbox(0)}
      >
        <img
          src={imageUrls[0]}
          alt={propertyName}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-property.svg";
          }}
        />
        <LightboxDialog
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          images={imageUrls}
          currentIndex={currentIndex}
          propertyName={propertyName}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onKeyDown={handleKeyDown}
        />
      </div>
    );
  }

  // Grid layout for multiple images (Airbnb style)
  return (
    <div className="relative">
      <div className="grid h-[400px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-lg">
        {/* Main large image */}
        <div
          className="col-span-2 row-span-2 cursor-pointer overflow-hidden"
          onClick={() => openLightbox(0)}
        >
          <img
            src={imageUrls[0]}
            alt={`${propertyName} - Main`}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-property.svg";
            }}
          />
        </div>

        {/* Smaller images */}
        {imageUrls.slice(1, 5).map((url, index) => (
          <div
            key={index}
            className="cursor-pointer overflow-hidden"
            onClick={() => openLightbox(index + 1)}
          >
            <img
              src={url}
              alt={`${propertyName} - ${index + 2}`}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-property.svg";
              }}
            />
          </div>
        ))}
      </div>

      {/* Show all photos button */}
      {imageUrls.length > 5 && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute right-4 bottom-4 gap-2"
          onClick={() => openLightbox(0)}
        >
          <Grid3X3 className="h-4 w-4" />
          Show all {imageUrls.length} photos
        </Button>
      )}

      <LightboxDialog
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={imageUrls}
        currentIndex={currentIndex}
        propertyName={propertyName}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

interface LightboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  currentIndex: number;
  propertyName: string;
  onPrevious: () => void;
  onNext: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function LightboxDialog({
  open,
  onOpenChange,
  images,
  currentIndex,
  propertyName,
  onPrevious,
  onNext,
  onKeyDown,
}: LightboxDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] border-none bg-black/95 p-0 sm:max-w-[90vw]"
        onKeyDown={onKeyDown}
      >
        <DialogTitle>{propertyName} - Photo Gallery</DialogTitle>
        <div className="relative flex h-[90vh] flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm">
              {currentIndex + 1} / {images.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Main image area */}
          <div className="relative flex flex-1 items-center justify-center px-16">
            <img
              src={images[currentIndex]}
              alt={`${propertyName} - ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-property.svg";
              }}
            />

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
                  onClick={onPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
                  onClick={onNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto p-4">
              {images.map((url, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const setIndex = (window as any).__setLightboxIndex;
                    if (setIndex) setIndex(index);
                  }}
                  className={cn(
                    "h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition-all",
                    index === currentIndex
                      ? "border-white"
                      : "border-transparent opacity-50 hover:opacity-100"
                  )}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-property.svg";
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
