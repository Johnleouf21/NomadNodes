/**
 * Hook for filtering and sorting reviews
 */

import * as React from "react";
import type { Review, SortOption, FilterOption, ReviewTab, RatingDistribution } from "../types";

interface UseReviewsFilterParams {
  reviewsReceived: Review[];
  reviewsGiven: Review[];
}

interface UseReviewsFilterResult {
  activeTab: ReviewTab;
  setActiveTab: (tab: ReviewTab) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  filterRating: FilterOption;
  setFilterRating: (filter: FilterOption) => void;
  showFlaggedReviews: boolean;
  setShowFlaggedReviews: (show: boolean) => void;
  filteredReviews: Review[];
  nonFlaggedReceived: Review[];
  nonFlaggedGiven: Review[];
  flaggedCount: number;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
}

export function useReviewsFilter({
  reviewsReceived,
  reviewsGiven,
}: UseReviewsFilterParams): UseReviewsFilterResult {
  const [activeTab, setActiveTab] = React.useState<ReviewTab>("received");
  const [sortBy, setSortBy] = React.useState<SortOption>("newest");
  const [filterRating, setFilterRating] = React.useState<FilterOption>("all");
  const [showFlaggedReviews, setShowFlaggedReviews] = React.useState(false);

  // Separate flagged and non-flagged reviews
  const { nonFlaggedReceived, flaggedReceived, nonFlaggedGiven, flaggedGiven } =
    React.useMemo(() => {
      return {
        nonFlaggedReceived: reviewsReceived.filter((r) => !r.isFlagged),
        flaggedReceived: reviewsReceived.filter((r) => r.isFlagged),
        nonFlaggedGiven: reviewsGiven.filter((r) => !r.isFlagged),
        flaggedGiven: reviewsGiven.filter((r) => r.isFlagged),
      };
    }, [reviewsReceived, reviewsGiven]);

  // Calculate average rating EXCLUDING flagged reviews
  const averageRating = React.useMemo(() => {
    if (nonFlaggedReceived.length === 0) return 0;
    const sum = nonFlaggedReceived.reduce((acc, r) => acc + r.rating, 0);
    return sum / nonFlaggedReceived.length;
  }, [nonFlaggedReceived]);

  // Total reviews count EXCLUDING flagged
  const totalReviews = nonFlaggedReceived.length;

  // Get current reviews based on tab (excluding flagged by default)
  const currentReviews =
    activeTab === "received"
      ? showFlaggedReviews
        ? reviewsReceived
        : nonFlaggedReceived
      : showFlaggedReviews
        ? reviewsGiven
        : nonFlaggedGiven;

  const flaggedCount = activeTab === "received" ? flaggedReceived.length : flaggedGiven.length;

  // Filter and sort reviews
  const filteredReviews = React.useMemo(() => {
    let reviews = [...currentReviews];

    // Apply rating filter
    if (filterRating !== "all") {
      reviews = reviews.filter((r) => r.rating === parseInt(filterRating));
    }

    // Apply sorting
    reviews.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return Number(b.createdAt) - Number(a.createdAt);
        case "oldest":
          return Number(a.createdAt) - Number(b.createdAt);
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return reviews;
  }, [currentReviews, sortBy, filterRating]);

  // Calculate rating distribution EXCLUDING flagged reviews
  const ratingDistribution = React.useMemo(() => {
    const dist: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    nonFlaggedReceived.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating as keyof RatingDistribution]++;
      }
    });
    return dist;
  }, [nonFlaggedReceived]);

  return {
    activeTab,
    setActiveTab,
    sortBy,
    setSortBy,
    filterRating,
    setFilterRating,
    showFlaggedReviews,
    setShowFlaggedReviews,
    filteredReviews,
    nonFlaggedReceived,
    nonFlaggedGiven,
    flaggedCount,
    averageRating,
    totalReviews,
    ratingDistribution,
  };
}
