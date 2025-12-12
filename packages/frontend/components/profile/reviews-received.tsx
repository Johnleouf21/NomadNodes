"use client";

import * as React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star, Loader2, ChevronRight, Eye, Flag } from "lucide-react";
import {
  useUserReviewsReceived,
  useUserReviewsSubmitted,
  useFullUserProfile,
  useHostPropertyReviews,
} from "@/lib/hooks/useUserProfile";
import { ReviewsModal } from "@/components/review/ReviewsModal";

export function ReviewsReceived() {
  const { address, hasHostSBT } = useAuth();
  const { data: personalReviews = [], isLoading: isLoadingPersonal } =
    useUserReviewsReceived(address);
  const { data: reviewsGiven = [], isLoading: isLoadingGiven } = useUserReviewsSubmitted(address);
  const { properties, isLoading: isLoadingProperties } = useFullUserProfile(address);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Get property IDs for the hook
  const propertyIds = React.useMemo(() => {
    if (!hasHostSBT || properties.length === 0) return undefined;
    return properties.map((p) => p.propertyId);
  }, [hasHostSBT, properties]);

  // Fetch property reviews with React Query (cached)
  const { data: propertyReviews = [], isLoading: isLoadingPropertyReviews } =
    useHostPropertyReviews(propertyIds);

  // Use property reviews for hosts, personal reviews for travelers
  const reviewsReceived =
    hasHostSBT && propertyReviews.length > 0 ? propertyReviews : personalReviews;
  const isLoading =
    isLoadingPersonal || isLoadingProperties || isLoadingPropertyReviews || isLoadingGiven;

  // Separate flagged and non-flagged reviews
  const { nonFlaggedReviews, flaggedReviews } = React.useMemo(() => {
    return {
      nonFlaggedReviews: reviewsReceived.filter((r) => !r.isFlagged),
      flaggedReviews: reviewsReceived.filter((r) => r.isFlagged),
    };
  }, [reviewsReceived]);

  // Calculate average rating EXCLUDING flagged reviews
  const avgRating = React.useMemo(() => {
    if (nonFlaggedReviews.length === 0) return 0;
    const sum = nonFlaggedReviews.reduce((acc, r) => acc + Number(r.rating), 0);
    return sum / nonFlaggedReviews.length;
  }, [nonFlaggedReviews]);

  // Rating distribution EXCLUDING flagged reviews
  const ratingDistribution = React.useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    nonFlaggedReviews.forEach((r) => {
      const rating = Number(r.rating);
      if (rating >= 1 && rating <= 5) {
        dist[rating as keyof typeof dist]++;
      }
    });
    return dist;
  }, [nonFlaggedReviews]);

  if (isLoading) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="text-primary h-5 w-5" />
            Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="text-primary h-5 w-5" />
              Reviews
            </CardTitle>
            <div className="flex items-center gap-2">
              {flaggedReviews.length > 0 && (
                <Badge
                  variant="outline"
                  className="gap-1 border-red-300 text-red-600 dark:border-red-800 dark:text-red-400"
                >
                  <Flag className="h-3 w-3" />
                  {flaggedReviews.length} flagged
                </Badge>
              )}
              <Badge variant="secondary">{nonFlaggedReviews.length} reviews</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pt-0">
          {nonFlaggedReviews.length > 0 ? (
            <div className="space-y-4">
              {/* Rating summary */}
              <div className="flex items-center gap-4">
                {/* Average rating */}
                <div className="text-center">
                  <div className="text-3xl font-bold">{avgRating.toFixed(1)}</div>
                  <div className="mt-1 flex items-center justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(avgRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Rating distribution bars */}
                <div className="flex flex-1 flex-col gap-1">
                  {([5, 4, 3, 2, 1] as const).map((rating) => {
                    const count = ratingDistribution[rating];
                    const percent =
                      nonFlaggedReviews.length > 0 ? (count / nonFlaggedReviews.length) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-muted-foreground w-3 text-xs">{rating}</span>
                        <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                          <div
                            className="h-full bg-yellow-400 transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground w-6 text-right text-xs">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* View all button */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setIsModalOpen(true)}
              >
                <Eye className="h-4 w-4" />
                View all reviews
                <ChevronRight className="ml-auto h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
              <p className="font-medium">No reviews yet</p>
              <p className="mt-1 text-sm">
                Complete stays to receive reviews from hosts and travelers
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews Modal */}
      <ReviewsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        reviewsReceived={reviewsReceived}
        reviewsGiven={reviewsGiven}
        averageRating={avgRating}
        totalReviews={nonFlaggedReviews.length}
        isLoading={isLoading}
      />
    </>
  );
}
