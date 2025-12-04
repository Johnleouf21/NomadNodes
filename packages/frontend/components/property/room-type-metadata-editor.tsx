"use client";

import * as React from "react";
import {
  Edit2,
  Save,
  X,
  Upload,
  ChevronDown,
  ChevronUp,
  Wifi,
  Coffee,
  Waves,
  Wind,
  Utensils,
  Tv,
  Dumbbell,
  Users,
  Moon,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ImageUpload } from "@/components/ui/image-upload";
import { useUpdateRoomType } from "@/lib/hooks/property";
import { uploadRoomTypeMetadataToIPFS } from "@/lib/utils/ipfs";
import { toast } from "sonner";
import type { RoomTypeData } from "@/lib/hooks/property/types";

interface RoomTypeMetadataEditorProps {
  tokenId: bigint;
  currentMetadata?: Partial<RoomTypeData>;
  _currentMetadataURI?: string;
  onUpdate?: () => void;
}

const ROOM_AMENITIES_LIST = [
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "ac", label: "Air Conditioning", icon: Wind },
  { id: "tv", label: "TV", icon: Tv },
  { id: "minibar", label: "Minibar", icon: Coffee },
  { id: "safe", label: "In-room Safe", icon: Utensils },
  { id: "balcony", label: "Balcony", icon: Waves },
  { id: "bathtub", label: "Bathtub", icon: Waves },
  { id: "workspace", label: "Work Desk", icon: Dumbbell },
];

export function RoomTypeMetadataEditor({
  tokenId,
  currentMetadata,
  _currentMetadataURI,
  onUpdate,
}: RoomTypeMetadataEditorProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState({
    basic: true,
    photos: false,
    amenities: false,
  });

  // Form state
  const [metadata, setMetadata] = React.useState<Partial<RoomTypeData>>({
    name: currentMetadata?.name || "",
    description: currentMetadata?.description || "",
    pricePerNight: currentMetadata?.pricePerNight || 0,
    currency: currentMetadata?.currency || "USD",
    maxGuests: currentMetadata?.maxGuests || 2,
    minStayNights: currentMetadata?.minStayNights || 1,
    maxStayNights: currentMetadata?.maxStayNights || 30,
    maxSupply: currentMetadata?.maxSupply || 1,
    images: currentMetadata?.images || [],
    amenities: currentMetadata?.amenities || [],
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  const { updateRoomType, isPending, isSuccess } = useUpdateRoomType();

  // Reset form when currentMetadata changes
  React.useEffect(() => {
    if (currentMetadata) {
      setMetadata({
        name: currentMetadata.name || "",
        description: currentMetadata.description || "",
        pricePerNight: currentMetadata.pricePerNight || 0,
        currency: currentMetadata.currency || "USD",
        maxGuests: currentMetadata.maxGuests || 2,
        minStayNights: currentMetadata.minStayNights || 1,
        maxStayNights: currentMetadata.maxStayNights || 30,
        maxSupply: currentMetadata.maxSupply || 1,
        images: currentMetadata.images || [],
        amenities: currentMetadata.amenities || [],
      });
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

  const toggleSection = (section: keyof typeof expandedSections) => {
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
    const newErrors: Record<string, string> = {};

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
    setMetadata({
      name: currentMetadata?.name || "",
      description: currentMetadata?.description || "",
      pricePerNight: currentMetadata?.pricePerNight || 0,
      currency: currentMetadata?.currency || "USD",
      maxGuests: currentMetadata?.maxGuests || 2,
      minStayNights: currentMetadata?.minStayNights || 1,
      maxStayNights: currentMetadata?.maxStayNights || 30,
      maxSupply: currentMetadata?.maxSupply || 1,
      images: currentMetadata?.images || [],
      amenities: currentMetadata?.amenities || [],
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
              <CardTitle className="text-base">Room Details</CardTitle>
              <CardDescription className="text-xs">Metadata stored on IPFS</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-3 w-3" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground text-xs">Name</Label>
              <p className="text-sm font-medium">{currentMetadata?.name || "Not set"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Price per Night</Label>
              <p className="text-sm font-medium">
                {currentMetadata?.pricePerNight
                  ? `${currentMetadata.pricePerNight} ${currentMetadata.currency || "USD"}`
                  : "Not set"}
              </p>
            </div>
          </div>

          {currentMetadata?.description && (
            <div>
              <Label className="text-muted-foreground text-xs">Description</Label>
              <p className="text-sm">{currentMetadata.description}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-muted-foreground text-xs">Max Guests</Label>
              <p className="text-sm">{currentMetadata?.maxGuests || 2}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Min Stay</Label>
              <p className="text-sm">{currentMetadata?.minStayNights || 1} night(s)</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Max Stay</Label>
              <p className="text-sm">{currentMetadata?.maxStayNights || 30} nights</p>
            </div>
          </div>

          {currentMetadata?.amenities && currentMetadata.amenities.length > 0 && (
            <div>
              <Label className="text-muted-foreground text-xs">Room Amenities</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {currentMetadata.amenities.map((amenity) => {
                  const info = ROOM_AMENITIES_LIST.find((a) => a.id === amenity);
                  return (
                    <span key={amenity} className="bg-secondary rounded px-2 py-0.5 text-xs">
                      {info?.label || amenity}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {currentMetadata?.images && currentMetadata.images.length > 0 && (
            <div>
              <Label className="text-muted-foreground text-xs">Photos</Label>
              <p className="text-muted-foreground text-xs">
                {currentMetadata.images.length} photos
              </p>
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
        <CardTitle className="text-base">Edit Room Details</CardTitle>
        <CardDescription className="text-xs">Update metadata stored on IPFS</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Basic Info */}
        <Collapsible open={expandedSections.basic} onOpenChange={() => toggleSection("basic")}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 text-sm font-medium">
              Basic Information
              {expandedSections.basic ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 px-3 pb-3">
            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="room-name" className="text-xs">
                Room Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="room-name"
                value={metadata.name}
                onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                placeholder="e.g., Deluxe Suite"
                disabled={isLoading}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="room-desc" className="text-xs">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="room-desc"
                value={metadata.description}
                onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                placeholder="Describe the room..."
                rows={3}
                disabled={isLoading}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-destructive text-xs">{errors.description}</p>
              )}
            </div>

            {/* Price */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="room-price" className="text-xs">
                  Price per Night <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="room-price"
                  type="number"
                  min={0}
                  value={metadata.pricePerNight}
                  onChange={(e) =>
                    setMetadata({ ...metadata, pricePerNight: parseFloat(e.target.value) || 0 })
                  }
                  disabled={isLoading}
                  className={errors.pricePerNight ? "border-destructive" : ""}
                />
                {errors.pricePerNight && (
                  <p className="text-destructive text-xs">{errors.pricePerNight}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="room-currency" className="text-xs">
                  Currency
                </Label>
                <select
                  id="room-currency"
                  value={metadata.currency}
                  onChange={(e) =>
                    setMetadata({ ...metadata, currency: e.target.value as "USD" | "EUR" })
                  }
                  disabled={isLoading}
                  className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            {/* Capacity & Stay Limits */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="max-guests" className="flex items-center gap-1 text-xs">
                  <Users className="h-3 w-3" /> Max Guests
                </Label>
                <Input
                  id="max-guests"
                  type="number"
                  min={1}
                  max={20}
                  value={metadata.maxGuests}
                  onChange={(e) =>
                    setMetadata({ ...metadata, maxGuests: parseInt(e.target.value) || 2 })
                  }
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="min-stay" className="flex items-center gap-1 text-xs">
                  <Moon className="h-3 w-3" /> Min Nights
                </Label>
                <Input
                  id="min-stay"
                  type="number"
                  min={1}
                  max={30}
                  value={metadata.minStayNights}
                  onChange={(e) =>
                    setMetadata({ ...metadata, minStayNights: parseInt(e.target.value) || 1 })
                  }
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="max-stay" className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" /> Max Nights
                </Label>
                <Input
                  id="max-stay"
                  type="number"
                  min={1}
                  max={365}
                  value={metadata.maxStayNights}
                  onChange={(e) =>
                    setMetadata({ ...metadata, maxStayNights: parseInt(e.target.value) || 30 })
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Photos */}
        <Collapsible open={expandedSections.photos} onOpenChange={() => toggleSection("photos")}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 text-sm font-medium">
              <span className="flex items-center gap-2">
                Photos
                {(metadata.images?.length || 0) > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {metadata.images?.length}
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
          <CollapsibleContent className="space-y-3 px-3 pb-3">
            <ImageUpload
              images={metadata.images || []}
              onChange={(newImages) => setMetadata({ ...metadata, images: newImages })}
              maxImages={5}
              label="Upload Room Photos"
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Amenities */}
        <Collapsible
          open={expandedSections.amenities}
          onOpenChange={() => toggleSection("amenities")}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 text-sm font-medium">
              Room Amenities
              {expandedSections.amenities ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 px-3 pb-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {ROOM_AMENITIES_LIST.map((amenity) => {
                const Icon = amenity.icon;
                const isSelected = (metadata.amenities || []).includes(amenity.id);
                return (
                  <label
                    key={amenity.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm transition-colors ${
                      isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleAmenity(amenity.id)}
                      disabled={isLoading}
                    />
                    <Icon
                      className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span>{amenity.label}</span>
                  </label>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* IPFS Notice */}
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/50">
          <div className="flex items-start gap-2">
            <Upload className="mt-0.5 h-3 w-3 text-orange-600 dark:text-orange-400" />
            <p className="text-xs text-orange-800 dark:text-orange-200">
              Saving will upload metadata to IPFS and update the blockchain.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isLoading} className="flex-1" size="sm">
            <Save className="mr-2 h-3 w-3" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading} size="sm">
            <X className="mr-2 h-3 w-3" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
