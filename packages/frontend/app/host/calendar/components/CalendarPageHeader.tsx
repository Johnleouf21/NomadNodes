"use client";

import * as React from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarPageHeaderProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export function CalendarPageHeader({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
}: CalendarPageHeaderProps) {
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CalendarIcon className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Availability Calendar</h1>
          <p className="text-muted-foreground">Manage your room availability</p>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[200px] text-center">
          <p className="text-lg font-semibold">{monthName}</p>
        </div>
        <Button variant="outline" size="icon" onClick={onNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
