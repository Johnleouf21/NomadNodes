"use client";

import * as React from "react";
import { Star, Loader2, CheckCircle2, AlertCircle, Clock, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAccount, useReadContracts } from "wagmi";
import { useSubmitReview } from "@/lib/hooks/contracts/useReviewSystem";
import { uploadReviewToIPFS } from "@/lib/utils/ipfs";
import { CONTRACTS } from "@/lib/contracts";
import { useInvalidateQueries } from "@/hooks/useInvalidateQueries";
import type { Address } from "viem";

// Review window: 14 days after checkout
const REVIEW_WINDOW_DAYS = 14;
const REVIEW_WINDOW_MS = REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export interface ReviewableBooking {
  id: string;
  propertyId: string;
  propertyName: string;
  roomName: string;
  tokenId: string;
  bookingIndex: string;
  checkOut: Date;
  location: string;
  image?: string;
  escrowAddress: string;
  hostAddress: Address;
  travelerAddress: Address;
}

interface ReviewSubmissionFormProps {
  booking: ReviewableBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** true = traveler reviewing host, false = host reviewing traveler */
  isTravelerReview: boolean;
}

// Star rating component
function StarRating({
  rating,
  onRatingChange,
  disabled,
}: {
  rating: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
}) {
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={`p-1 transition-transform hover:scale-110 ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
          onMouseEnter={() => !disabled && setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => !disabled && onRatingChange(star)}
        >
          <Star
            className={`h-8 w-8 ${
              star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewSubmissionForm({
  booking,
  open,
  onOpenChange,
  onSuccess,
  isTravelerReview,
}: ReviewSubmissionFormProps) {
  const { address } = useAccount();
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [foundEscrowId, setFoundEscrowId] = React.useState<bigint | null>(null);
  const { invalidateAfterReview } = useInvalidateQueries();

  // Submit review hook
  const {
    submitReview,
    isPending: isSubmitting,
    isConfirming,
    isSuccess: isSubmitSuccess,
    error: submitError,
  } = useSubmitReview();

  // Get user's escrow IDs to find the matching one
  const { data: userEscrowData } = useReadContracts({
    contracts: address
      ? [
          {
            ...CONTRACTS.escrowRegistry,
            functionName: "getUserEscrows",
            args: [address],
          },
        ]
      : [],
    query: {
      enabled: !!address && !!booking?.escrowAddress,
    },
  });

  const userEscrowIds = userEscrowData?.[0]?.result as bigint[] | undefined;

  // Resolve escrowId from escrowAddress using multicall
  const escrowAddressQueries = React.useMemo(() => {
    if (!userEscrowIds) return [];
    return userEscrowIds.map((escrowId) => ({
      address: CONTRACTS.escrowRegistry.address,
      abi: CONTRACTS.escrowRegistry.abi,
      functionName: "escrows",
      args: [escrowId],
    }));
  }, [userEscrowIds]);

  const { data: escrowAddressesData } = useReadContracts({
    contracts: escrowAddressQueries as any,
    query: {
      enabled: escrowAddressQueries.length > 0 && !!booking?.escrowAddress,
    },
  });

  // Find matching escrowId
  React.useEffect(() => {
    if (!escrowAddressesData || !userEscrowIds || !booking?.escrowAddress) return;

    for (let i = 0; i < escrowAddressesData.length; i++) {
      const result = escrowAddressesData[i];
      if (
        result?.result &&
        (result.result as string).toLowerCase() === booking.escrowAddress.toLowerCase()
      ) {
        setFoundEscrowId(userEscrowIds[i]);
        return;
      }
    }
  }, [escrowAddressesData, userEscrowIds, booking?.escrowAddress]);

  // Check if review window is still open (14 days after checkout)
  const reviewWindowInfo = React.useMemo(() => {
    if (!booking) return null;

    const checkOutTime = booking.checkOut.getTime();
    const windowEnd = checkOutTime + REVIEW_WINDOW_MS;
    const now = Date.now();

    const isOpen = now >= checkOutTime && now <= windowEnd;
    const daysLeft = Math.ceil((windowEnd - now) / (24 * 60 * 60 * 1000));

    return {
      isOpen,
      daysLeft: Math.max(0, daysLeft),
      isTooEarly: now < checkOutTime,
      isExpired: now > windowEnd,
    };
  }, [booking]);

  // Reset form when booking changes
  React.useEffect(() => {
    if (booking) {
      setRating(0);
      setComment("");
      setFoundEscrowId(null);
    }
  }, [booking?.id]);

  // Handle success with cache invalidation
  React.useEffect(() => {
    if (isSubmitSuccess) {
      toast.success("Review submitted successfully!", {
        description: "Your review is pending moderation and will be published soon.",
      });
      onOpenChange(false);
      onSuccess?.();
      // Invalidate cache to refresh UI across the app
      invalidateAfterReview(3000);
    }
  }, [isSubmitSuccess, onOpenChange, onSuccess, invalidateAfterReview]);

  // Handle error
  React.useEffect(() => {
    if (submitError) {
      const errorMsg = submitError.message;
      if (errorMsg.includes("AlreadyReviewed")) {
        toast.error("You have already submitted a review for this booking.");
      } else if (errorMsg.includes("InvalidRating")) {
        toast.error("Invalid rating. Please select between 1 and 5 stars.");
      } else {
        toast.error("Failed to submit review. Please try again.");
      }
    }
  }, [submitError]);

  const handleSubmit = async () => {
    if (!booking || !address || rating === 0 || foundEscrowId === null) return;

    try {
      setIsUploading(true);

      // Upload comment to IPFS
      const ipfsHash = await uploadReviewToIPFS(comment || "No comment provided.");

      setIsUploading(false);

      // Submit review to contract
      submitReview({
        escrowId: foundEscrowId,
        propertyId: BigInt(booking.propertyId),
        bookingIndex: BigInt(booking.bookingIndex),
        reviewee: isTravelerReview ? booking.hostAddress : booking.travelerAddress,
        rating,
        ipfsCommentHash: ipfsHash,
        travelerToHost: isTravelerReview,
      });
    } catch {
      setIsUploading(false);
      toast.error("Failed to upload review. Please try again.");
    }
  };

  if (!booking) return null;

  const isLoading = isUploading || isSubmitting || isConfirming;
  const canSubmit = rating > 0 && reviewWindowInfo?.isOpen && foundEscrowId !== null && !isLoading;

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
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">{booking.propertyName}</h3>
            <p className="text-muted-foreground text-sm">{booking.roomName}</p>
            <div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{booking.location}</span>
            </div>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>Checkout: {booking.checkOut.toLocaleDateString()}</span>
            </div>
          </div>

          {/* Review Window Status */}
          {reviewWindowInfo && (
            <>
              {reviewWindowInfo.isTooEarly && (
                <Alert variant="default" className="border-yellow-500/30 bg-yellow-500/5">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    Reviews can only be submitted after checkout.
                  </AlertDescription>
                </Alert>
              )}

              {reviewWindowInfo.isExpired && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    The review window has expired. Reviews must be submitted within{" "}
                    {REVIEW_WINDOW_DAYS} days of checkout.
                  </AlertDescription>
                </Alert>
              )}

              {reviewWindowInfo.isOpen && (
                <Alert className="border-green-500/30 bg-green-500/5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    {reviewWindowInfo.daysLeft} days left to submit your review
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Escrow ID Status */}
          {!foundEscrowId && userEscrowIds && (
            <Alert variant="default">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Finding booking details...</AlertDescription>
            </Alert>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              disabled={!reviewWindowInfo?.isOpen || isLoading}
            />
            {rating > 0 && (
              <p className="text-muted-foreground text-sm">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Review (optional)</Label>
            <Textarea
              id="comment"
              placeholder={`Share your experience ${isTravelerReview ? "at this property" : "with this traveler"}...`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={!reviewWindowInfo?.isOpen || isLoading}
              rows={5}
              maxLength={2000}
            />
            <p className="text-muted-foreground text-right text-xs">
              {comment.length}/2000 characters
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
          <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full" size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploading
                  ? "Uploading review..."
                  : isConfirming
                    ? "Confirming..."
                    : "Submitting..."}
              </>
            ) : (
              <>
                <Star className="mr-2 h-4 w-4" />
                Submit Review
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
