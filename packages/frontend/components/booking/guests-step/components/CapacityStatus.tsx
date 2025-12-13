"use client";

/**
 * Capacity status component
 */

import * as React from "react";
import { Users, Check, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface CapacityStatusProps {
  totalGuests: number;
  totalCapacity: number;
  isOverCapacity: boolean;
  additionalGuestsNeeded: number;
}

export function CapacityStatus({
  totalGuests,
  totalCapacity,
  isOverCapacity,
  additionalGuestsNeeded,
}: CapacityStatusProps) {
  return (
    <>
      <div
        className={cn(
          "rounded-lg border p-4",
          isOverCapacity
            ? "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
            : totalGuests === totalCapacity
              ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950"
              : "bg-muted/50"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users
              className={cn(
                "h-5 w-5",
                isOverCapacity ? "text-orange-600" : "text-muted-foreground"
              )}
            />
            <span className="font-medium">Total Guests</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-lg font-bold", isOverCapacity ? "text-orange-600" : "")}>
              {totalGuests}
            </span>
            <span className="text-muted-foreground">/ {totalCapacity}</span>
          </div>
        </div>

        {!isOverCapacity && totalGuests === totalCapacity && (
          <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Perfect! Rooms at full capacity.
          </div>
        )}

        {isOverCapacity && (
          <p className="mt-2 text-sm text-orange-600">
            Need {additionalGuestsNeeded} more spot{additionalGuestsNeeded > 1 ? "s" : ""} - add
            another room below
          </p>
        )}
      </div>

      {isOverCapacity && (
        <Alert
          variant="default"
          className="border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
        >
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">Add More Rooms</AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            Your group of <strong>{totalGuests}</strong> needs more space. Add rooms below to
            accommodate everyone.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
