"use client";

import { Star, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import type { PonderReview } from "@/hooks/usePonderReviews";

interface ExistingReviewProps {
  existingReview: PonderReview;
  reviewComment: string | null;
  isLoading: boolean;
}

/**
 * Display existing user review
 */
export function ExistingReview({ existingReview, reviewComment, isLoading }: ExistingReviewProps) {
  return (
    <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
        <div className="flex-1">
          <p className="font-medium text-green-700 dark:text-green-400">Your Review</p>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= existingReview.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="text-muted-foreground ml-2 text-sm">
              Submitted {new Date(Number(existingReview.createdAt) * 1000).toLocaleDateString()}
            </span>
          </div>

          {/* Review comment */}
          {isLoading ? (
            <div className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading comment...</span>
            </div>
          ) : reviewComment ? (
            <div className="mt-3">
              <div className="flex items-start gap-2">
                <MessageCircle className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
                <p className="text-muted-foreground text-sm italic">&quot;{reviewComment}&quot;</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
