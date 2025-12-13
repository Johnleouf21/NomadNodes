import {
  Wifi,
  Waves,
  Utensils,
  Car,
  Wind,
  Flame,
  ShowerHead,
  Tv,
  Dumbbell,
  Sparkles,
  Sun,
  CheckCircle2,
} from "lucide-react";
import React from "react";

/**
 * Amenity Icons Mapping
 */
export const amenityIcons: Record<string, React.ReactNode> = {
  wifi: React.createElement(Wifi, { className: "h-4 w-4" }),
  pool: React.createElement(Waves, { className: "h-4 w-4" }),
  kitchen: React.createElement(Utensils, { className: "h-4 w-4" }),
  parking: React.createElement(Car, { className: "h-4 w-4" }),
  air_conditioning: React.createElement(Wind, { className: "h-4 w-4" }),
  heating: React.createElement(Flame, { className: "h-4 w-4" }),
  washer: React.createElement(ShowerHead, { className: "h-4 w-4" }),
  dryer: React.createElement(Wind, { className: "h-4 w-4" }),
  tv: React.createElement(Tv, { className: "h-4 w-4" }),
  gym: React.createElement(Dumbbell, { className: "h-4 w-4" }),
  hot_tub: React.createElement(Sparkles, { className: "h-4 w-4" }),
  beach_access: React.createElement(Sun, { className: "h-4 w-4" }),
};

export const defaultAmenityIcon = React.createElement(CheckCircle2, { className: "h-4 w-4" });
