"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  aspectRatio?: "square" | "video" | "wide" | "none";
  showIndicators?: boolean;
  showArrows?: boolean;
  className?: string;
  onImageClick?: () => void;
}

export function ImageCarousel({
  images,
  alt,
  aspectRatio = "wide",
  showIndicators = true,
  showArrows = true,
  className,
  onImageClick,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const hasMultipleImages = images.length > 1;

  const goToPrevious = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    },
    [images.length]
  );

  const goToNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    },
    [images.length]
  );

  const goToIndex = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  }, []);

  const aspectRatioClass =
    aspectRatio === "none"
      ? ""
      : {
          square: "aspect-square",
          video: "aspect-video",
          wide: "aspect-[4/3]",
        }[aspectRatio];

  if (images.length === 0) {
    return (
      <div className={cn("bg-muted flex items-center justify-center", aspectRatioClass, className)}>
        <Home className="text-muted-foreground/50 h-12 w-12" />
      </div>
    );
  }

  return (
    <div
      className={cn("bg-muted relative overflow-hidden", aspectRatioClass, className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onImageClick}
    >
      {/* Current Image */}
      <img
        src={images[currentIndex]}
        alt={`${alt} - Image ${currentIndex + 1}`}
        className="h-full w-full object-cover transition-transform duration-300"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/placeholder-property.svg";
        }}
      />

      {/* Navigation Arrows - Only show on hover and if multiple images */}
      {hasMultipleImages && showArrows && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "bg-background/80 hover:bg-background absolute top-1/2 left-2 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 shadow-md backdrop-blur transition-opacity",
              isHovered && "opacity-100"
            )}
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "bg-background/80 hover:bg-background absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 shadow-md backdrop-blur transition-opacity",
              isHovered && "opacity-100"
            )}
            onClick={goToNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Dot Indicators - Only show if multiple images */}
      {hasMultipleImages && showIndicators && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.slice(0, 5).map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToIndex(e, index)}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-all",
                index === currentIndex ? "bg-card w-3" : "bg-card/60 hover:bg-card/80"
              )}
            />
          ))}
          {images.length > 5 && (
            <span className="text-[10px] text-white/80">+{images.length - 5}</span>
          )}
        </div>
      )}

      {/* Image Counter */}
      {hasMultipleImages && (
        <div className="bg-foreground/50 text-background absolute right-2 bottom-2 rounded-full px-2 py-0.5 text-xs backdrop-blur">
          {currentIndex + 1}/{images.length}
        </div>
      )}
    </div>
  );
}
