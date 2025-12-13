"use client";

/**
 * Booking property image with urgency badge
 */

import { Badge } from "@/components/ui/badge";
import type { DaysUntilInfo } from "../utils";

interface BookingImageProps {
  propertyImage: string;
  propertyName: string;
  checkInInfo: DaysUntilInfo;
  showUrgency: boolean;
}

/**
 * Property image with optional urgency indicator
 */
export function BookingImage({
  propertyImage,
  propertyName,
  checkInInfo,
  showUrgency,
}: BookingImageProps) {
  return (
    <div className="relative h-32 w-32 flex-shrink-0 sm:h-36 sm:w-36">
      <img src={propertyImage} alt={propertyName} className="h-full w-full object-cover" />
      {showUrgency && checkInInfo.urgent && (
        <div className="absolute bottom-2 left-2">
          <Badge
            variant="secondary"
            className={`${
              checkInInfo.days <= 1 ? "bg-red-500 text-white" : "bg-yellow-500 text-white"
            } text-xs`}
          >
            {checkInInfo.label}
          </Badge>
        </div>
      )}
    </div>
  );
}
