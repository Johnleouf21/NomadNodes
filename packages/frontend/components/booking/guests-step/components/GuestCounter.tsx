"use client";

/**
 * Guest counter component for adults/children
 */

import * as React from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface GuestCounterProps {
  label: string;
  description: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}

export function GuestCounter({ label, description, value, min, onChange }: GuestCounterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">{label}</Label>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-semibold">{value}</span>
          <Button variant="outline" size="icon" onClick={() => onChange(value + 1)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
