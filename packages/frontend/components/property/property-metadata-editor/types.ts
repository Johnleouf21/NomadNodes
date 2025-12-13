import type { PropertyMetadata } from "@/lib/hooks/property/types";

/**
 * Props for PropertyMetadataEditor
 */
export interface PropertyMetadataEditorProps {
  propertyId: bigint;
  currentMetadata?: PropertyMetadata;
  currentMetadataURI?: string;
  onUpdate?: () => void;
}

/**
 * Collapsible section state
 */
export interface ExpandedSections {
  basic: boolean;
  location: boolean;
  photos: boolean;
  amenities: boolean;
}

/**
 * Form validation errors
 */
export type FormErrors = Record<string, string>;

/**
 * Props for section components
 */
export interface SectionProps {
  metadata: PropertyMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<PropertyMetadata>>;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  isLoading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Props for PropertyMetadataView
 */
export interface PropertyMetadataViewProps {
  currentMetadata?: PropertyMetadata;
  currentMetadataURI?: string;
  onEdit: () => void;
}
