"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { useCalendarAvailability } from "@/lib/hooks/property/availability";
import type { DateRange } from "react-day-picker";

interface DateSelectionStepProps {
  tokenId: bigint;
  maxSupply: number;
  minStayNights?: number;
  maxStayNights?: number;
  initialCheckIn?: Date | null;
  initialCheckOut?: Date | null;
  onNext: (checkIn: Date, checkOut: Date, totalNights: number) => void;
}

export function DateSelectionStep({
  tokenId,
  maxSupply: _maxSupply,
  minStayNights = 1,
  maxStayNights = 30,
  initialCheckIn,
  initialCheckOut,
  onNext,
}: DateSelectionStepProps) {
  // Initialize date range from search filters
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    if (initialCheckIn && initialCheckOut) {
      return { from: initialCheckIn, to: initialCheckOut };
    }
    return undefined;
  });

  // Calendar availability for the room type
  const {
    availableDates,
    unavailableDates,
    isLoading: isLoadingAvailability,
  } = useCalendarAvailability(
    [tokenId],
    new Date(),
    90, // Check 90 days ahead
    true
  );

  // Calculate total nights
  const totalNights = React.useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    return differenceInDays(dateRange.to, dateRange.from);
  }, [dateRange]);

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      // Validate that selected dates are available
      const dates: Date[] = [];
      const current = new Date(range.from);
      while (current < range.to) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      // Check if any selected dates are unavailable
      const hasUnavailableDates = dates.some((date) => {
        const dateStr = date.toISOString().split("T")[0];
        return unavailableDates.has(dateStr);
      });

      if (hasUnavailableDates) {
        toast.error("Some dates in this range are not available", {
          description: "Please select different dates",
        });
        return;
      }
    }
    setDateRange(range);
  };

  const handleNext = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    if (totalNights < minStayNights) {
      toast.error(`Minimum stay is ${minStayNights} night${minStayNights > 1 ? "s" : ""}`);
      return;
    }

    if (totalNights > maxStayNights) {
      toast.error(`Maximum stay is ${maxStayNights} nights`);
      return;
    }

    onNext(dateRange.from, dateRange.to, totalNights);
  };

  // Determine stay validation status
  const isStayTooShort = totalNights > 0 && totalNights < minStayNights;
  const isStayTooLong = totalNights > maxStayNights;
  const isStayValid = totalNights >= minStayNights && totalNights <= maxStayNights;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Select Your Dates
        </CardTitle>
        <CardDescription>Choose your check-in and check-out dates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stay requirements info */}
        <Alert
          variant="default"
          className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
        >
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Stay Requirements</AlertTitle>
          <AlertDescription className="flex flex-wrap gap-2 text-blue-700 dark:text-blue-300">
            <Badge
              variant="outline"
              className="border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300"
            >
              Min: {minStayNights} night{minStayNights > 1 ? "s" : ""}
            </Badge>
            <Badge
              variant="outline"
              className="border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300"
            >
              Max: {maxStayNights} nights
            </Badge>
          </AlertDescription>
        </Alert>

        {/* Pre-filled dates notice */}
        {(initialCheckIn || initialCheckOut) && (
          <p className="text-muted-foreground text-sm">
            Dates have been pre-filled from your search. Feel free to adjust them.
          </p>
        )}

        {/* Date Range Picker */}
        <div className="space-y-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            placeholder="Select check-in and check-out dates"
            className="w-full"
            availableDates={availableDates}
            unavailableDates={unavailableDates}
            availabilityLoading={isLoadingAvailability}
          />
        </div>

        {/* Summary */}
        {dateRange?.from && dateRange?.to && totalNights > 0 && (
          <div
            className={cn(
              "rounded-lg border p-4",
              isStayValid
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                : "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950"
            )}
          >
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Check-in:</span>
                <span className="font-medium">{format(dateRange.from, "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Check-out:</span>
                <span className="font-medium">{format(dateRange.to, "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-semibold">Total Nights:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-lg font-bold",
                      isStayValid ? "text-green-600" : "text-orange-600"
                    )}
                  >
                    {totalNights}
                  </span>
                  {isStayValid && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation warnings */}
        {isStayTooShort && (
          <Alert
            variant="default"
            className="border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
          >
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800 dark:text-orange-200">Stay Too Short</AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              Minimum stay is {minStayNights} night{minStayNights > 1 ? "s" : ""}. Please extend
              your checkout date by at least {minStayNights - totalNights} more night
              {minStayNights - totalNights > 1 ? "s" : ""}.
            </AlertDescription>
          </Alert>
        )}

        {isStayTooLong && (
          <Alert
            variant="default"
            className="border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
          >
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800 dark:text-orange-200">Stay Too Long</AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              Maximum stay is {maxStayNights} nights. Please reduce your stay by{" "}
              {totalNights - maxStayNights} night{totalNights - maxStayNights > 1 ? "s" : ""}.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            disabled={!dateRange?.from || !dateRange?.to || isLoadingAvailability || !isStayValid}
          >
            {isStayTooShort
              ? `Add ${minStayNights - totalNights} More Night${minStayNights - totalNights > 1 ? "s" : ""}`
              : isStayTooLong
                ? `Reduce Stay to ${maxStayNights} Nights`
                : "Continue to Guests"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
