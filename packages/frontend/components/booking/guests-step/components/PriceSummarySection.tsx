"use client";

/**
 * Price summary section component
 */

import * as React from "react";
import { ShoppingCart } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { PriceSummary } from "../types";

interface PriceSummarySectionProps {
  priceSummary: PriceSummary;
  totalNights: number;
}

export function PriceSummarySection({ priceSummary, totalNights }: PriceSummarySectionProps) {
  return (
    <>
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="text-muted-foreground h-5 w-5" />
          <span className="font-medium">Price Summary</span>
        </div>

        <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
          {priceSummary.rooms.map((room, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {room.name} {room.quantity > 1 && `× ${room.quantity}`}
              </span>
              <span>
                {priceSummary.currencySymbol}
                {room.pricePerNight.toFixed(2)}/night
              </span>
            </div>
          ))}

          <Separator className="my-2" />

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Per night</span>
            <span className="font-medium">
              {priceSummary.currencySymbol}
              {priceSummary.perNight.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {totalNights} night{totalNights > 1 ? "s" : ""}
            </span>
            <span className="text-lg font-semibold">
              {priceSummary.currencySymbol}
              {priceSummary.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
