"use client";

import * as React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Star,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  User,
} from "lucide-react";
import { useUserReviewsReceived, formatRelativeTime } from "@/lib/hooks/useUserProfile";
import Link from "next/link";

export function ReviewsReceived() {
  const { address } = useAuth();
  const { data: reviews = [], isLoading } = useUserReviewsReceived(address);
  const [showAll, setShowAll] = React.useState(false);

  // Calculate average rating
  const avgRating = React.useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
    return sum / reviews.length;
  }, [reviews]);

  // Rating distribution
  const ratingDistribution = React.useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rating = Number(r.rating);
      if (rating >= 1 && rating <= 5) {
        dist[rating as keyof typeof dist]++;
      }
    });
    return dist;
  }, [reviews]);

  // Show only first 4 unless expanded
  const displayedReviews = showAll ? reviews : reviews.slice(0, 4);
  const hasMore = reviews.length > 4;

  // Truncate address for display
  const truncateAddress = (addr: string) => {
    if (!addr) return "Anonymous";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="text-primary h-5 w-5" />
            Reviews Received
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="text-primary h-5 w-5" />
            Reviews Received
          </CardTitle>
          <Badge variant="secondary">{reviews.length} reviews</Badge>
        </div>

        {/* Rating summary */}
        {reviews.length > 0 && (
          <div className="mt-3 flex items-center gap-4">
            {/* Average rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
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
              <span className="text-lg font-bold">{avgRating.toFixed(1)}</span>
            </div>

            {/* Rating distribution mini bars */}
            <div className="flex flex-1 items-center gap-1">
              {([5, 4, 3, 2, 1] as const).map((rating) => {
                const count = ratingDistribution[rating];
                const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={rating} className="flex flex-1 flex-col items-center gap-0.5">
                    <div className="bg-muted h-8 w-full overflow-hidden rounded-sm">
                      <div
                        className="w-full bg-yellow-400 transition-all"
                        style={{ height: `${percent}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground text-[9px]">{rating}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <ScrollArea className={showAll ? "h-[350px]" : undefined}>
          <div className="grid gap-2">
            {displayedReviews.length > 0 ? (
              displayedReviews.map((review) => (
                <div
                  key={review.id}
                  className="hover:bg-muted/50 rounded-lg border p-3 transition-colors"
                >
                  {/* Header: Stars + Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= Number(review.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-muted-foreground text-[10px]">
                      {formatRelativeTime(new Date(Number(review.createdAt) * 1000))}
                    </span>
                  </div>

                  {/* Reviewer info */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="bg-muted flex h-6 w-6 items-center justify-center rounded-full">
                      <User className="text-muted-foreground h-3 w-3" />
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {truncateAddress(review.reviewer)}
                    </span>
                  </div>

                  {/* Property link */}
                  {review.propertyId && (
                    <Link
                      href={`/property/${review.propertyId}`}
                      className="text-primary mt-2 inline-flex items-center gap-1 text-[10px] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Property
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="font-medium">No reviews yet</p>
                <p className="mt-1 text-sm">
                  Complete stays to receive reviews from hosts and travelers
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Show more/less button */}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <ChevronUp className="mr-1 h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-4 w-4" />
                Show {reviews.length - 4} more
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
