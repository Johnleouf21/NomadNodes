"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PROPERTY_TYPES } from "../constants";
import type { SectionProps } from "../types";
import type { PropertyMetadata } from "@/lib/hooks/property/types";

/**
 * Basic information section (name, description, property type)
 */
export function BasicInfoSection({
  metadata,
  setMetadata,
  errors,
  isLoading,
  isExpanded,
  onToggle,
}: SectionProps) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 font-semibold">
          <span>Basic Information</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
          {errors.description && <p className="text-destructive text-sm">{errors.description}</p>}
          <p className="text-muted-foreground text-xs">
            {metadata.description.length}/500 characters
          </p>
        </div>

        {/* Property Type */}
        <div className="space-y-3">
          <Label>Property Type</Label>
          <RadioGroup
            value={metadata.propertyType}
            onValueChange={(value) =>
              setMetadata({ ...metadata, propertyType: value as PropertyMetadata["propertyType"] })
            }
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
  );
}
