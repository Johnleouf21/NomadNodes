"use client";

import { ArrowUpDown, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReviewTab, SortOption, FilterOption } from "../types";
import { SORT_OPTIONS } from "../constants";

interface ReviewControlsProps {
  activeTab: ReviewTab;
  onTabChange: (tab: ReviewTab) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filterRating: FilterOption;
  onFilterClear: () => void;
  showFlaggedReviews: boolean;
  onToggleFlagged: () => void;
  nonFlaggedReceivedCount: number;
  nonFlaggedGivenCount: number;
  flaggedCount: number;
}

/**
 * Review tabs and control buttons
 */
export function ReviewControls({
  activeTab,
  onTabChange,
  sortBy,
  onSortChange,
  filterRating,
  onFilterClear,
  showFlaggedReviews,
  onToggleFlagged,
  nonFlaggedReceivedCount,
  nonFlaggedGivenCount,
  flaggedCount,
}: ReviewControlsProps) {
  return (
    <div className="mb-4 flex shrink-0 flex-col gap-3">
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as ReviewTab)}>
          <TabsList>
            <TabsTrigger value="received" className="gap-1">
              Received
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {nonFlaggedReceivedCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="given" className="gap-1">
              Given
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {nonFlaggedGivenCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Sort & Filter */}
        <div className="flex items-center gap-2">
          {filterRating !== "all" && (
            <Badge variant="outline" className="cursor-pointer gap-1" onClick={onFilterClear}>
              {filterRating} stars
              <span className="ml-1">×</span>
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowUpDown className="h-3 w-3" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={sortBy === option.value ? "bg-muted" : ""}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Flagged Reviews Toggle */}
      {flaggedCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFlagged}
          className={`w-full gap-2 ${showFlaggedReviews ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400" : ""}`}
        >
          {showFlaggedReviews ? (
            <>
              <EyeOff className="h-4 w-4" />
              Hide {flaggedCount} flagged review{flaggedCount !== 1 ? "s" : ""}
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Show {flaggedCount} flagged review{flaggedCount !== 1 ? "s" : ""} (not included in
              rating)
            </>
          )}
        </Button>
      )}
    </div>
  );
}
