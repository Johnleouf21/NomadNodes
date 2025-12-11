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
import { useAccount, useReadContracts, useReadContract } from "wagmi";
import { useSubmitReview } from "@/lib/hooks/contracts/useReviewSystem";
import { uploadReviewToIPFS } from "@/lib/utils/ipfs";
import { CONTRACTS } from "@/lib/contracts";
import { useInvalidateQueries } from "@/hooks/useInvalidateQueries";
import type { Address } from "viem";

// Review window: 14 days after checkout
const REVIEW_WINDOW_DAYS = 14;
const REVIEW_WINDOW_MS = REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;

// Dev mode bypass - allows reviews before checkout for testing
const DEV_MODE_REVIEW_BYPASS = process.env.NEXT_PUBLIC_DEV_MODE === "true";

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
  const [escrowSearchComplete, setEscrowSearchComplete] = React.useState(false);
  const { invalidateAfterReview } = useInvalidateQueries();

  // Ref to track timeout so we can clear it when escrow is found
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Refs to track if we've already handled success/error toasts (prevents infinite toasts)
  // Track by transaction hash instead of boolean to handle reopening the modal
  const lastHandledSuccessHashRef = React.useRef<string | null>(null);
  const lastHandledErrorRef = React.useRef<string | null>(null);

  // Submit review hook
  const {
    submitReview,
    hash: submitHash,
    isPending: isSubmitting,
    isConfirming,
    isSuccess: isSubmitSuccess,
    error: submitError,
  } = useSubmitReview();

  // Get escrow IDs - escrows are typically created by BookingManager, not the traveler
  // We query both the BookingManager's escrows and the traveler's escrows as fallback
  const bookingManagerAddress = CONTRACTS.bookingManager.address;

  const queryEnabled = !!booking?.escrowAddress;

  // If escrow address is missing, mark search as complete immediately
  React.useEffect(() => {
    if (booking && !booking.escrowAddress) {
      setEscrowSearchComplete(true);
    }
  }, [booking]);

  // Timeout to prevent infinite loading - if escrow not found after 15 seconds, give up
  // Using ref to ensure we can cancel the timeout when escrow is found
  React.useEffect(() => {
    // Clear any existing timeout first
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Only set timeout if we haven't found the escrow yet and booking data is available
    if (!escrowSearchComplete && !foundEscrowId && booking?.escrowAddress) {
      timeoutRef.current = setTimeout(() => {
        setEscrowSearchComplete(true);
        timeoutRef.current = null;
      }, 15000); // Increased to 15 seconds
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [escrowSearchComplete, foundEscrowId, booking?.escrowAddress]);

  // Build contracts array for querying escrows from both BookingManager and traveler
  const escrowQueryContracts = React.useMemo(() => {
    if (!booking?.escrowAddress) return [];
    const contracts: {
      address: `0x${string}`;
      abi: typeof CONTRACTS.escrowRegistry.abi;
      functionName: "getUserEscrows";
      args: [`0x${string}`];
    }[] = [
      {
        address: CONTRACTS.escrowRegistry.address,
        abi: CONTRACTS.escrowRegistry.abi,
        functionName: "getUserEscrows",
        args: [bookingManagerAddress],
      },
    ];
    // Also query traveler's escrows as fallback
    if (booking?.travelerAddress) {
      contracts.push({
        address: CONTRACTS.escrowRegistry.address,
        abi: CONTRACTS.escrowRegistry.abi,
        functionName: "getUserEscrows",
        args: [booking.travelerAddress],
      });
    }
    return contracts;
  }, [booking?.escrowAddress, booking?.travelerAddress, bookingManagerAddress]);

  // Query escrows from both BookingManager (primary) and traveler (fallback)
  const {
    data: escrowOwnerData,
    isLoading: isLoadingEscrowIds,
    error: escrowQueryError,
  } = useReadContracts({
    contracts: escrowQueryContracts as any,
    query: {
      enabled: queryEnabled && escrowQueryContracts.length > 0,
    },
  });

  // Debug query error
  React.useEffect(() => {
    if (escrowQueryError) {
      console.error("ReviewSubmissionForm - Escrow query error:", escrowQueryError);
    }
  }, [escrowQueryError]);

  // Combine escrow IDs from both sources (BookingManager and traveler)
  const userEscrowIds = React.useMemo(() => {
    if (!escrowOwnerData) return undefined;
    const bookingManagerEscrows = escrowOwnerData[0]?.result as bigint[] | undefined;
    const travelerEscrows = escrowOwnerData[1]?.result as bigint[] | undefined;
    const combined = [...(bookingManagerEscrows || []), ...(travelerEscrows || [])];
    // Remove duplicates
    const unique = [...new Set(combined.map((id) => id.toString()))].map((id) => BigInt(id));
    return unique.length > 0 ? unique : undefined;
  }, [escrowOwnerData]);

  // Check if first query failed or returned no data
  // Also consider query complete if there's an error or the query isn't enabled
  const firstQueryComplete =
    !isLoadingEscrowIds && (escrowOwnerData !== undefined || !queryEnabled);

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

  // Handle case when user has no escrows (empty array) or first query returned no data
  React.useEffect(() => {
    if (firstQueryComplete && booking?.escrowAddress) {
      // If first query is done but no escrow IDs found, mark search as complete
      if (!userEscrowIds || userEscrowIds.length === 0) {
        setEscrowSearchComplete(true);
      }
    }
  }, [firstQueryComplete, userEscrowIds, booking?.escrowAddress]);

  // Find matching escrowId from escrow addresses
  React.useEffect(() => {
    if (
      !escrowAddressesData ||
      !userEscrowIds ||
      userEscrowIds.length === 0 ||
      !booking?.escrowAddress
    )
      return;

    for (let i = 0; i < escrowAddressesData.length; i++) {
      const result = escrowAddressesData[i];
      if (
        result?.result &&
        (result.result as string).toLowerCase() === booking.escrowAddress.toLowerCase()
      ) {
        // Clear timeout immediately when escrow is found
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setFoundEscrowId(userEscrowIds[i]);
        setEscrowSearchComplete(true);
        return;
      }
    }
    // Mark search as complete even if not found
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setEscrowSearchComplete(true);
  }, [escrowAddressesData, userEscrowIds, booking?.escrowAddress]);

  // Check if user has already reviewed this booking for this direction
  const { data: hasAlreadyReviewedData, isLoading: isCheckingReview } = useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "hasReviewed",
    args: foundEscrowId !== null ? [foundEscrowId, isTravelerReview] : undefined,
    query: {
      enabled: foundEscrowId !== null,
    },
  });
  const hasAlreadyReviewed = hasAlreadyReviewedData as boolean | undefined;

  // Check if review window is still open (14 days after checkout)
  // In dev mode, bypass the checkout date check for testing
  const reviewWindowInfo = React.useMemo(() => {
    if (!booking) return null;

    const checkOutTime = booking.checkOut.getTime();
    const windowEnd = checkOutTime + REVIEW_WINDOW_MS;
    const now = Date.now();

    const isTooEarly = now < checkOutTime;
    const isExpired = now > windowEnd;

    // In dev mode, allow reviews even before checkout
    const isOpen = DEV_MODE_REVIEW_BYPASS
      ? now <= windowEnd // Only check not expired in dev mode
      : now >= checkOutTime && now <= windowEnd;

    const daysLeft = Math.ceil((windowEnd - now) / (24 * 60 * 60 * 1000));

    return {
      isOpen,
      daysLeft: Math.max(0, daysLeft),
      isTooEarly: DEV_MODE_REVIEW_BYPASS ? false : isTooEarly,
      isExpired,
      isDevMode: DEV_MODE_REVIEW_BYPASS,
    };
  }, [booking]);

  // Reset form when booking changes
  React.useEffect(() => {
    if (booking) {
      setRating(0);
      setComment("");
      setFoundEscrowId(null);
      setEscrowSearchComplete(false);
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Don't reset lastHandledSuccessHashRef - we track by hash to prevent duplicate toasts
      lastHandledErrorRef.current = null;
    }
  }, [booking?.id]);

  // Handle success with cache invalidation
  React.useEffect(() => {
    // Only handle success once per transaction hash to prevent duplicate toasts
    if (isSubmitSuccess && submitHash && lastHandledSuccessHashRef.current !== submitHash) {
      lastHandledSuccessHashRef.current = submitHash;
      toast.success("Review submitted successfully!", {
        description: "Your review is pending moderation and will be published soon.",
      });
      onOpenChange(false);
      onSuccess?.();
      // Invalidate cache to refresh UI across the app
      invalidateAfterReview(3000);
    }
  }, [isSubmitSuccess, submitHash, onOpenChange, onSuccess, invalidateAfterReview]);

  // Handle error (only show toast once per unique error)
  React.useEffect(() => {
    if (submitError && submitError.message !== lastHandledErrorRef.current) {
      lastHandledErrorRef.current = submitError.message;
      const errorMsg = submitError.message;
      console.error("Review submission error:", submitError);
      if (errorMsg.includes("AlreadyReviewed")) {
        toast.error("You have already submitted a review for this booking.");
      } else if (errorMsg.includes("InvalidRating")) {
        toast.error("Invalid rating. Please select between 1 and 5 stars.");
      } else if (errorMsg.includes("NotParticipant") || errorMsg.includes("NotBuyer")) {
        toast.error("You are not a participant in this booking.");
      } else if (errorMsg.includes("InvalidEscrow")) {
        toast.error("Invalid escrow. The booking data may be incorrect.");
      } else if (errorMsg.includes("EscrowNotCompleted")) {
        toast.error("The booking must be completed before you can leave a review.");
      } else if (errorMsg.includes("User rejected") || errorMsg.includes("User denied")) {
        toast.error("Transaction was rejected.");
      } else if (errorMsg.includes("intrinsic gas too low") || errorMsg.includes("out of gas")) {
        toast.error("Transaction ran out of gas. Please try again.");
      } else {
        // Show more detailed error in development
        const shortError = errorMsg.length > 100 ? errorMsg.substring(0, 100) + "..." : errorMsg;
        toast.error("Failed to submit review", {
          description: shortError,
        });
      }
    }
  }, [submitError]);

  const handleSubmit = async () => {
    if (!booking || !address || rating === 0 || foundEscrowId === null) {
      console.log("Submit blocked - missing data:", {
        hasBooking: !!booking,
        hasAddress: !!address,
        rating,
        foundEscrowId: foundEscrowId?.toString(),
      });
      return;
    }

    try {
      setIsUploading(true);

      // Upload comment to IPFS
      console.log("Uploading to IPFS...");
      const ipfsHash = await uploadReviewToIPFS(comment || "No comment provided.");
      console.log("IPFS hash:", ipfsHash);

      setIsUploading(false);

      // Prepare review data
      const reviewData = {
        escrowId: foundEscrowId,
        propertyId: BigInt(booking.propertyId),
        bookingIndex: BigInt(booking.bookingIndex),
        reviewee: isTravelerReview ? booking.hostAddress : booking.travelerAddress,
        rating,
        ipfsCommentHash: ipfsHash,
        travelerToHost: isTravelerReview,
      };

      console.log("Submitting review with data:", {
        escrowId: reviewData.escrowId.toString(),
        propertyId: reviewData.propertyId.toString(),
        bookingIndex: reviewData.bookingIndex.toString(),
        reviewee: reviewData.reviewee,
        rating: reviewData.rating,
        ipfsCommentHash: reviewData.ipfsCommentHash,
        travelerToHost: reviewData.travelerToHost,
      });

      // Submit review to contract
      submitReview(reviewData);
    } catch (err) {
      console.error("Error during review submission:", err);
      setIsUploading(false);
      toast.error("Failed to upload review. Please try again.");
    }
  };

  if (!booking) return null;

  const isLoading = isUploading || isSubmitting || isConfirming;
  const alreadyReviewed = hasAlreadyReviewed === true;
  const canSubmit =
    rating > 0 &&
    reviewWindowInfo?.isOpen &&
    foundEscrowId !== null &&
    !isLoading &&
    !alreadyReviewed;

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
                    {reviewWindowInfo.isDevMode ? (
                      <span className="font-medium text-orange-600">
                        🔧 DEV MODE: Review bypass active (checkout not required)
                      </span>
                    ) : (
                      `${reviewWindowInfo.daysLeft} days left to submit your review`
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Escrow ID Status */}
          {foundEscrowId === null && !escrowSearchComplete && (
            <Alert variant="default">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Finding booking details...</AlertDescription>
            </Alert>
          )}

          {foundEscrowId === null && escrowSearchComplete && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Could not find booking escrow. The booking may not have been properly registered.
              </AlertDescription>
            </Alert>
          )}

          {/* Already Reviewed Check */}
          {foundEscrowId !== null && isCheckingReview && (
            <Alert variant="default">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Checking review status...</AlertDescription>
            </Alert>
          )}

          {foundEscrowId !== null && !isCheckingReview && hasAlreadyReviewed && (
            <Alert className="border-blue-500/30 bg-blue-500/5">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                You have already submitted a review for this booking. Thank you for your feedback!
              </AlertDescription>
            </Alert>
          )}

          {/* Rating - Hidden if already reviewed */}
          {!alreadyReviewed && (
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
          )}

          {/* Comment - Hidden if already reviewed */}
          {!alreadyReviewed && (
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
          )}

          {/* Info about moderation - Hidden if already reviewed */}
          {!alreadyReviewed && (
            <div className="text-muted-foreground rounded-lg border p-3 text-sm">
              <p className="font-medium">About Reviews</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                <li>All reviews are moderated before publication</li>
                <li>Honest and constructive feedback is appreciated</li>
                <li>Reviews affect the reputation of the reviewee</li>
              </ul>
            </div>
          )}

          {/* Submit Button - Hidden if already reviewed */}
          {!alreadyReviewed && (
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
