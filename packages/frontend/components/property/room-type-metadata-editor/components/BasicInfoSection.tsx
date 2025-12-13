"use client";

import { ChevronDown, ChevronUp, Users, Moon, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { RoomTypeData } from "@/lib/hooks/property/types";
import type { FormErrors } from "../types";

interface BasicInfoSectionProps {
  expanded: boolean;
  onToggle: () => void;
  metadata: Partial<RoomTypeData>;
  onMetadataChange: (updates: Partial<RoomTypeData>) => void;
  errors: FormErrors;
  isLoading: boolean;
}

/**
 * Basic information section (name, description, price, capacity)
 */
export function BasicInfoSection({
  expanded,
  onToggle,
  metadata,
  onMetadataChange,
  errors,
  isLoading,
}: BasicInfoSectionProps) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-3 text-sm font-medium">
          Basic Information
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
            onChange={(e) => onMetadataChange({ name: e.target.value })}
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
            onChange={(e) => onMetadataChange({ description: e.target.value })}
            placeholder="Describe the room..."
            rows={3}
            disabled={isLoading}
            className={errors.description ? "border-destructive" : ""}
          />
          {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
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
              onChange={(e) => onMetadataChange({ pricePerNight: parseFloat(e.target.value) || 0 })}
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
              onChange={(e) => onMetadataChange({ currency: e.target.value as "USD" | "EUR" })}
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
              onChange={(e) => onMetadataChange({ maxGuests: parseInt(e.target.value) || 2 })}
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
              onChange={(e) => onMetadataChange({ minStayNights: parseInt(e.target.value) || 1 })}
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
              onChange={(e) => onMetadataChange({ maxStayNights: parseInt(e.target.value) || 30 })}
              disabled={isLoading}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
