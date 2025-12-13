/**
 * Constants for Room Type Metadata Editor
 */

import { Wifi, Wind, Tv, Coffee, Utensils, Waves, Dumbbell } from "lucide-react";
import type { AmenityItem } from "./types";

/**
 * Available room amenities
 */
export const ROOM_AMENITIES_LIST: AmenityItem[] = [
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "ac", label: "Air Conditioning", icon: Wind },
  { id: "tv", label: "TV", icon: Tv },
  { id: "minibar", label: "Minibar", icon: Coffee },
  { id: "safe", label: "In-room Safe", icon: Utensils },
  { id: "balcony", label: "Balcony", icon: Waves },
  { id: "bathtub", label: "Bathtub", icon: Waves },
  { id: "workspace", label: "Work Desk", icon: Dumbbell },
];

/**
 * Default metadata values
 */
export const DEFAULT_METADATA = {
  name: "",
  description: "",
  pricePerNight: 0,
  currency: "USD" as const,
  maxGuests: 2,
  minStayNights: 1,
  maxStayNights: 30,
  maxSupply: 1,
  images: [] as string[],
  amenities: [] as string[],
};
