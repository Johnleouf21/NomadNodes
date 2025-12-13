"use client";

import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "./StarRating";
import { RATING_LABELS, MAX_COMMENT_LENGTH } from "../constants";

interface ReviewFormFieldsProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  isReviewWindowOpen: boolean;
  isLoading: boolean;
  canSubmit: boolean;
  isUploading: boolean;
  isConfirming: boolean;
  isTravelerReview: boolean;
  onSubmit: () => void;
}

/**
 * Review form fields (rating, comment, submit button)
 */
export function ReviewFormFields({
  rating,
  onRatingChange,
  comment,
  onCommentChange,
  isReviewWindowOpen,
  isLoading,
  canSubmit,
  isUploading,
  isConfirming,
  isTravelerReview,
  onSubmit,
}: ReviewFormFieldsProps) {
  const disabled = !isReviewWindowOpen || isLoading;

  return (
    <>
      {/* Rating */}
      <div className="space-y-2">
        <Label>Rating *</Label>
        <StarRating rating={rating} onRatingChange={onRatingChange} disabled={disabled} />
        {rating > 0 && (
          <p className="text-muted-foreground text-sm">{RATING_LABELS[rating] || ""}</p>
        )}
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label htmlFor="comment">Your Review (optional)</Label>
        <Textarea
          id="comment"
          placeholder={`Share your experience ${isTravelerReview ? "at this property" : "with this traveler"}...`}
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          disabled={disabled}
          rows={5}
          maxLength={MAX_COMMENT_LENGTH}
        />
        <p className="text-muted-foreground text-right text-xs">
          {comment.length}/{MAX_COMMENT_LENGTH} characters
        </p>
      </div>

      {/* Info about moderation */}
      <div className="text-muted-foreground rounded-lg border p-3 text-sm">
        <p className="font-medium">About Reviews</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>All reviews are moderated before publication</li>
          <li>Honest and constructive feedback is appreciated</li>
          <li>Reviews affect the reputation of the reviewee</li>
        </ul>
      </div>

      {/* Submit Button */}
      <Button onClick={onSubmit} disabled={!canSubmit} className="w-full" size="lg">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isUploading ? "Uploading review..." : isConfirming ? "Confirming..." : "Submitting..."}
          </>
        ) : (
          <>
            <Star className="mr-2 h-4 w-4" />
            Submit Review
          </>
        )}
      </Button>
    </>
  );
}
