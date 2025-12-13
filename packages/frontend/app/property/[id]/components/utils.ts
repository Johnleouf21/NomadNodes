import { amenityIcons, defaultAmenityIcon } from "./constants";

/**
 * Get icon for an amenity
 */
export function getAmenityIcon(amenity: string) {
  const key = amenity.toLowerCase().replace(/\s+/g, "_");
  return amenityIcons[key] || defaultAmenityIcon;
}

/**
 * Format amenity name for display
 */
export function formatAmenityName(amenity: string) {
  return amenity.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
