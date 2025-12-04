"use client";

import * as React from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DayAvailability {
  date: Date;
  available: number;
  isBooked: boolean;
  isPartiallyBooked: boolean;
  percentage: number;
}

interface CalendarGridProps {
  calendarDays: (Date | null)[];
  maxSupply: number;
  getAvailability: (date: Date) => number;
  isDateSelected: (date: Date) => boolean;
  isWeekSelected: (week: (Date | null)[]) => boolean;
  onDateClick: (date: Date) => void;
  onWeekClick: (weekStartDate: Date) => void;
}

export function CalendarGrid({
  calendarDays,
  maxSupply,
  getAvailability,
  isDateSelected,
  isWeekSelected,
  onDateClick,
  onWeekClick,
}: CalendarGridProps) {
  // Organize calendar into weeks
  const calendarWeeks = React.useMemo(() => {
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    return weeks;
  }, [calendarDays]);

  // Get availability info for a date
  const getAvailabilityForDate = React.useCallback(
    (date: Date): DayAvailability => {
      const available = getAvailability(date);
      const percentage = (available / maxSupply) * 100;

      return {
        date,
        available,
        isBooked: available === 0,
        isPartiallyBooked: available > 0 && available < maxSupply,
        percentage,
      };
    },
    [getAvailability, maxSupply]
  );

  // Get color for day cell based on availability
  const getDayColor = (availability: DayAvailability, isSelected: boolean) => {
    if (isSelected) {
      return "bg-blue-500 text-white hover:bg-blue-600";
    }

    if (availability.isBooked) {
      return "bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-900";
    }

    if (availability.percentage === 100) {
      return "bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-900";
    }

    if (availability.percentage >= 50) {
      return "bg-yellow-100 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-900";
    }

    return "bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-100 hover:bg-orange-200 dark:hover:bg-orange-900";
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-2">
      {/* Day headers with Week column */}
      <div className="grid grid-cols-[auto,1fr] gap-2">
        <div className="w-12" /> {/* Spacer for week button column */}
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-muted-foreground flex items-center justify-center p-2 text-xs font-semibold"
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar weeks with week selection buttons */}
      {calendarWeeks.map((week, weekIndex) => {
        const firstDayOfWeek = week.find((d) => d !== null);
        const weekSelected = isWeekSelected(week);

        // Check if week has any future dates
        const hasFutureDates = week.some((d) => d !== null && d >= today);

        return (
          <div key={weekIndex} className="grid grid-cols-[auto,1fr] gap-2">
            {/* Week selection button */}
            <div className="flex items-center">
              <Button
                variant={weekSelected ? "default" : "outline"}
                size="sm"
                onClick={() => firstDayOfWeek && onWeekClick(firstDayOfWeek)}
                disabled={!hasFutureDates}
                className="h-full w-12 p-0"
                title={weekSelected ? "Deselect week" : "Select week"}
              >
                <CalendarClock className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Days in week */}
            <div className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <div key={`empty-${weekIndex}-${dayIndex}`} className="aspect-square" />;
                }

                const availability = getAvailabilityForDate(day);
                const isSelected = isDateSelected(day);
                const isPast = day < today;
                const isToday =
                  day.toISOString().split("T")[0] === today.toISOString().split("T")[0];

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => !isPast && onDateClick(day)}
                    disabled={isPast}
                    className={cn(
                      "group relative flex aspect-square flex-col items-center justify-center rounded-lg border p-2 transition-all",
                      isPast
                        ? "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-40"
                        : getDayColor(availability, isSelected),
                      isToday && !isSelected && "ring-primary ring-2 ring-offset-2"
                    )}
                  >
                    <span className="text-sm font-semibold">{day.getDate()}</span>
                    {!isPast && (
                      <span className="text-[10px] font-medium opacity-80">
                        {availability.available}/{maxSupply}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
