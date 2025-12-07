"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import { Search, ArrowUpDown, X, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type BookingStatusFilter =
  | "all"
  | "Pending"
  | "Confirmed"
  | "CheckedIn"
  | "Completed"
  | "Cancelled";
export type SortOption = "date-asc" | "date-desc" | "amount-asc" | "amount-desc" | "status";

interface BookingFiltersToolbarProps {
  statusFilter: BookingStatusFilter;
  onStatusFilterChange: (status: BookingStatusFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  propertyFilter: string;
  onPropertyFilterChange: (propertyId: string) => void;
  properties: { id: string; name: string }[];
  bookingCounts: {
    all: number;
    Pending: number;
    Confirmed: number;
    CheckedIn: number;
    Completed: number;
    Cancelled: number;
  };
}

const statusLabels: Record<BookingStatusFilter, string> = {
  all: "All",
  Pending: "Pending",
  Confirmed: "Confirmed",
  CheckedIn: "Checked In",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const statusColors: Record<BookingStatusFilter, string> = {
  all: "bg-muted text-muted-foreground",
  Pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  Confirmed: "bg-[#0F4C5C]/10 text-[#0F4C5C] dark:text-[#1A7A8A]",
  CheckedIn: "bg-[#E36414]/10 text-[#E36414]",
  Completed: "bg-[#81B29A]/10 text-[#81B29A]",
  Cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const sortLabels: Record<SortOption, string> = {
  "date-desc": "Newest first",
  "date-asc": "Oldest first",
  "amount-desc": "Highest amount",
  "amount-asc": "Lowest amount",
  status: "By status",
};

export function BookingFiltersToolbar({
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  propertyFilter,
  onPropertyFilterChange,
  properties,
  bookingCounts,
}: BookingFiltersToolbarProps) {
  const hasActiveFilters = statusFilter !== "all" || searchQuery || propertyFilter !== "all";

  const clearFilters = () => {
    onStatusFilterChange("all");
    onSearchChange("");
    onPropertyFilterChange("all");
  };

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => onStatusFilterChange(v as BookingStatusFilter)}
      >
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {(Object.keys(statusLabels) as BookingStatusFilter[]).map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              className={`data-[state=active]:${statusColors[status]} rounded-full px-3 py-1.5 text-sm transition-colors data-[state=active]:shadow-sm`}
            >
              {statusLabels[status]}
              <Badge
                variant="secondary"
                className="ml-2 h-5 min-w-[20px] rounded-full px-1.5 text-xs"
              >
                {bookingCounts[status]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search and Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative max-w-md min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by guest address or booking ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-9 pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 p-0"
              onClick={() => onSearchChange("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Property Filter */}
        <Select value={propertyFilter} onValueChange={onPropertyFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All properties</SelectItem>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              {sortLabels[sortBy]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(sortLabels) as SortOption[]).map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => onSortChange(option)}
                className={sortBy === option ? "bg-accent" : ""}
              >
                {sortLabels[option]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Active filters:</span>
          {statusFilter !== "all" && (
            <Badge variant="secondary" className={statusColors[statusFilter]}>
              {statusLabels[statusFilter]}
              <button
                className="hover:bg-foreground/10 ml-1 rounded-full p-0.5"
                onClick={() => onStatusFilterChange("all")}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary">
              Search: "{searchQuery}"
              <button
                className="hover:bg-foreground/10 ml-1 rounded-full p-0.5"
                onClick={() => onSearchChange("")}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {propertyFilter !== "all" && (
            <Badge variant="secondary">
              Property: {properties.find((p) => p.id === propertyFilter)?.name || propertyFilter}
              <button
                className="hover:bg-foreground/10 ml-1 rounded-full p-0.5"
                onClick={() => onPropertyFilterChange("all")}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
