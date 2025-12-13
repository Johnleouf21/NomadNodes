"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { ReviewSubmissionFormProps } from "./types";
import { calculateReviewWindow } from "./utils";
import { useEscrowLookup, useReviewForm } from "./hooks";
import { BookingInfo, ReviewWindowStatus, EscrowStatus, ReviewFormFields } from "./components";

/**
 * Review submission form component
 * Allows travelers to review hosts and hosts to review travelers
 */
export function ReviewSubmissionForm({
  booking,
  open,
  onOpenChange,
  onSuccess,
  isTravelerReview,
}: ReviewSubmissionFormProps) {
  const { foundEscrowId, isSearching, searchComplete } = useEscrowLookup(booking);
  const reviewWindowInfo = calculateReviewWindow(booking);

  const {
    rating,
    setRating,
    comment,
    setComment,
    isLoading,
    isCheckingReview,
    hasAlreadyReviewed,
    canSubmit,
    handleSubmit,
  } = useReviewForm({
    booking,
    isTravelerReview,
    foundEscrowId,
    reviewWindowInfo,
    onOpenChange,
    onSuccess,
  });

  if (!booking) return null;

  const alreadyReviewed = hasAlreadyReviewed === true;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-left">Leave a Review</SheetTitle>
          <SheetDescription className="text-left">
            Share your experience {isTravelerReview ? "with this property" : "with this traveler"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-6">
          {/* Booking Info */}
          <BookingInfo booking={booking} />

          {/* Review Window Status */}
          {reviewWindowInfo && <ReviewWindowStatus reviewWindowInfo={reviewWindowInfo} />}

          {/* Escrow Status */}
          <EscrowStatus
            foundEscrowId={foundEscrowId}
            isSearching={isSearching}
            searchComplete={searchComplete}
            isCheckingReview={isCheckingReview}
            hasAlreadyReviewed={hasAlreadyReviewed}
          />

          {/* Review Form - Hidden if already reviewed */}
          {!alreadyReviewed && (
            <ReviewFormFields
              rating={rating}
              onRatingChange={setRating}
              comment={comment}
              onCommentChange={setComment}
              isReviewWindowOpen={reviewWindowInfo?.isOpen ?? false}
              isLoading={isLoading}
              canSubmit={canSubmit}
              isUploading={false}
              isConfirming={false}
              isTravelerReview={isTravelerReview}
              onSubmit={handleSubmit}
            />
          )}

          {/* Close button when already reviewed */}
          {alreadyReviewed && (
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full"
              size="lg"
              variant="outline"
            >
              Close
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
