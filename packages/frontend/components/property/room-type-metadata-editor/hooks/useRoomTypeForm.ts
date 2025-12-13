/**
 * Hook for managing room type metadata form state
 */

import * as React from "react";
import { toast } from "sonner";
import { useUpdateRoomType } from "@/lib/hooks/property";
import { uploadRoomTypeMetadataToIPFS } from "@/lib/utils/ipfs";
import type { RoomTypeData } from "@/lib/hooks/property/types";
import type { ExpandedSections, FormErrors } from "../types";
import { DEFAULT_METADATA } from "../constants";

interface UseRoomTypeFormParams {
  tokenId: bigint;
  currentMetadata?: Partial<RoomTypeData>;
  onUpdate?: () => void;
}

interface UseRoomTypeFormResult {
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  expandedSections: ExpandedSections;
  toggleSection: (section: keyof ExpandedSections) => void;
  metadata: Partial<RoomTypeData>;
  setMetadata: React.Dispatch<React.SetStateAction<Partial<RoomTypeData>>>;
  errors: FormErrors;
  isLoading: boolean;
  toggleAmenity: (amenityId: string) => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
}

export function useRoomTypeForm({
  tokenId,
  currentMetadata,
  onUpdate,
}: UseRoomTypeFormParams): UseRoomTypeFormResult {
  const [isEditing, setIsEditing] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<ExpandedSections>({
    basic: true,
    photos: false,
    amenities: false,
  });

  // Form state
  const [metadata, setMetadata] = React.useState<Partial<RoomTypeData>>(
    getInitialMetadata(currentMetadata)
  );
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSaving, setIsSaving] = React.useState(false);

  const { updateRoomType, isPending, isSuccess } = useUpdateRoomType();

  // Reset form when currentMetadata changes
  React.useEffect(() => {
    if (currentMetadata) {
      setMetadata(getInitialMetadata(currentMetadata));
    }
  }, [currentMetadata]);

  // Handle success
  React.useEffect(() => {
    if (isSuccess) {
      toast.success("Room type metadata updated", {
        description: "Your changes have been saved to the blockchain",
      });
      setIsEditing(false);
      setIsSaving(false);
      onUpdate?.();
    }
  }, [isSuccess, onUpdate]);

  const toggleSection = (section: keyof ExpandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleAmenity = (amenityId: string) => {
    setMetadata((prev) => ({
      ...prev,
      amenities: (prev.amenities || []).includes(amenityId)
        ? (prev.amenities || []).filter((id) => id !== amenityId)
        : [...(prev.amenities || []), amenityId],
    }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!metadata.name || metadata.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!metadata.description || metadata.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!metadata.pricePerNight || metadata.pricePerNight <= 0) {
      newErrors.pricePerNight = "Price must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      setExpandedSections((prev) => ({ ...prev, basic: true }));
      return;
    }

    setIsSaving(true);

    try {
      const metadataToUpload = {
        name: metadata.name || "",
        description: metadata.description || "",
        pricePerNight: metadata.pricePerNight || 0,
        currency: metadata.currency || "USD",
        maxGuests: metadata.maxGuests || 2,
        minStayNights: metadata.minStayNights || 1,
        maxStayNights: metadata.maxStayNights || 30,
        maxSupply: metadata.maxSupply || 1,
        images: metadata.images || [],
        amenities: metadata.amenities || [],
      } as RoomTypeData;

      // Upload to IPFS
      toast.loading("Uploading metadata to IPFS...", { id: "ipfs-upload" });
      const newIpfsHash = await uploadRoomTypeMetadataToIPFS(metadataToUpload);
      toast.dismiss("ipfs-upload");

      if (newIpfsHash === "QmPlaceholder") {
        toast.error("IPFS upload failed", {
          description: "Please check your Pinata configuration",
        });
        setIsSaving(false);
        return;
      }

      toast.success("Metadata uploaded to IPFS", {
        description: `Hash: ${newIpfsHash.slice(0, 10)}...`,
      });

      // Update room type on blockchain
      updateRoomType(tokenId, newIpfsHash);
    } catch (error) {
      console.error("Failed to save metadata:", error);
      toast.error("Failed to save changes", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setMetadata(getInitialMetadata(currentMetadata));
    setErrors({});
    setIsEditing(false);
  };

  const isLoading = isPending || isSaving;

  return {
    isEditing,
    setIsEditing,
    expandedSections,
    toggleSection,
    metadata,
    setMetadata,
    errors,
    isLoading,
    toggleAmenity,
    handleSave,
    handleCancel,
  };
}

/**
 * Get initial metadata with defaults
 */
function getInitialMetadata(currentMetadata?: Partial<RoomTypeData>): Partial<RoomTypeData> {
  return {
    name: currentMetadata?.name || DEFAULT_METADATA.name,
    description: currentMetadata?.description || DEFAULT_METADATA.description,
    pricePerNight: currentMetadata?.pricePerNight || DEFAULT_METADATA.pricePerNight,
    currency: currentMetadata?.currency || DEFAULT_METADATA.currency,
    maxGuests: currentMetadata?.maxGuests || DEFAULT_METADATA.maxGuests,
    minStayNights: currentMetadata?.minStayNights || DEFAULT_METADATA.minStayNights,
    maxStayNights: currentMetadata?.maxStayNights || DEFAULT_METADATA.maxStayNights,
    maxSupply: currentMetadata?.maxSupply || DEFAULT_METADATA.maxSupply,
    images: currentMetadata?.images || DEFAULT_METADATA.images,
    amenities: currentMetadata?.amenities || DEFAULT_METADATA.amenities,
  };
}
