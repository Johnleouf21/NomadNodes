"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  BedDouble,
  Users,
  Wallet,
  ExternalLink,
  MessageSquare,
  XCircle,
  Edit3,
  Clock,
  DollarSign,
  Home,
  Copy,
  Check,
  Shield,
  AlertTriangle,
  Star,
  CheckCircle2,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useReadContract } from "wagmi";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { PonderReview } from "@/hooks/usePonderReviews";
import { CheckInActions } from "./CheckInActions";
import { fetchFromIPFS, type ReviewComment } from "@/lib/utils/ipfs";
import { CONTRACTS } from "@/lib/contracts";

// Type for the Review struct returned by getReview
interface ReviewStruct {
  reviewId: bigint;
  escrowId: bigint;
  propertyId: bigint;
  bookingIndex: bigint;
  reviewer: string;
  reviewee: string;
  rating: number;
  ipfsCommentHash: string;
  submittedAt: bigint;
  status: number;
  moderationNote: string;
  moderator: string;
  travelerToHost: boolean;
}

interface BookingDetailSheetProps {
  booking: {
    id: string;
    propertyId: string;
    propertyName: string;
    roomTypeId: string;
    roomName: string;
    tokenId: string;
    bookingIndex?: string;
    location: string;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    total: number;
    currency?: "USD" | "EUR";
    status: "upcoming" | "past" | "cancelled";
    ponderStatus: PonderBooking["status"];
    image: string;
    escrowAddress: string | null;
    hostAddress?: string | null;
    travelerAddress?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelClick: () => void;
  onReviewClick: () => void;
  onMessage?: () => void;
  /** Existing review for this booking (if any) */
  existingReview?: PonderReview | null;
}

const ponderStatusConfig: Record<
  PonderBooking["status"],
  { label: string; color: string; description: string }
> = {
  Pending: {
    label: "Pending",
    color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    description: "Booking is confirmed and funds are held in escrow",
  },
  Confirmed: {
    label: "Confirmed",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    description: "Booking has been confirmed by the host",
  },
  CheckedIn: {
    label: "Checked In",
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
    description: "Guest has checked in to the property",
  },
  Completed: {
    label: "Completed",
    color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
    description: "Stay completed - funds released to host",
  },
  Cancelled: {
    label: "Cancelled",
    color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
    description: "Booking was cancelled",
  },
};

export function BookingDetailSheet({
  booking,
  open,
  onOpenChange,
  onCancelClick,
  onReviewClick,
  onMessage,
  existingReview,
}: BookingDetailSheetProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);
  const [reviewComment, setReviewComment] = React.useState<string | null>(null);
  const [loadingComment, setLoadingComment] = React.useState(false);

  // Track the current booking to detect changes
  const currentBookingRef = React.useRef<string | null>(null);

  // Reset state when booking changes
  React.useEffect(() => {
    const newBookingId = booking?.id || null;
    if (newBookingId !== currentBookingRef.current) {
      currentBookingRef.current = newBookingId;
      setReviewComment(null);
      setLoadingComment(false);
    }
  }, [booking?.id]);

  // Fetch review data from contract to get ipfsCommentHash
  // Refetch every time the sheet opens to ensure fresh data
  const {
    data: reviewDataRaw,
    isLoading: isLoadingReviewData,
    refetch: refetchReviewData,
  } = useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "getReview",
    args: existingReview?.reviewId ? [BigInt(existingReview.reviewId)] : undefined,
    query: {
      enabled: !!existingReview?.reviewId && open,
    },
  });
  const reviewData = reviewDataRaw as ReviewStruct | undefined;

  // Fetch the escrow address from EscrowFactory using the escrowId from the review
  const { data: reviewEscrowAddress } = useReadContract({
    ...CONTRACTS.escrowFactory,
    functionName: "escrows",
    args: reviewData?.escrowId ? [reviewData.escrowId] : undefined,
    query: {
      enabled: !!reviewData?.escrowId && open,
    },
  });

  // Check if the review actually belongs to this specific booking
  // We compare the escrow address from EscrowFactory with the booking's escrowAddress
  // because bookingIndex alone is not unique (each room has its own counter)
  const reviewBelongsToThisBooking = React.useMemo(() => {
    if (!existingReview || !reviewData || !booking?.escrowAddress || !reviewEscrowAddress) {
      return false;
    }

    const bookingEscrowAddress = booking.escrowAddress.toLowerCase();
    const reviewEscrowAddr = (reviewEscrowAddress as string).toLowerCase();

    const matches = reviewEscrowAddr === bookingEscrowAddress;

    return matches;
  }, [existingReview, reviewData, booking?.escrowAddress, booking?.id, reviewEscrowAddress]);

  // Refetch review data when sheet opens
  React.useEffect(() => {
    if (open && existingReview?.reviewId) {
      setReviewComment(null); // Reset comment
      refetchReviewData();
    }
  }, [open, existingReview?.reviewId, refetchReviewData]);

  // Fetch review comment from IPFS ONLY if the review belongs to this booking
  React.useEffect(() => {
    async function fetchReviewComment() {
      // Only fetch if review belongs to this booking
      if (!reviewBelongsToThisBooking) {
        setReviewComment(null);
        return;
      }

      const ipfsHash = reviewData?.ipfsCommentHash;
      if (!ipfsHash) {
        setReviewComment(null);
        return;
      }

      setLoadingComment(true);
      try {
        const data = await fetchFromIPFS<ReviewComment>(ipfsHash);
        if (data?.comment) {
          setReviewComment(data.comment);
        } else {
          setReviewComment(null);
        }
      } catch (error) {
        console.warn("Failed to fetch review comment from IPFS:", error);
        setReviewComment(null);
      } finally {
        setLoadingComment(false);
      }
    }

    if (open && reviewData) {
      fetchReviewComment();
    }
  }, [reviewData, reviewBelongsToThisBooking, open]);

  if (!booking) return null;

  const statusConfig = ponderStatusConfig[booking.ponderStatus];
  const isUpcoming = booking.status === "upcoming";
  const isPast = booking.status === "past";
  const canCancel =
    isUpcoming && (booking.ponderStatus === "Pending" || booking.ponderStatus === "Confirmed");
  // Only show Leave Review button if completed AND no existing review for THIS specific booking
  // We need to wait for reviewData to load to know if a review exists for this booking
  const canReview =
    isPast &&
    booking.ponderStatus === "Completed" &&
    !isLoadingReviewData &&
    !reviewBelongsToThisBooking;
  const currencyLabel = booking.currency === "EUR" ? "EURC" : "USDC";

  // Calculate days until check-in
  const daysUntilCheckIn = Math.ceil(
    (booking.checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewProperty = () => {
    router.push(`/property/${booking.propertyId}`);
    onOpenChange(false);
  };

  const handleViewEscrow = () => {
    if (booking.escrowAddress) {
      window.open(`https://sepolia.etherscan.io/address/${booking.escrowAddress}`, "_blank");
    }
  };

  const handleMessage = () => {
    if (onMessage) {
      onMessage();
    } else {
      toast.info("Messaging feature coming soon!", {
        description: "You will be able to message the host directly.",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-left">Booking Details</SheetTitle>
          <SheetDescription className="text-left">
            Booking #{booking.id.slice(0, 8)}...
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-1 pb-6">
          {/* Property Image & Info */}
          <div className="relative overflow-hidden rounded-lg">
            {booking.image ? (
              <img
                src={booking.image}
                alt={booking.propertyName}
                className="h-48 w-full object-cover"
              />
            ) : (
              <div className="bg-muted flex h-48 w-full items-center justify-center">
                <Home className="text-muted-foreground/30 h-16 w-16" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <Badge className={`${statusConfig.color} border`}>{statusConfig.label}</Badge>
            </div>
          </div>

          {/* Property & Room */}
          <div>
            <h3 className="text-xl font-bold">{booking.propertyName}</h3>
            <div className="text-primary mt-2 flex items-center gap-2">
              <BedDouble className="h-4 w-4" />
              <span className="font-medium">{booking.roomName}</span>
            </div>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{booking.location}</span>
            </div>
          </div>

          <Separator />

          {/* Status Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="text-primary mt-0.5 h-5 w-5" />
              <div>
                <p className="font-medium">{statusConfig.label}</p>
                <p className="text-muted-foreground text-sm">{statusConfig.description}</p>
              </div>
            </div>
            {isUpcoming && daysUntilCheckIn > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span>{daysUntilCheckIn} days until check-in</span>
              </div>
            )}
          </div>

          {/* Dates & Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
                Check-in
              </p>
              <p className="font-semibold">{booking.checkIn.toLocaleDateString()}</p>
              <p className="text-muted-foreground text-xs">After 3:00 PM</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
                Check-out
              </p>
              <p className="font-semibold">{booking.checkOut.toLocaleDateString()}</p>
              <p className="text-muted-foreground text-xs">Before 11:00 AM</p>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <DollarSign className="h-4 w-4" />
              Payment Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{booking.nights} nights</span>
                <span>
                  {(booking.total * 0.95).toFixed(2)} {currencyLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform fee (5%)</span>
                <span>
                  {(booking.total * 0.05).toFixed(2)} {currencyLabel}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-semibold">
                <span>Total Paid</span>
                <span>
                  {booking.total.toFixed(2)} {currencyLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Check-in Actions */}
          {booking.escrowAddress &&
            isUpcoming &&
            (booking.ponderStatus === "Confirmed" || booking.ponderStatus === "CheckedIn") && (
              <CheckInActions
                escrowAddress={booking.escrowAddress}
                checkInDate={booking.checkIn}
                isTraveler={true}
                onSuccess={() => {
                  toast.success("Check-in confirmed!");
                  onOpenChange(false);
                }}
              />
            )}

          {/* Waiting for Host Confirmation */}
          {booking.escrowAddress && isUpcoming && booking.ponderStatus === "Pending" && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">
                    Waiting for Host Confirmation
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    The host needs to confirm your booking before you can check in. You'll be able
                    to confirm your arrival once the booking is confirmed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Escrow Info */}
          {booking.escrowAddress && (
            <div className="rounded-lg border p-4">
              <h4 className="mb-3 flex items-center gap-2 font-semibold">
                <Wallet className="h-4 w-4" />
                Escrow Contract
              </h4>
              <p className="text-muted-foreground mb-2 text-xs">
                Your funds are securely held in a smart contract until your stay is completed.
              </p>
              <div className="flex items-center gap-2">
                <code className="bg-muted flex-1 truncate rounded px-2 py-1.5 font-mono text-xs">
                  {booking.escrowAddress}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => copyAddress(booking.escrowAddress!)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="link" size="sm" className="mt-2 px-0" onClick={handleViewEscrow}>
                <ExternalLink className="mr-1 h-3 w-3" />
                View on BaseScan
              </Button>
            </div>
          )}

          {/* Cancellation Warning for Upcoming */}
          {canCancel && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">
                    Cancellation Policy
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {daysUntilCheckIn > 30
                      ? "Full refund if cancelled now (100%)"
                      : daysUntilCheckIn >= 14
                        ? "Partial refund if cancelled now (50%)"
                        : "No refund available at this time (0%)"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Button className="w-full" variant="outline" onClick={handleViewProperty}>
              <Home className="mr-2 h-4 w-4" />
              View Property
            </Button>

            <Button className="w-full" variant="outline" onClick={handleMessage}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Host
            </Button>

            {/* Display existing review if user already submitted one for THIS booking */}
            {reviewBelongsToThisBooking &&
              isPast &&
              booking.ponderStatus === "Completed" &&
              existingReview && (
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
                          Submitted{" "}
                          {new Date(Number(existingReview.createdAt) * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      {/* Display review comment if available */}
                      {isLoadingReviewData || loadingComment ? (
                        <div className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Loading comment...</span>
                        </div>
                      ) : reviewComment ? (
                        <div className="mt-3">
                          <div className="flex items-start gap-2">
                            <MessageCircle className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
                            <p className="text-muted-foreground text-sm italic">
                              &quot;{reviewComment}&quot;
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

            {canReview && (
              <Button
                className="w-full"
                onClick={() => {
                  onReviewClick();
                  onOpenChange(false);
                }}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Leave a Review
              </Button>
            )}

            {canCancel && (
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => {
                  onCancelClick();
                  onOpenChange(false);
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Booking
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
