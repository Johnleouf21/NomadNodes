"use client";

import { Clock, Flag, Home, Loader2, Star, ThumbsDown, ThumbsUp, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "./RatingStars";
import type { PonderReview } from "@/lib/hooks/contracts/useAdminPlatform";

interface PublishedReviewsListProps {
  reviews: PonderReview[];
  isLoading: boolean;
}

export function PublishedReviewsList({ reviews, isLoading }: PublishedReviewsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center">
          <Star className="text-muted-foreground mb-4 h-16 w-16" />
          <p className="text-xl font-semibold">No Published Reviews</p>
          <p className="text-muted-foreground">Published reviews will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className={review.isFlagged ? "border-red-500" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <RatingStars rating={review.rating} />
                  <Badge variant="default">Published</Badge>
                  {review.isFlagged && (
                    <Badge variant="destructive">
                      <Flag className="mr-1 h-3 w-3" />
                      Flagged
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground grid gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      Reviewer: {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      Reviewee: {review.reviewee.slice(0, 6)}...{review.reviewee.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>Property #{review.propertyId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(Number(review.createdAt) * 1000).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{review.helpfulVotes}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <ThumbsDown className="h-4 w-4" />
                    <span>{review.unhelpfulVotes}</span>
                  </div>
                </div>
                <span className="text-muted-foreground text-xs">Review #{review.reviewId}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
