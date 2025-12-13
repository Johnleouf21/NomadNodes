"use client";

/**
 * Special requests textarea component
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SpecialRequestsProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export function SpecialRequests({ value, onChange, maxLength = 500 }: SpecialRequestsProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="special-requests">Special Requests (Optional)</Label>
      <Textarea
        id="special-requests"
        placeholder="Any special requirements or requests for your stay..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        maxLength={maxLength}
      />
      <p className="text-muted-foreground text-xs">
        {value.length}/{maxLength} characters
      </p>
    </div>
  );
}
