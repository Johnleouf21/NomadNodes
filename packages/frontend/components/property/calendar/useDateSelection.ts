/**
 * Custom hook for managing date selection logic in the calendar
 */

import * as React from "react";
import { toast } from "sonner";

export function useDateSelection(currentMonth: Date) {
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([]);

  // Get today's date (midnight)
  const getToday = React.useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  // Toggle single date selection
  const toggleDate = React.useCallback(
    (date: Date) => {
      const today = getToday();

      if (date < today) {
        toast.error("Cannot select past dates");
        return;
      }

      setSelectedDates((prev) => {
        const dateKey = date.toISOString();
        const isSelected = prev.some((d) => d.toISOString() === dateKey);

        if (isSelected) {
          return prev.filter((d) => d.toISOString() !== dateKey);
        } else {
          return [...prev, date];
        }
      });
    },
    [getToday]
  );

  // Select entire month (only future dates)
  const selectMonth = React.useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = getToday();

    const monthDates: Date[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date >= today) {
        monthDates.push(date);
      }
    }

    setSelectedDates(monthDates);
    toast.info(`Selected ${monthDates.length} days`, {
      description: "All future days in this month",
    });
  }, [currentMonth, getToday]);

  // Select or deselect a week (cumulative)
  const toggleWeek = React.useCallback(
    (weekStartDate: Date) => {
      const today = getToday();

      const weekDates: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStartDate);
        date.setDate(date.getDate() + i);

        // Only add if in current month and not in the past
        if (
          date.getMonth() === currentMonth.getMonth() &&
          date.getFullYear() === currentMonth.getFullYear() &&
          date >= today
        ) {
          weekDates.push(date);
        }
      }

      // Check if week is already selected
      const weekDatesKeys = weekDates.map((d) => d.toISOString());
      const alreadySelected = weekDatesKeys.every((key) =>
        selectedDates.some((d) => d.toISOString() === key)
      );

      if (alreadySelected) {
        // Deselect week
        setSelectedDates((prev) => prev.filter((d) => !weekDatesKeys.includes(d.toISOString())));
        toast.info("Week deselected");
      } else {
        // Add week to selection (cumulative)
        setSelectedDates((prev) => {
          const existingKeys = new Set(prev.map((d) => d.toISOString()));
          const newDates = weekDates.filter((d) => !existingKeys.has(d.toISOString()));
          return [...prev, ...newDates];
        });
        toast.info(`Added ${weekDates.length} days`, {
          description: "Week selected",
        });
      }
    },
    [currentMonth, selectedDates, getToday]
  );

  // Check if a week is selected
  const isWeekSelected = React.useCallback(
    (week: (Date | null)[]) => {
      const today = getToday();

      const weekDates = week.filter((d): d is Date => d !== null && d >= today);
      if (weekDates.length === 0) return false;

      return weekDates.every((date) =>
        selectedDates.some(
          (d) => d.toISOString().split("T")[0] === date.toISOString().split("T")[0]
        )
      );
    },
    [selectedDates, getToday]
  );

  // Check if a date is selected
  const isDateSelected = React.useCallback(
    (date: Date) => {
      return selectedDates.some(
        (d) => d.toISOString().split("T")[0] === date.toISOString().split("T")[0]
      );
    },
    [selectedDates]
  );

  // Clear all selections
  const clearSelection = React.useCallback(() => {
    setSelectedDates([]);
  }, []);

  return {
    selectedDates,
    setSelectedDates,
    toggleDate,
    selectMonth,
    toggleWeek,
    isWeekSelected,
    isDateSelected,
    clearSelection,
  };
}
