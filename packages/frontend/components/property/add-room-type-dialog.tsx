"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import { Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { useAddRoomType } from "@/lib/hooks/property";
import { toast } from "sonner";
import type { RoomTypeData } from "@/lib/hooks/property/types";

interface AddRoomTypeDialogProps {
  propertyId: bigint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const initialFormData: Partial<RoomTypeData> = {
  name: "",
  description: "",
  pricePerNight: 100,
  cleaningFee: 0,
  currency: "USD",
  maxGuests: 2,
  minStayNights: 1,
  maxStayNights: 30,
  maxSupply: 1,
  images: [],
  amenities: [],
};

export function AddRoomTypeDialog({
  propertyId,
  open,
  onOpenChange,
  onSuccess,
}: AddRoomTypeDialogProps) {
  const [formData, setFormData] = React.useState<Partial<RoomTypeData>>(initialFormData);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const { addRoomType, isPending, isSuccess, error, reset } = useAddRoomType();

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setFormData(initialFormData);
      setErrors({});
      reset();
    }
  }, [open, reset]);

  // Handle success
  React.useEffect(() => {
    if (isSuccess) {
      toast.success("Room type added", {
        description: `Successfully added "${formData.name}"`,
      });
      onOpenChange(false);
      onSuccess?.();
    }
  }, [isSuccess, formData.name, onOpenChange, onSuccess]);

  // Handle error
  React.useEffect(() => {
    if (error) {
      toast.error("Failed to add room type", {
        description: error.message || "An error occurred",
      });
    }
  }, [error]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!formData.pricePerNight || formData.pricePerNight <= 0) {
      newErrors.pricePerNight = "Price must be greater than 0";
    }

    if (!formData.maxGuests || formData.maxGuests < 1) {
      newErrors.maxGuests = "Max guests must be at least 1";
    }

    if (!formData.maxSupply || formData.maxSupply < 1) {
      newErrors.maxSupply = "Supply must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const roomData: RoomTypeData = {
      name: formData.name || "",
      description: formData.description || "",
      pricePerNight: formData.pricePerNight || 100,
      cleaningFee: formData.cleaningFee || 0,
      currency: formData.currency || "USD",
      maxGuests: formData.maxGuests || 2,
      minStayNights: formData.minStayNights || 1,
      maxStayNights: formData.maxStayNights || 30,
      maxSupply: formData.maxSupply || 1,
      images: formData.images || [],
      amenities: formData.amenities || [],
    };

    try {
      toast.loading("Creating room type...", { id: "add-room" });
      await addRoomType(propertyId, roomData);
      toast.dismiss("add-room");
    } catch (err) {
      toast.dismiss("add-room");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[600px]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add New Room Type</DialogTitle>
          <DialogDescription>
            Create a new room type for your property. This will create an ERC1155 token.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto py-4 pr-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="room-name">
              Room Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="room-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Deluxe Suite"
              disabled={isPending}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="room-desc">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="room-desc"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the room type..."
              rows={3}
              disabled={isPending}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
          </div>

          {/* Price, Cleaning Fee, and Currency */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="room-price">
                Price per Night <span className="text-destructive">*</span>
              </Label>
              <Input
                id="room-price"
                type="number"
                min={1}
                value={formData.pricePerNight}
                onChange={(e) =>
                  setFormData({ ...formData, pricePerNight: parseFloat(e.target.value) || 0 })
                }
                disabled={isPending}
                className={errors.pricePerNight ? "border-destructive" : ""}
              />
              {errors.pricePerNight && (
                <p className="text-destructive text-xs">{errors.pricePerNight}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cleaning-fee">Cleaning Fee</Label>
              <Input
                id="cleaning-fee"
                type="number"
                min={0}
                value={formData.cleaningFee}
                onChange={(e) =>
                  setFormData({ ...formData, cleaningFee: parseFloat(e.target.value) || 0 })
                }
                disabled={isPending}
              />
              <p className="text-muted-foreground text-xs">Optional</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-currency">Currency</Label>
              <select
                id="room-currency"
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value as "USD" | "EUR" })
                }
                disabled={isPending}
                className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Max Guests and Supply */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max-guests">
                Max Guests <span className="text-destructive">*</span>
              </Label>
              <Input
                id="max-guests"
                type="number"
                min={1}
                max={20}
                value={formData.maxGuests}
                onChange={(e) =>
                  setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 1 })
                }
                disabled={isPending}
                className={errors.maxGuests ? "border-destructive" : ""}
              />
              {errors.maxGuests && <p className="text-destructive text-xs">{errors.maxGuests}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-supply">
                Number of Units <span className="text-destructive">*</span>
              </Label>
              <Input
                id="max-supply"
                type="number"
                min={1}
                max={100}
                value={formData.maxSupply}
                onChange={(e) =>
                  setFormData({ ...formData, maxSupply: parseInt(e.target.value) || 1 })
                }
                disabled={isPending}
                className={errors.maxSupply ? "border-destructive" : ""}
              />
              <p className="text-muted-foreground text-xs">
                How many rooms of this type do you have?
              </p>
              {errors.maxSupply && <p className="text-destructive text-xs">{errors.maxSupply}</p>}
            </div>
          </div>

          {/* Min/Max Stay */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min-stay">Min Stay (nights)</Label>
              <Input
                id="min-stay"
                type="number"
                min={1}
                max={30}
                value={formData.minStayNights}
                onChange={(e) =>
                  setFormData({ ...formData, minStayNights: parseInt(e.target.value) || 1 })
                }
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-stay">Max Stay (nights)</Label>
              <Input
                id="max-stay"
                type="number"
                min={1}
                max={365}
                value={formData.maxStayNights}
                onChange={(e) =>
                  setFormData({ ...formData, maxStayNights: parseInt(e.target.value) || 30 })
                }
                disabled={isPending}
              />
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Room Photos</Label>
            <ImageUpload
              images={formData.images || []}
              onChange={(newImages) => setFormData({ ...formData, images: newImages })}
              maxImages={5}
              label="Upload room photos"
            />
          </div>

          {/* IPFS Notice */}
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/50">
            <div className="flex items-start gap-2">
              <Upload className="mt-0.5 h-4 w-4 text-orange-600 dark:text-orange-400" />
              <p className="text-xs text-orange-800 dark:text-orange-200">
                Creating a room type will upload metadata to IPFS and create a blockchain
                transaction.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Creating..." : "Create Room Type"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
