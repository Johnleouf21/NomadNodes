"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useSetBulkAvailability, getStartOfDayTimestamp } from "@/lib/hooks/usePropertyNFT";
import { toast } from "sonner";

// Extracted components and hooks
import { CalendarHeader, CalendarLegend } from "./calendar/CalendarHeader";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { AvailabilityControlPanel } from "./calendar/AvailabilityControlPanel";
import { useCalendarAvailability } from "./calendar/useCalendarAvailability";
import { useDateSelection } from "./calendar/useDateSelection";

interface ProfessionalAvailabilityCalendarProps {
  tokenId: bigint;
  roomName: string;
  maxSupply: number;
  currentMonth: Date;
  onMonthChange?: (date: Date) => void;
}

export function ProfessionalAvailabilityCalendar({
  tokenId,
  roomName,
  maxSupply,
  currentMonth,
  onMonthChange,
}: ProfessionalAvailabilityCalendarProps) {
  const [availabilityInput, setAvailabilityInput] = React.useState<number>(maxSupply);
  const [pendingUpdate, setPendingUpdate] = React.useState<{
    dates: Date[];
    availability: number;
  } | null>(null);

  // Custom hooks
  const { availabilityData, isLoading, getAvailability, setAvailabilityData } =
    useCalendarAvailability(tokenId, currentMonth, maxSupply);

  const {
    selectedDates,
    setSelectedDates,
    toggleDate,
    selectMonth,
    toggleWeek,
    isWeekSelected,
    isDateSelected,
    clearSelection,
  } = useDateSelection(currentMonth);

  const { setBulkAvailability, isPending, isSuccess, error: txError } = useSetBulkAvailability();

  // Handle successful transaction
  React.useEffect(() => {
    if (isSuccess && pendingUpdate) {
      toast.success("Availability updated successfully", {
        description: `Updated ${pendingUpdate.dates.length} day(s) to ${pendingUpdate.availability} units`,
      });

      // Update local state after blockchain confirmation
      const newData = new Map(availabilityData);
      pendingUpdate.dates.forEach((date) => {
        const dateKey = date.toISOString().split("T")[0];
        if (pendingUpdate.availability !== maxSupply && pendingUpdate.availability !== 0) {
          newData.set(dateKey, pendingUpdate.availability);
        } else if (pendingUpdate.availability === 0) {
          newData.set(dateKey, 0);
        } else {
          newData.delete(dateKey); // Remove if back to default
        }
      });
      setAvailabilityData(newData);

      // Clear selection and pending state
      setSelectedDates([]);
      setPendingUpdate(null);
    }
  }, [
    isSuccess,
    pendingUpdate,
    availabilityData,
    maxSupply,
    setAvailabilityData,
    setSelectedDates,
  ]);

  // Handle transaction error
  React.useEffect(() => {
    if (txError) {
      toast.error("Transaction failed", {
        description: txError.message || "Failed to update availability",
      });
      setPendingUpdate(null);
    }
  }, [txError]);

  // Generate calendar days for current month
  const calendarDays = React.useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get starting day of week (0 = Sunday)
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  // Apply availability to selected dates
  const handleApplyAvailability = () => {
    if (selectedDates.length === 0) {
      toast.error("No dates selected", {
        description: "Please select at least one date",
      });
      return;
    }

    if (availabilityInput < 0 || availabilityInput > maxSupply) {
      toast.error("Invalid availability", {
        description: `Availability must be between 0 and ${maxSupply}`,
      });
      return;
    }

    // Sort dates to get start and end
    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];

    // Calculate days span
    const daysDiff =
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Warn if too many days (gas limit concern)
    if (daysDiff > 90) {
      toast.error("Too many days selected", {
        description: "Please select 90 days or less to avoid gas limit issues",
      });
      return;
    }

    if (daysDiff > 30) {
      toast.warning("Large date range", {
        description: `Updating ${daysDiff} days may require higher gas fees`,
      });
    }

    // Store pending update info
    setPendingUpdate({
      dates: [...selectedDates],
      availability: availabilityInput,
    });

    // Show info toast
    toast.info("Transaction submitted", {
      description: `Setting ${availabilityInput} unit(s) available for ${daysDiff} day(s). Please confirm in your wallet...`,
    });

    // Call smart contract with setBulkAvailability
    // This sets units 0 to availabilityInput-1 as available, and rest as unavailable
    setBulkAvailability(tokenId, availabilityInput, startDate, endDate);
  };

  // Navigate months
  const handlePreviousMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    onMonthChange?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    onMonthChange?.(newDate);
  };

  return (
    <Card className="w-full">
      <CalendarHeader
        roomName={roomName}
        maxSupply={maxSupply}
        currentMonth={currentMonth}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onSelectMonth={selectMonth}
      />

      <CardContent className="space-y-6">
        <CalendarLegend />

        <CalendarGrid
          calendarDays={calendarDays}
          maxSupply={maxSupply}
          getAvailability={getAvailability}
          isDateSelected={isDateSelected}
          isWeekSelected={isWeekSelected}
          onDateClick={toggleDate}
          onWeekClick={toggleWeek}
        />

        <AvailabilityControlPanel
          selectedDatesCount={selectedDates.length}
          availabilityInput={availabilityInput}
          maxSupply={maxSupply}
          isPending={isPending}
          onAvailabilityChange={setAvailabilityInput}
          onApply={handleApplyAvailability}
          onClear={clearSelection}
        />
      </CardContent>
    </Card>
  );
}
