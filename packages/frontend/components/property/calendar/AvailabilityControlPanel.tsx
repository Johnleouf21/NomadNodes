"use client";

import * as React from "react";
import { Plus, Minus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AvailabilityControlPanelProps {
  selectedDatesCount: number;
  availabilityInput: number;
  maxSupply: number;
  isPending: boolean;
  onAvailabilityChange: (value: number) => void;
  onApply: () => void;
  onClear: () => void;
}

export function AvailabilityControlPanel({
  selectedDatesCount,
  availabilityInput,
  maxSupply,
  isPending,
  onAvailabilityChange,
  onApply,
  onClear,
}: AvailabilityControlPanelProps) {
  if (selectedDatesCount === 0) {
    return (
      <div className="bg-muted/50 rounded-lg border p-4 text-center">
        <p className="text-muted-foreground text-sm">
          Click on dates to select them, then set availability
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border-2 border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{selectedDatesCount} day(s) selected</p>
          <p className="text-muted-foreground text-xs">Set availability for selected dates</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="availability-input" className="text-xs">
            Units Available (0-{maxSupply})
          </Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onAvailabilityChange(Math.max(0, availabilityInput - 1))}
              disabled={availabilityInput <= 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="availability-input"
              type="number"
              min={0}
              max={maxSupply}
              value={availabilityInput}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                onAvailabilityChange(Math.min(maxSupply, Math.max(0, value)));
              }}
              className="text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => onAvailabilityChange(Math.min(maxSupply, availabilityInput + 1))}
              disabled={availabilityInput >= maxSupply}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onAvailabilityChange(maxSupply)}
          >
            Set Full
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onAvailabilityChange(0)}
          >
            Set Blocked
          </Button>
        </div>

        <Button className="w-full" onClick={onApply} disabled={isPending}>
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Processing Transaction..." : "Apply to Selected Dates"}
        </Button>

        {isPending && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              ⏳ Transaction in progress... Please wait for blockchain confirmation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
