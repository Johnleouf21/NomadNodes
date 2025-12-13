"use client";

import { Star } from "lucide-react";
import type { FilterOption, RatingDistribution } from "../types";
import { RATINGS } from "../constants";

interface RatingSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
  filterRating: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
}

/**
 * Rating summary with average and distribution
 */
export function RatingSummary({
  averageRating,
  totalReviews,
  ratingDistribution,
  filterRating,
  onFilterChange,
}: RatingSummaryProps) {
  return (
    <div className="mb-6 flex items-start gap-6">
      {/* Average Rating */}
      <div className="text-center">
        <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
        <div className="mt-1 flex items-center justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= Math.round(averageRating)
                  ? "fill-yellow-500 text-yellow-500"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
        </div>
        <div className="text-muted-foreground mt-1 text-sm">
          {totalReviews} review{totalReviews !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="flex-1 space-y-1">
        {RATINGS.map((rating) => {
          const count = ratingDistribution[rating];
          const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          return (
            <button
              key={rating}
              onClick={() =>
                onFilterChange(
                  filterRating === rating.toString() ? "all" : (rating.toString() as FilterOption)
                )
              }
              className={`hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-0.5 transition-colors ${
                filterRating === rating.toString() ? "bg-muted" : ""
              }`}
            >
              <span className="w-3 text-sm">{rating}</span>
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                <div
                  className="h-full bg-yellow-500 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-muted-foreground w-8 text-right text-xs">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
