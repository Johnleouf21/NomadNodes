/**
 * Types for Room Type Metadata Editor
 */

import type { RoomTypeData } from "@/lib/hooks/property/types";
import type { LucideIcon } from "lucide-react";

/**
 * Props for the main RoomTypeMetadataEditor component
 */
export interface RoomTypeMetadataEditorProps {
  tokenId: bigint;
  currentMetadata?: Partial<RoomTypeData>;
  _currentMetadataURI?: string;
  onUpdate?: () => void;
}

/**
 * Amenity definition
 */
export interface AmenityItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Collapsible sections state
 */
export interface ExpandedSections {
  basic: boolean;
  photos: boolean;
  amenities: boolean;
}

/**
 * Form validation errors
 */
export type FormErrors = Record<string, string>;
