"use client";

import { Star, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import type { ReviewsModalProps } from "./types";
import { useReviewsFilter } from "./hooks";
import { RatingSummary, ReviewControls, ReviewItem, EmptyState } from "./components";

/**
 * Reviews modal component
 * Displays received and given reviews with filtering and sorting
 */
export function ReviewsModal({
  open,
  onOpenChange,
  reviewsReceived,
  reviewsGiven,
  averageRating: _averageRating = 0,
  totalReviews: _totalReviews = 0,
  isLoading = false,
}: ReviewsModalProps) {
  const {
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
  } = useReviewsFilter({ reviewsReceived, reviewsGiven });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            Reviews
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and manage reviews received and given
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pt-4">
          {/* Rating Summary */}
          <RatingSummary
            averageRating={averageRating}
            totalReviews={totalReviews}
            ratingDistribution={ratingDistribution}
            filterRating={filterRating}
            onFilterChange={setFilterRating}
          />

          {/* Controls */}
          <ReviewControls
            activeTab={activeTab}
            onTabChange={setActiveTab}
            sortBy={sortBy}
            onSortChange={setSortBy}
            filterRating={filterRating}
            onFilterClear={() => setFilterRating("all")}
            showFlaggedReviews={showFlaggedReviews}
            onToggleFlagged={() => setShowFlaggedReviews(!showFlaggedReviews)}
            nonFlaggedReceivedCount={nonFlaggedReceived.length}
            nonFlaggedGivenCount={nonFlaggedGiven.length}
            flaggedCount={flaggedCount}
          />

          {/* Reviews List */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "received" | "given")}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <ScrollArea className="h-[400px] pr-3">
              <TabsContent value="received" className="mt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <EmptyState
                    message={
                      filterRating !== "all"
                        ? `No ${filterRating}-star reviews`
                        : "No reviews received yet"
                    }
                  />
                ) : (
                  <div className="space-y-4 pb-6">
                    {filteredReviews.map((review) => (
                      <ReviewItem key={review.id} review={review} type="received" />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="given" className="mt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <EmptyState
                    message={
                      filterRating !== "all"
                        ? `No ${filterRating}-star reviews`
                        : "You haven't left any reviews yet"
                    }
                  />
                ) : (
                  <div className="space-y-4 pb-6">
                    {filteredReviews.map((review) => (
                      <ReviewItem key={review.id} review={review} type="given" />
                    ))}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
