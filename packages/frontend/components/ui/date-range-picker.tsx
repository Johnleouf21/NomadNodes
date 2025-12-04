"use client";

import * as React from "react";
import { format, addDays, isBefore, startOfDay, differenceInDays } from "date-fns";
import { Calendar as CalendarIcon, X, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  align?: "start" | "center" | "end";
  /** Set of available dates in YYYY-MM-DD format */
  availableDates?: Set<string>;
  /** Set of unavailable dates in YYYY-MM-DD format */
  unavailableDates?: Set<string>;
  /** Whether availability data is loading */
  availabilityLoading?: boolean;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = "Select dates",
  className,
  disabled = false,
  minDate = startOfDay(new Date()),
  align = "start",
  availableDates,
  unavailableDates,
  availabilityLoading = false,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(dateRange?.from || new Date());
  const [selectionStep, setSelectionStep] = React.useState<"from" | "to">("from");

  // Reset selection step when opening
  React.useEffect(() => {
    if (open) {
      // When opening, if we have both dates, let user edit check-in first
      // If we only have from, move to check-out step
      if (!dateRange?.from) {
        setSelectionStep("from");
      } else if (!dateRange?.to) {
        setSelectionStep("to");
      } else {
        // Both dates exist - default to editing check-in
        setSelectionStep("from");
      }
    }
  }, [open]);

  // Handle date selection based on current step
  const handleDayClick = (day: Date) => {
    if (selectionStep === "from") {
      // Selecting check-in: set from date and auto-set checkout to next day
      const newRange: DateRange = {
        from: day,
        to: addDays(day, 1), // Auto-set checkout to next day
      };
      onDateRangeChange(newRange);
      setSelectionStep("to"); // Move to checkout step so user can adjust if needed
    } else {
      // Selecting check-out
      if (dateRange?.from && isBefore(day, dateRange.from)) {
        // If user clicks before check-in, treat as new check-in selection
        const newRange: DateRange = {
          from: day,
          to: addDays(day, 1),
        };
        onDateRangeChange(newRange);
        setSelectionStep("to");
      } else if (dateRange?.from) {
        // Normal check-out selection
        const newRange: DateRange = {
          from: dateRange.from,
          to: day,
        };
        onDateRangeChange(newRange);
        // Close after selecting checkout
        setTimeout(() => setOpen(false), 150);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateRangeChange(undefined);
    setSelectionStep("from");
  };

  const handleEditCheckIn = () => {
    setSelectionStep("from");
  };

  const handleEditCheckOut = () => {
    if (dateRange?.from) {
      setSelectionStep("to");
    }
  };

  const formatDateRange = () => {
    if (!dateRange?.from) {
      return placeholder;
    }
    if (!dateRange.to) {
      return `${format(dateRange.from, "MMM d")} - ?`;
    }
    return `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`;
  };

  const getNights = () => {
    if (dateRange?.from && dateRange?.to) {
      return differenceInDays(dateRange.to, dateRange.from);
    }
    return 0;
  };

  const hasValue = dateRange?.from;

  // Helper to check if a date is available
  const isDateAvailable = React.useCallback(
    (date: Date) => {
      if (!availableDates || availableDates.size === 0) return undefined;
      const dateStr = date.toISOString().split("T")[0];
      return availableDates.has(dateStr);
    },
    [availableDates]
  );

  // Helper to check if a date is unavailable
  const isDateUnavailable = React.useCallback(
    (date: Date) => {
      if (!unavailableDates || unavailableDates.size === 0) return undefined;
      const dateStr = date.toISOString().split("T")[0];
      return unavailableDates.has(dateStr);
    },
    [unavailableDates]
  );

  // Create date arrays for modifiers
  const availableDateModifier = React.useCallback(
    (date: Date) => {
      return isDateAvailable(date) === true;
    },
    [isDateAvailable]
  );

  const unavailableDateModifier = React.useCallback(
    (date: Date) => {
      return isDateUnavailable(date) === true;
    },
    [isDateUnavailable]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !hasValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{formatDateRange()}</span>
          {hasValue && dateRange?.to && (
            <span className="bg-primary/10 text-primary ml-1 rounded-full px-2 py-0.5 text-xs font-medium">
              {getNights()} {getNights() === 1 ? "night" : "nights"}
            </span>
          )}
          {hasValue && (
            <X
              className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align} sideOffset={8}>
        {/* Header showing selection step */}
        <div className="bg-muted/50 border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleEditCheckIn}
                className={cn(
                  "flex flex-col items-start rounded-lg px-3 py-2 transition-all",
                  selectionStep === "from"
                    ? "bg-primary/10 text-foreground ring-primary ring-2"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="text-xs font-medium tracking-wide uppercase">Check-in</span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    selectionStep === "from" && "text-primary"
                  )}
                >
                  {dateRange?.from ? format(dateRange.from, "MMM d, yyyy") : "Add date"}
                </span>
              </button>
              <div className="text-muted-foreground flex items-center">
                <ChevronRight className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={handleEditCheckOut}
                className={cn(
                  "flex flex-col items-start rounded-lg px-3 py-2 transition-all",
                  selectionStep === "to"
                    ? "bg-primary/10 text-foreground ring-primary ring-2"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  !dateRange?.from && "cursor-not-allowed opacity-50"
                )}
              >
                <span className="text-xs font-medium tracking-wide uppercase">Check-out</span>
                <span
                  className={cn("text-sm font-semibold", selectionStep === "to" && "text-primary")}
                >
                  {dateRange?.to ? format(dateRange.to, "MMM d, yyyy") : "Add date"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Availability loading indicator */}
        {availabilityLoading && (
          <div className="text-muted-foreground flex items-center gap-2 border-b px-4 py-2 text-xs">
            <div className="border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
            <span>Loading availability...</span>
          </div>
        )}

        {/* Availability legend */}
        {(availableDates?.size || unavailableDates?.size) && !availabilityLoading ? (
          <div className="flex items-center gap-4 border-b px-4 py-2 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <span className="text-muted-foreground">Unavailable</span>
            </div>
          </div>
        ) : null}

        {/* Calendar - using single mode with custom handling for better control */}
        <Calendar
          mode="range"
          month={month}
          onMonthChange={setMonth}
          selected={dateRange}
          onSelect={() => {}} // We handle selection manually
          onDayClick={handleDayClick}
          numberOfMonths={2}
          disabled={(date) => isBefore(date, minDate)}
          className="p-3"
          modifiers={{
            selecting:
              selectionStep === "from"
                ? []
                : dateRange?.from
                  ? [{ from: dateRange.from, to: dateRange.from }]
                  : [],
            available: availableDateModifier,
            unavailable: unavailableDateModifier,
          }}
          modifiersClassNames={{
            available:
              "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium hover:bg-green-200 dark:hover:bg-green-900/50",
            unavailable:
              "bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 line-through opacity-60",
          }}
        />

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="text-muted-foreground text-sm">
            {dateRange?.from && dateRange?.to ? (
              <span className="text-foreground font-medium">
                {getNights()} {getNights() === 1 ? "night" : "nights"} selected
              </span>
            ) : selectionStep === "from" ? (
              <span>Select check-in date</span>
            ) : (
              <span>Select check-out date</span>
            )}
          </div>
          <div className="flex gap-2">
            {hasValue && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDateRangeChange(undefined);
                  setSelectionStep("from");
                }}
              >
                Clear
              </Button>
            )}
            {dateRange?.from && dateRange?.to && (
              <Button size="sm" onClick={() => setOpen(false)}>
                Done
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
