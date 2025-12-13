/**
 * Types and constants for PropertyRoomTypes
 */

import { Wifi, Tv, Wind, Coffee, Bath, Mountain, Sofa, Car, type LucideIcon } from "lucide-react";
import type { RoomTypeData } from "@/lib/hooks/usePropertyNFT";

export interface RoomAmenity {
  id: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Room-specific amenities
 */
export const ROOM_AMENITIES: RoomAmenity[] = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "tv", label: "TV", icon: Tv },
  { id: "ac", label: "Air Conditioning", icon: Wind },
  { id: "minibar", label: "Minibar", icon: Coffee },
  { id: "private_bathroom", label: "Private Bathroom", icon: Bath },
  { id: "balcony", label: "Balcony", icon: Mountain },
  { id: "seating_area", label: "Seating Area", icon: Sofa },
  { id: "parking", label: "Parking", icon: Car },
];

export interface PropertyRoomTypesProps {
  data: unknown;
  roomTypes: RoomTypeData[];
  onNext: (data: unknown) => void;
  onBack: () => void;
  onRoomTypesChange: (roomTypes: RoomTypeData[]) => void;
}

export const DEFAULT_ROOM: Partial<RoomTypeData> = {
  name: "",
  description: "",
  maxSupply: 1,
  pricePerNight: 0,
  currency: "USD",
  maxGuests: 2,
  minStayNights: 1,
  maxStayNights: 30,
  amenities: [],
  images: [],
};
