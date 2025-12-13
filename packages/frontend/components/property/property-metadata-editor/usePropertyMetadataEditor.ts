import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUpdateProperty } from "@/lib/hooks/usePropertyNFT";
import { uploadPropertyMetadataToIPFS, clearIPFSCache } from "@/lib/utils/ipfs";
import type { PropertyMetadata } from "@/lib/hooks/property/types";
import type { ExpandedSections, FormErrors, PropertyMetadataEditorProps } from "./types";

/**
 * Custom hook for property metadata editor logic
 */
export function usePropertyMetadataEditor({
  propertyId,
  currentMetadata,
  currentMetadataURI,
  onUpdate,
}: Pick<
  PropertyMetadataEditorProps,
  "propertyId" | "currentMetadata" | "currentMetadataURI" | "onUpdate"
>) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<ExpandedSections>({
    basic: true,
    location: false,
    photos: false,
    amenities: false,
  });

  // Form state
  const [metadata, setMetadata] = React.useState<PropertyMetadata>({
    name: currentMetadata?.name || "",
    description: currentMetadata?.description || "",
    propertyType: currentMetadata?.propertyType || "apartment",
    location: currentMetadata?.location || "",
    country: currentMetadata?.country || "",
    city: currentMetadata?.city || "",
    address: currentMetadata?.address || "",
    images: currentMetadata?.images || [],
    amenities: currentMetadata?.amenities || [],
    houseRules: currentMetadata?.houseRules || [],
  });

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [newIpfsHash, setNewIpfsHash] = React.useState<string | null>(null);

  const { updateProperty, isPending, isSuccess, error: txError, reset } = useUpdateProperty();

  // Handle transaction error
  React.useEffect(() => {
    if (txError) {
      toast.dismiss("blockchain-update");
      toast.error("Blockchain transaction failed", {
        description: txError.message || "Failed to update property metadata",
      });
      setIsSaving(false);
      setNewIpfsHash(null);
      reset();
    }
  }, [txError, reset]);

  // Reset form when currentMetadata changes
  React.useEffect(() => {
    if (currentMetadata) {
      setMetadata({
        name: currentMetadata.name || "",
        description: currentMetadata.description || "",
        propertyType: currentMetadata.propertyType || "apartment",
        location: currentMetadata.location || "",
        country: currentMetadata.country || "",
        city: currentMetadata.city || "",
        address: currentMetadata.address || "",
        images: currentMetadata.images || [],
        amenities: currentMetadata.amenities || [],
        houseRules: currentMetadata.houseRules || [],
      });
    }
  }, [currentMetadata]);

  // Handle success
  React.useEffect(() => {
    if (isSuccess && newIpfsHash) {
      toast.dismiss("blockchain-update");

      // Clear old IPFS cache
      if (currentMetadataURI) {
        clearIPFSCache(currentMetadataURI);
      }
      // Clear new IPFS cache to force fresh fetch
      clearIPFSCache(newIpfsHash);

      // Invalidate React Query caches
      queryClient.invalidateQueries({ queryKey: ["ipfs"] });
      queryClient.invalidateQueries({ queryKey: ["property"] });
      queryClient.invalidateQueries({ queryKey: ["ponderProperties"] });

      toast.success("Property metadata updated", {
        description: "Your changes have been saved to the blockchain",
      });
      setIsEditing(false);
      setIsSaving(false);
      setNewIpfsHash(null);
      reset();
      onUpdate?.();
    }
  }, [isSuccess, newIpfsHash, currentMetadataURI, queryClient, reset, onUpdate]);

  const toggleSection = (section: keyof ExpandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleAmenity = (amenityId: string) => {
    setMetadata((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((id) => id !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  };

  const toggleRule = (ruleId: string) => {
    setMetadata((prev) => ({
      ...prev,
      houseRules: prev.houseRules.includes(ruleId)
        ? prev.houseRules.filter((id) => id !== ruleId)
        : [...prev.houseRules, ruleId],
    }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!metadata.name || metadata.name.trim().length < 5) {
      newErrors.name = "Name must be at least 5 characters";
    }

    if (!metadata.description || metadata.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    if (!metadata.country || metadata.country.trim().length < 2) {
      newErrors.country = "Country is required";
    }

    if (!metadata.city || metadata.city.trim().length < 2) {
      newErrors.city = "City is required";
    }

    if (metadata.images.length === 0) {
      newErrors.images = "At least one photo is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      // Expand sections with errors
      if (errors.name || errors.description) {
        setExpandedSections((prev) => ({ ...prev, basic: true }));
      }
      if (errors.country || errors.city) {
        setExpandedSections((prev) => ({ ...prev, location: true }));
      }
      if (errors.images) {
        setExpandedSections((prev) => ({ ...prev, photos: true }));
      }
      return;
    }

    setIsSaving(true);

    try {
      // Generate location string
      const locationString = `${metadata.city}, ${metadata.country}`;
      const metadataToUpload: PropertyMetadata = {
        ...metadata,
        location: locationString,
      };

      // Upload to IPFS
      toast.loading("Uploading metadata to IPFS...", { id: "ipfs-upload" });
      const uploadedIpfsHash = await uploadPropertyMetadataToIPFS(metadataToUpload);
      toast.dismiss("ipfs-upload");

      if (uploadedIpfsHash === "QmPlaceholder") {
        toast.error("IPFS upload failed", {
          description: "Please check your Pinata configuration",
        });
        setIsSaving(false);
        return;
      }

      toast.success("Metadata uploaded to IPFS", {
        description: `Hash: ${uploadedIpfsHash.slice(0, 10)}...`,
      });

      // Store the new hash for cache invalidation on success
      setNewIpfsHash(uploadedIpfsHash);

      // Update property on blockchain
      toast.loading("Updating blockchain...", { id: "blockchain-update" });
      updateProperty(propertyId, uploadedIpfsHash);
    } catch (error) {
      console.error("Failed to save metadata:", error);
      toast.error("Failed to save changes", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setIsSaving(false);
      setNewIpfsHash(null);
    }
  };

  const handleCancel = () => {
    // Dismiss any pending toasts
    toast.dismiss("blockchain-update");
    toast.dismiss("ipfs-upload");

    setMetadata({
      name: currentMetadata?.name || "",
      description: currentMetadata?.description || "",
      propertyType: currentMetadata?.propertyType || "apartment",
      location: currentMetadata?.location || "",
      country: currentMetadata?.country || "",
      city: currentMetadata?.city || "",
      address: currentMetadata?.address || "",
      images: currentMetadata?.images || [],
      amenities: currentMetadata?.amenities || [],
      houseRules: currentMetadata?.houseRules || [],
    });
    setErrors({});
    setIsSaving(false);
    setNewIpfsHash(null);
    setIsEditing(false);
    reset();
  };

  const isLoading = isPending || isSaving;

  return {
    // State
    isEditing,
    setIsEditing,
    expandedSections,
    metadata,
    setMetadata,
    errors,
    setErrors,
    isLoading,

    // Actions
    toggleSection,
    toggleAmenity,
    toggleRule,
    handleSave,
    handleCancel,
  };
}
