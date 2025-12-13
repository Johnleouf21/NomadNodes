"use client";

/**
 * Individual review card component
 */

import { CheckCircle2, XCircle, Clock, User, Home, ArrowUpRight, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReviewStatus, type PendingReviewData } from "@/lib/hooks/contracts/adminReviews";
import { RatingStars } from "../../RatingStars";
import { ReviewCommentDisplay } from "../../ReviewCommentDisplay";

interface ReviewCardProps {
  review: PendingReviewData;
  isSelected: boolean;
  onToggleSelection: (id: bigint) => void;
  onApprove: (id: bigint) => void;
  onReject: (review: PendingReviewData) => void;
  onPublish: (id: bigint) => void;
  onFlagAndPublish: (review: PendingReviewData) => void;
  isApproving: boolean;
  isPublishing: boolean;
}

/**
 * Display a single review with action buttons
 */
export function ReviewCard({
  review,
  isSelected,
  onToggleSelection,
  onApprove,
  onReject,
  onPublish,
  onFlagAndPublish,
  isApproving,
  isPublishing,
}: ReviewCardProps) {
  return (
    <Card className={isSelected ? "ring-primary ring-2" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(review.reviewId)}
              className="mt-1 h-4 w-4"
            />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <RatingStars rating={review.rating} />
                <Badge variant={review.status === ReviewStatus.Pending ? "secondary" : "outline"}>
                  {review.status === ReviewStatus.Pending ? "Pending" : "Approved"}
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
            {review.status === ReviewStatus.Pending && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApprove(review.reviewId)}
                  disabled={isApproving}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onReject(review)}>
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                  onClick={() => onFlagAndPublish(review)}
                >
                  <Flag className="mr-1 h-4 w-4" />
                  Flag & Publish
                </Button>
              </>
            )}
            {review.status === ReviewStatus.Approved && (
              <>
                <Button
                  size="sm"
                  onClick={() => onPublish(review.reviewId)}
                  disabled={isPublishing}
                >
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                  Publish
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                  onClick={() => onFlagAndPublish(review)}
                >
                  <Flag className="mr-1 h-4 w-4" />
                  Flag & Publish
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
