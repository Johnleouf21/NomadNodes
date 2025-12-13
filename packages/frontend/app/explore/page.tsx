"use client";

import * as React from "react";
import { PropertyListPonder } from "@/components/property/property-list-ponder";
import {
  PropertyFilters,
  DEFAULT_FILTERS,
  type PropertyFiltersState,
} from "@/components/property/property-filters";
import { PropertySearch } from "@/components/property/property-search";
import { useState, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { useSearchStore } from "@/lib/store";

export default function ExplorePage() {
  const { filters: searchStoreFilters, setFilters: setSearchStoreFilters } = useSearchStore();

  const [filters, setFilters] = useState<PropertyFiltersState>(DEFAULT_FILTERS);

  // Convert store dates to DateRange
  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (searchStoreFilters.checkIn || searchStoreFilters.checkOut) {
      return {
        from: searchStoreFilters.checkIn || undefined,
        to: searchStoreFilters.checkOut || undefined,
      };
    }
    return undefined;
  }, [searchStoreFilters.checkIn, searchStoreFilters.checkOut]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setSearchStoreFilters({
      checkIn: range?.from || null,
      checkOut: range?.to || null,
    });
  };

  const handleGuestsChange = (guests: number) => {
    setSearchStoreFilters({ guests });
  };

  const handleLocationChange = (location: string) => {
    setSearchStoreFilters({ location });
  };

  // Convert DateRange and guests to search filters for blockchain
  const searchFilters = useMemo(() => {
    const hasFilters = dateRange?.from && dateRange?.to && searchStoreFilters.guests > 0;

    if (!hasFilters) return undefined;

    return {
      checkIn: dateRange?.from,
      checkOut: dateRange?.to,
      guests: searchStoreFilters.guests,
    };
  }, [dateRange, searchStoreFilters.guests]);

  const handleSearch = () => {
    // Trigger search - the searchFilters will automatically update the blockchain query
  };

  return (
    <div className="min-h-screen">
      {/* Hero Search Section */}
      <div className="from-primary/10 to-background bg-gradient-to-b py-12">
        <div className="container px-4">
          <div className="mx-auto max-w-5xl space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Explore Properties</h1>
            <p className="text-muted-foreground text-lg">
              Discover unique stays powered by blockchain
            </p>
            <PropertySearch
              value={searchStoreFilters.location}
              onChange={handleLocationChange}
              dateRange={dateRange}
              guests={searchStoreFilters.guests}
              onDateRangeChange={handleDateRangeChange}
              onGuestsChange={handleGuestsChange}
              onSearch={handleSearch}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Filters Sidebar */}
          <aside className="space-y-6">
            <PropertyFilters filters={filters} onFiltersChange={setFilters} />
          </aside>

          {/* Property List */}
          <main>
            <PropertyListPonder
              searchQuery={searchStoreFilters.location}
              filters={filters}
              searchFilters={searchFilters}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
