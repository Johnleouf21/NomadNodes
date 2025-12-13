"use client";

import * as React from "react";
import { CheckCircle2, Clock, Home, Loader2, User, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePublishReview, useBatchPublish } from "@/lib/hooks/contracts/adminReviews";
import { RatingStars } from "./RatingStars";
import { ReviewCommentDisplay } from "./ReviewCommentDisplay";
import type { ApprovedReviewsListProps } from "../types";

export function ApprovedReviewsList({ reviews, isLoading, onRefresh }: ApprovedReviewsListProps) {
  const [selectedReviews, setSelectedReviews] = React.useState<Set<bigint>>(new Set());

  const {
    publishReview,
    isPending: isPublishing,
    isSuccess: publishSuccess,
    reset: resetPublish,
  } = usePublishReview();
  const {
    batchPublish,
    isPending: isBatchPublishing,
    isSuccess: batchPublishSuccess,
    reset: resetBatchPublish,
  } = useBatchPublish();

  React.useEffect(() => {
    if (publishSuccess) {
      toast.success("Review published");
      resetPublish();
      onRefresh();
    }
  }, [publishSuccess, resetPublish, onRefresh]);

  React.useEffect(() => {
    if (batchPublishSuccess) {
      toast.success("Reviews published");
      setSelectedReviews(new Set());
      resetBatchPublish();
      onRefresh();
    }
  }, [batchPublishSuccess, resetBatchPublish, onRefresh]);

  const toggleSelection = (id: bigint) => {
    const s = new Set(selectedReviews);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedReviews(s);
  };

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
          <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
          <p className="text-xl font-semibold">No Approved Reviews</p>
          <p className="text-muted-foreground">
            Approved reviews ready for publishing will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {selectedReviews.size > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <span className="text-sm">{selectedReviews.size} selected</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => batchPublish(Array.from(selectedReviews))}
                disabled={isBatchPublishing}
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Publish All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            Ready to Publish
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card
            key={review.reviewId.toString()}
            className={`border-green-300 ${selectedReviews.has(review.reviewId) ? "ring-primary ring-2" : ""}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedReviews.has(review.reviewId)}
                    onChange={() => toggleSelection(review.reviewId)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <RatingStars rating={review.rating} />
                      <Badge variant="default" className="bg-green-500">
                        Approved
                      </Badge>
                      <Badge variant="outline">
                        {review.travelerToHost ? "Traveler → Host" : "Host → Traveler"}
                      </Badge>
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
                        <span>Property #{review.propertyId.toString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(Number(review.submittedAt) * 1000).toLocaleString()}</span>
                      </div>
                    </div>
                    <ReviewCommentDisplay ipfsHash={review.ipfsCommentHash} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => publishReview(review.reviewId)}
                    disabled={isPublishing}
                  >
                    <ArrowUpRight className="mr-1 h-4 w-4" />
                    Publish
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
