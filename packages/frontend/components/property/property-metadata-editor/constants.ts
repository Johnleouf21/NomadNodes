import {
  Wifi,
  Car,
  Coffee,
  Waves,
  Wind,
  Utensils,
  Tv,
  Dumbbell,
  Home,
  Building2,
  Mountain,
  Castle,
} from "lucide-react";

/**
 * Property types configuration
 */
export const PROPERTY_TYPES = [
  { value: "hotel", label: "Hotel", icon: Building2 },
  { value: "villa", label: "Villa", icon: Castle },
  { value: "apartment", label: "Apartment", icon: Home },
  { value: "cabin", label: "Cabin", icon: Mountain },
] as const;

/**
 * Amenities configuration
 */
export const AMENITIES_LIST = [
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "parking", label: "Parking", icon: Car },
  { id: "kitchen", label: "Kitchen", icon: Utensils },
  { id: "pool", label: "Pool", icon: Waves },
  { id: "ac", label: "Air Conditioning", icon: Wind },
  { id: "breakfast", label: "Breakfast", icon: Coffee },
  { id: "tv", label: "TV", icon: Tv },
  { id: "gym", label: "Gym", icon: Dumbbell },
] as const;

/**
 * House rules configuration
 */
export const HOUSE_RULES_LIST = [
  { id: "no_smoking", label: "No Smoking" },
  { id: "no_pets", label: "No Pets" },
  { id: "no_parties", label: "No Parties" },
  { id: "quiet_hours", label: "Quiet Hours (10PM - 8AM)" },
] as const;
