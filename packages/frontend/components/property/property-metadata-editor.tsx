"use client";

import * as React from "react";
import {
  Edit2,
  Save,
  X,
  Upload,
  MapPin,
  Wifi,
  Car,
  Coffee,
  Waves,
  Wind,
  Utensils,
  Tv,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Home,
  Building2,
  Mountain,
  Castle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ImageUpload } from "@/components/ui/image-upload";
import { useUpdateProperty } from "@/lib/hooks/usePropertyNFT";
import { uploadPropertyMetadataToIPFS } from "@/lib/utils/ipfs";
import { toast } from "sonner";
import type { PropertyMetadata } from "@/lib/hooks/property/types";

interface PropertyMetadataEditorProps {
  propertyId: bigint;
  currentMetadata?: PropertyMetadata;
  currentMetadataURI?: string;
  onUpdate?: () => void;
}

const PROPERTY_TYPES = [
  { value: "hotel", label: "Hotel", icon: Building2 },
  { value: "villa", label: "Villa", icon: Castle },
  { value: "apartment", label: "Apartment", icon: Home },
  { value: "cabin", label: "Cabin", icon: Mountain },
];

const AMENITIES_LIST = [
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "parking", label: "Parking", icon: Car },
  { id: "kitchen", label: "Kitchen", icon: Utensils },
  { id: "pool", label: "Pool", icon: Waves },
  { id: "ac", label: "Air Conditioning", icon: Wind },
  { id: "breakfast", label: "Breakfast", icon: Coffee },
  { id: "tv", label: "TV", icon: Tv },
  { id: "gym", label: "Gym", icon: Dumbbell },
];

const HOUSE_RULES_LIST = [
  { id: "no_smoking", label: "No Smoking" },
  { id: "no_pets", label: "No Pets" },
  { id: "no_parties", label: "No Parties" },
  { id: "quiet_hours", label: "Quiet Hours (10PM - 8AM)" },
];

export function PropertyMetadataEditor({
  propertyId,
  currentMetadata,
  currentMetadataURI,
  onUpdate,
}: PropertyMetadataEditorProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState({
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

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  const { updateProperty, isPending, isSuccess } = useUpdateProperty();

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
    if (isSuccess) {
      toast.success("Property metadata updated", {
        description: "Your changes have been saved to the blockchain",
      });
      setIsEditing(false);
      setIsSaving(false);
      onUpdate?.();
    }
  }, [isSuccess, onUpdate]);

  const toggleSection = (section: keyof typeof expandedSections) => {
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
    const newErrors: Record<string, string> = {};

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
      const newIpfsHash = await uploadPropertyMetadataToIPFS(metadataToUpload);
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

      // Update property on blockchain
      updateProperty(propertyId, newIpfsHash);
    } catch (error) {
      console.error("Failed to save metadata:", error);
      toast.error("Failed to save changes", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
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
    setIsEditing(false);
  };

  const isLoading = isPending || isSaving;

  // View Mode
  if (!isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Property Metadata</CardTitle>
              <CardDescription>Information stored on IPFS</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="text-lg font-semibold">{currentMetadata?.name || "Not set"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm">{currentMetadata?.description || "No description"}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Property Type</Label>
                <p className="text-sm font-medium capitalize">
                  {currentMetadata?.propertyType || "Not set"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Location</Label>
                <p className="text-sm font-medium">
                  {currentMetadata?.location ||
                    `${currentMetadata?.city || ""}, ${currentMetadata?.country || ""}` ||
                    "Not set"}
                </p>
              </div>
            </div>
          </div>

          {/* Photos */}
          {currentMetadata?.images && currentMetadata.images.length > 0 && (
            <div>
              <Label className="text-muted-foreground">
                Photos ({currentMetadata.images.length})
              </Label>
              <p className="text-muted-foreground text-sm">
                {currentMetadata.images.length} photos uploaded
              </p>
            </div>
          )}

          {/* Amenities */}
          {currentMetadata?.amenities && currentMetadata.amenities.length > 0 && (
            <div>
              <Label className="text-muted-foreground">Amenities</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {currentMetadata.amenities.map((amenity) => {
                  const amenityInfo = AMENITIES_LIST.find((a) => a.id === amenity);
                  return (
                    <span
                      key={amenity}
                      className="bg-secondary rounded-full px-3 py-1 text-xs capitalize"
                    >
                      {amenityInfo?.label || amenity.replace("_", " ")}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* House Rules */}
          {currentMetadata?.houseRules && currentMetadata.houseRules.length > 0 && (
            <div>
              <Label className="text-muted-foreground">House Rules</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {currentMetadata.houseRules.map((rule) => {
                  const ruleInfo = HOUSE_RULES_LIST.find((r) => r.id === rule);
                  return (
                    <span key={rule} className="bg-secondary rounded-full px-3 py-1 text-xs">
                      {ruleInfo?.label || rule.replace("_", " ")}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* IPFS Hash */}
          {currentMetadataURI && (
            <div>
              <Label className="text-muted-foreground">IPFS Hash</Label>
              <p className="text-muted-foreground font-mono text-xs">{currentMetadataURI}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Edit Mode
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Edit Property Metadata</CardTitle>
            <CardDescription>Update information stored on IPFS</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Section 1: Basic Information */}
        <Collapsible open={expandedSections.basic} onOpenChange={() => toggleSection("basic")}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 font-semibold">
              <span>Basic Information</span>
              {expandedSections.basic ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 px-4 pb-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Property Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={metadata.name}
                onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                placeholder="e.g., Sunset Beach Villa"
                disabled={isLoading}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                placeholder="Describe your property..."
                rows={4}
                disabled={isLoading}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-destructive text-sm">{errors.description}</p>
              )}
              <p className="text-muted-foreground text-xs">
                {metadata.description.length}/500 characters
              </p>
            </div>

            {/* Property Type */}
            <div className="space-y-3">
              <Label>Property Type</Label>
              <RadioGroup
                value={metadata.propertyType}
                onValueChange={(value) => setMetadata({ ...metadata, propertyType: value as any })}
                disabled={isLoading}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {PROPERTY_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <label
                        key={type.value}
                        htmlFor={`type-${type.value}`}
                        className={`relative flex cursor-pointer rounded-lg border-2 p-3 transition-colors ${
                          metadata.propertyType === type.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem
                          value={type.value}
                          id={`type-${type.value}`}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`h-5 w-5 ${metadata.propertyType === type.value ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <span className="font-medium">{type.label}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Section 2: Location */}
        <Collapsible
          open={expandedSections.location}
          onOpenChange={() => toggleSection("location")}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 font-semibold">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </span>
              {expandedSections.location ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 px-4 pb-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="country"
                  value={metadata.country}
                  onChange={(e) => setMetadata({ ...metadata, country: e.target.value })}
                  placeholder="e.g., Indonesia"
                  disabled={isLoading}
                  className={errors.country ? "border-destructive" : ""}
                />
                {errors.country && <p className="text-destructive text-sm">{errors.country}</p>}
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  value={metadata.city}
                  onChange={(e) => setMetadata({ ...metadata, city: e.target.value })}
                  placeholder="e.g., Bali"
                  disabled={isLoading}
                  className={errors.city ? "border-destructive" : ""}
                />
                {errors.city && <p className="text-destructive text-sm">{errors.city}</p>}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={metadata.address}
                onChange={(e) => setMetadata({ ...metadata, address: e.target.value })}
                placeholder="e.g., 123 Beach Road"
                disabled={isLoading}
              />
              <p className="text-muted-foreground text-xs">
                <MapPin className="mr-1 inline h-3 w-3" />
                The full address is only shared with confirmed guests
              </p>
            </div>

            {/* Location Preview */}
            {metadata.city && metadata.country && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-sm font-medium">Location display:</p>
                <p className="text-base font-semibold">
                  {metadata.city}, {metadata.country}
                </p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Section 3: Photos */}
        <Collapsible open={expandedSections.photos} onOpenChange={() => toggleSection("photos")}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 font-semibold">
              <span className="flex items-center gap-2">
                Photos
                {metadata.images.length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {metadata.images.length}
                  </span>
                )}
              </span>
              {expandedSections.photos ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 px-4 pb-4">
            <ImageUpload
              images={metadata.images}
              onChange={(newImages) => {
                setMetadata({ ...metadata, images: newImages });
                if (errors.images) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.images;
                    return newErrors;
                  });
                }
              }}
              maxImages={10}
              label="Upload Photos"
            />
            {errors.images && <p className="text-destructive text-sm">{errors.images}</p>}
            <p className="text-muted-foreground text-sm">
              The first image will be used as the cover photo. Drag to reorder.
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* Section 4: Amenities & Rules */}
        <Collapsible
          open={expandedSections.amenities}
          onOpenChange={() => toggleSection("amenities")}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 font-semibold">
              <span>Amenities & House Rules</span>
              {expandedSections.amenities ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-6 px-4 pb-4">
            {/* Amenities */}
            <div className="space-y-3">
              <Label>What amenities do you offer?</Label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {AMENITIES_LIST.map((amenity) => {
                  const Icon = amenity.icon;
                  const isSelected = metadata.amenities.includes(amenity.id);
                  return (
                    <label
                      key={amenity.id}
                      htmlFor={`amenity-${amenity.id}`}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Checkbox
                        id={`amenity-${amenity.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleAmenity(amenity.id)}
                        disabled={isLoading}
                      />
                      <Icon
                        className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span className="text-sm font-medium">{amenity.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* House Rules */}
            <div className="space-y-3">
              <Label>House Rules</Label>
              <div className="space-y-2">
                {HOUSE_RULES_LIST.map((rule) => (
                  <label
                    key={rule.id}
                    htmlFor={`rule-${rule.id}`}
                    className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
                  >
                    <Checkbox
                      id={`rule-${rule.id}`}
                      checked={metadata.houseRules.includes(rule.id)}
                      onCheckedChange={() => toggleRule(rule.id)}
                      disabled={isLoading}
                    />
                    <span className="text-sm">{rule.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* IPFS Upload Notice */}
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/50">
          <div className="flex items-start gap-2">
            <Upload className="mt-0.5 h-4 w-4 text-orange-600 dark:text-orange-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                IPFS Upload Required
              </p>
              <p className="text-xs text-orange-800 dark:text-orange-200">
                Saving will upload your metadata to IPFS and update the blockchain with the new
                hash. This requires a transaction.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={isLoading} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
