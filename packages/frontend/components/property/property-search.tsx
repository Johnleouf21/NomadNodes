"use client";

import { Search } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { GuestSelector } from "@/components/ui/guest-selector";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface PropertySearchProps {
  value: string;
  onChange: (value: string) => void;
  dateRange: DateRange | undefined;
  guests: number;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onGuestsChange: (guests: number) => void;
  onSearch?: () => void;
}

export function PropertySearch({
  value,
  onChange,
  dateRange,
  guests,
  onDateRangeChange,
  onGuestsChange,
  onSearch,
}: PropertySearchProps) {
  const { t } = useTranslation();

  const handleSearch = () => {
    if (onSearch) {
      onSearch();
    }
  };

  return (
    <div className="bg-card rounded-xl border p-4 shadow-lg">
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto]">
        {/* Location Search */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t("hero.search_placeholder")}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 pl-10"
          />
        </div>

        {/* Date Range Picker */}
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
          placeholder={t("hero.check_in") + " - " + t("hero.check_out")}
          className="h-11 min-w-[280px]"
          align="center"
        />

        {/* Guests */}
        <GuestSelector
          guests={guests}
          onGuestsChange={onGuestsChange}
          placeholder={t("hero.guests")}
          className="h-11 min-w-[140px]"
        />

        {/* Search Button */}
        <Button size="lg" className="h-11 md:w-auto" onClick={handleSearch}>
          <Search className="mr-2 h-4 w-4" />
          {t("common.search")}
        </Button>
      </div>
    </div>
  );
}
