"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarCheck, Info } from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CalendarHeaderProps {
  roomName: string;
  maxSupply: number;
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectMonth: () => void;
}

export function CalendarHeader({
  roomName,
  maxSupply,
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  onSelectMonth,
}: CalendarHeaderProps) {
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <CardHeader>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {roomName}
            <Badge variant="secondary">Max: {maxSupply} units</Badge>
          </CardTitle>

          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[180px] text-center">
              <p className="text-sm font-semibold">{monthName}</p>
            </div>
            <Button variant="outline" size="icon" onClick={onNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Selection Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectMonth}
            className="flex items-center gap-1.5"
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            Select Entire Month
          </Button>
          <div className="text-muted-foreground text-xs">
            Tip: Click week buttons in the calendar to select/deselect weeks
          </div>
        </div>
      </div>
    </CardHeader>
  );
}

export function CalendarLegend() {
  return (
    <div className="bg-muted/50 flex flex-wrap items-center gap-4 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Info className="text-muted-foreground h-4 w-4" />
        <span className="text-sm font-medium">Legend:</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-green-100 dark:bg-green-950" />
        <span className="text-xs">Fully Available</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-yellow-100 dark:bg-yellow-950" />
        <span className="text-xs">50%+ Available</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-orange-100 dark:bg-orange-950" />
        <span className="text-xs">Low Availability</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-red-100 dark:bg-red-950" />
        <span className="text-xs">Fully Booked</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-blue-500" />
        <span className="text-xs">Selected</span>
      </div>
    </div>
  );
}
