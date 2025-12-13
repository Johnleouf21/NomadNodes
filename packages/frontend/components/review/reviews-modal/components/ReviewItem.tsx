"use client";

import { Star, User, Flag, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Review } from "../types";
import { ReviewCommentDisplay } from "./ReviewCommentDisplay";

interface ReviewItemProps {
  review: Review;
  type: "received" | "given";
}

/**
 * Single review item display
 */
export function ReviewItem({ review, type }: ReviewItemProps) {
  const formattedDate = new Date(Number(review.createdAt) * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`rounded-lg border p-4 ${review.isFlagged ? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20" : ""}`}
    >
      {/* Flagged Warning Banner */}
      {review.isFlagged && (
        <div className="mb-3 flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            This review was flagged for inappropriate content and is not included in the rating
            average.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${review.isFlagged ? "bg-red-200 dark:bg-red-900/50" : "bg-muted"}`}
          >
            {review.isFlagged ? (
              <Flag className="h-5 w-5 text-red-600 dark:text-red-400" />
            ) : (
              <User className="text-muted-foreground h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">
                {type === "received"
                  ? `${review.reviewer.slice(0, 6)}...${review.reviewer.slice(-4)}`
                  : `${review.reviewee.slice(0, 6)}...${review.reviewee.slice(-4)}`}
              </span>
              {review.isFlagged && (
                <Badge variant="destructive" className="text-xs">
                  Flagged
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground text-xs">{formattedDate}</div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= review.rating
                  ? review.isFlagged
                    ? "fill-red-400 text-red-400"
                    : "fill-yellow-500 text-yellow-500"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Comment */}
      <ReviewCommentDisplay reviewId={BigInt(review.reviewId)} />

      {/* Footer - Votes */}
      <div className="mt-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-green-600">
          <ThumbsUp className="h-3.5 w-3.5" />
          <span>{review.helpfulVotes}</span>
        </div>
        <div className="flex items-center gap-1 text-red-600">
          <ThumbsDown className="h-3.5 w-3.5" />
          <span>{review.unhelpfulVotes}</span>
        </div>
        <span className="text-muted-foreground ml-auto text-xs">Property #{review.propertyId}</span>
      </div>
    </div>
  );
}
