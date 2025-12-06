"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import { DollarSign, Check, X, Edit2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateRoomTypeSettings } from "@/lib/hooks/property";
import { toast } from "sonner";
import { formatUnits, parseUnits } from "viem";

interface RoomPricingEditorProps {
  tokenId: bigint;
  currentPricePerNight: bigint; // In stablecoin units (6 decimals)
  currentCleaningFee: bigint; // In stablecoin units (6 decimals)
  currency?: "USD" | "EUR";
  _onUpdate?: () => void;
}

/**
 * Component for editing room type pricing settings.
 * Allows hosts to update price per night and cleaning fee.
 *
 * Note: In the new architecture, maxGuests, minStayNights, and maxStayNights
 * are set at room type creation and cannot be modified.
 */
export function RoomPricingEditor({
  tokenId,
  currentPricePerNight,
  currentCleaningFee,
  currency = "USD",
  _onUpdate: onUpdate,
}: RoomPricingEditorProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  // Convert from 6 decimal units to human-readable
  const [pricePerNight, setPricePerNight] = React.useState(
    parseFloat(formatUnits(currentPricePerNight, 6))
  );
  const [cleaningFee, setCleaningFee] = React.useState(
    parseFloat(formatUnits(currentCleaningFee, 6))
  );

  const { updateRoomTypeSettings, isPending, isSuccess, error } = useUpdateRoomTypeSettings();

  // Reset form when current values change
  React.useEffect(() => {
    setPricePerNight(parseFloat(formatUnits(currentPricePerNight, 6)));
    setCleaningFee(parseFloat(formatUnits(currentCleaningFee, 6)));
  }, [currentPricePerNight, currentCleaningFee]);

  // Handle success
  React.useEffect(() => {
    if (isSuccess) {
      toast.success("Pricing updated", {
        description: "Your pricing changes have been saved successfully",
      });
      setIsEditing(false);
      onUpdate?.();
    }
  }, [isSuccess, onUpdate]);

  // Handle error
  React.useEffect(() => {
    if (error) {
      toast.error("Failed to update pricing", {
        description: error.message || "An error occurred while updating pricing",
      });
    }
  }, [error]);

  const handleSave = () => {
    // Validation
    if (pricePerNight <= 0) {
      toast.error("Invalid price", {
        description: "Price per night must be greater than 0",
      });
      return;
    }

    if (cleaningFee < 0) {
      toast.error("Invalid cleaning fee", {
        description: "Cleaning fee cannot be negative",
      });
      return;
    }

    // Convert to 6 decimal units
    const newPricePerNight = parseUnits(pricePerNight.toString(), 6);
    const newCleaningFee = parseUnits(cleaningFee.toString(), 6);

    // Check if anything changed
    if (newPricePerNight === currentPricePerNight && newCleaningFee === currentCleaningFee) {
      setIsEditing(false);
      return;
    }

    updateRoomTypeSettings(tokenId, newPricePerNight, newCleaningFee);
  };

  const handleCancel = () => {
    setPricePerNight(parseFloat(formatUnits(currentPricePerNight, 6)));
    setCleaningFee(parseFloat(formatUnits(currentCleaningFee, 6)));
    setIsEditing(false);
  };

  const currencySymbol = currency === "EUR" ? "€" : "$";
  const currencyLabel = currency === "EUR" ? "EURC" : "USDC";

  if (!isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pricing Settings</CardTitle>
              <CardDescription>Nightly rate and fees</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-muted/50 rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="text-muted-foreground h-4 w-4" />
                <Label className="text-muted-foreground text-xs">Price per Night</Label>
              </div>
              <p className="text-2xl font-bold">
                {currencySymbol}
                {parseFloat(formatUnits(currentPricePerNight, 6)).toFixed(2)}
                <span className="text-muted-foreground ml-1 text-sm font-normal">
                  {currencyLabel}
                </span>
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="text-muted-foreground h-4 w-4" />
                <Label className="text-muted-foreground text-xs">Cleaning Fee</Label>
              </div>
              <p className="text-2xl font-bold">
                {currentCleaningFee === 0n ? (
                  <span className="text-muted-foreground text-base">No fee</span>
                ) : (
                  <>
                    {currencySymbol}
                    {parseFloat(formatUnits(currentCleaningFee, 6)).toFixed(2)}
                    <span className="text-muted-foreground ml-1 text-sm font-normal">
                      {currencyLabel}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Pricing</CardTitle>
        <CardDescription>Update nightly rate and cleaning fee (in {currencyLabel})</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price per Night */}
        <div className="space-y-2">
          <Label htmlFor="pricePerNight">
            Price per Night ({currencyLabel}) <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
              {currencySymbol}
            </span>
            <Input
              id="pricePerNight"
              type="number"
              min={0.01}
              step={0.01}
              value={pricePerNight}
              onChange={(e) => setPricePerNight(parseFloat(e.target.value) || 0)}
              disabled={isPending}
              className="pl-8"
            />
          </div>
          <p className="text-muted-foreground text-xs">
            The nightly rate guests will pay for this room type
          </p>
        </div>

        {/* Cleaning Fee */}
        <div className="space-y-2">
          <Label htmlFor="cleaningFee">Cleaning Fee ({currencyLabel})</Label>
          <div className="relative">
            <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
              {currencySymbol}
            </span>
            <Input
              id="cleaningFee"
              type="number"
              min={0}
              step={0.01}
              value={cleaningFee}
              onChange={(e) => setCleaningFee(parseFloat(e.target.value) || 0)}
              disabled={isPending}
              className="pl-8"
            />
          </div>
          <p className="text-muted-foreground text-xs">
            One-time fee charged per booking (0 = no cleaning fee)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isPending} className="flex-1">
            <Check className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={isPending}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * @deprecated Use RoomPricingEditor instead.
 * The new contract architecture doesn't support modifying maxGuests, minStayNights, or maxStayNights.
 * These values are set at room type creation and are immutable.
 */
export function RoomSettingsEditor({
  tokenId,
  currentMaxGuests,
  currentMinStayNights,
  currentMaxStayNights,
  _onUpdate: onUpdate,
}: {
  tokenId: bigint;
  currentMaxGuests: number;
  currentMinStayNights: number;
  currentMaxStayNights: number;
  _onUpdate?: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Settings (Read-Only)</CardTitle>
        <CardDescription>
          These settings were configured at room type creation and cannot be modified
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-muted/50 rounded-lg border p-4">
            <Label className="text-muted-foreground text-xs">Max Guests</Label>
            <p className="text-2xl font-bold">{currentMaxGuests}</p>
          </div>
          <div className="bg-muted/50 rounded-lg border p-4">
            <Label className="text-muted-foreground text-xs">Min Stay</Label>
            <p className="text-2xl font-bold">
              {currentMinStayNights === 0 ? "No minimum" : `${currentMinStayNights} nights`}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg border p-4">
            <Label className="text-muted-foreground text-xs">Max Stay</Label>
            <p className="text-2xl font-bold">
              {currentMaxStayNights === 0 ? "No maximum" : `${currentMaxStayNights} nights`}
            </p>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          To change these settings, you need to create a new room type with the desired
          configuration.
        </p>
      </CardContent>
    </Card>
  );
}
