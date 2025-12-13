"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CheckInActions } from "../CheckInActions";
import type { BookingDetailSheetProps } from "./types";
import { PONDER_STATUS_CONFIG } from "./constants";
import { useReviewData, useBookingActions } from "./hooks";
import {
  PropertyHeader,
  StatusInfo,
  DateDetails,
  PaymentDetails,
  EscrowInfo,
  WaitingForHost,
  CancellationWarning,
  ExistingReview,
  ActionButtons,
} from "./components";

/**
 * Booking detail sheet for travelers
 * Displays booking information, status, and actions
 */
export function BookingDetailSheet({
  booking,
  open,
  onOpenChange,
  onCancelClick,
  onReviewClick,
  onMessage,
  existingReview,
}: BookingDetailSheetProps) {
  // Hooks
  const { reviewComment, loadingComment, isLoadingReviewData, reviewBelongsToThisBooking } =
    useReviewData({
      existingReview,
      bookingEscrowAddress: booking?.escrowAddress || null,
      bookingId: booking?.id || "",
      open,
    });

  const {
    copied,
    copyAddress,
    handleViewProperty,
    handleViewEscrow,
    handleMessage,
    daysUntilCheckIn,
    currencyLabel,
  } = useBookingActions({
    booking,
    onOpenChange,
    onMessage,
  });

  if (!booking) return null;

  const statusConfig = PONDER_STATUS_CONFIG[booking.ponderStatus];
  const isUpcoming = booking.status === "upcoming";
  const isPast = booking.status === "past";
  const canCancel =
    isUpcoming && (booking.ponderStatus === "Pending" || booking.ponderStatus === "Confirmed");
  const canReview =
    isPast &&
    booking.ponderStatus === "Completed" &&
    !isLoadingReviewData &&
    !reviewBelongsToThisBooking;

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
          {/* Property Header */}
          <PropertyHeader booking={booking} statusConfig={statusConfig} />

          <Separator />

          {/* Status Info */}
          <StatusInfo
            statusConfig={statusConfig}
            isUpcoming={isUpcoming}
            daysUntilCheckIn={daysUntilCheckIn}
          />

          {/* Date Details */}
          <DateDetails checkIn={booking.checkIn} checkOut={booking.checkOut} />

          {/* Payment Details */}
          <PaymentDetails
            nights={booking.nights}
            total={booking.total}
            currencyLabel={currencyLabel}
          />

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

          {/* Waiting for Host */}
          {booking.escrowAddress && isUpcoming && booking.ponderStatus === "Pending" && (
            <WaitingForHost />
          )}

          {/* Escrow Info */}
          {booking.escrowAddress && (
            <EscrowInfo
              escrowAddress={booking.escrowAddress}
              copied={copied}
              onCopy={copyAddress}
              onViewEscrow={handleViewEscrow}
            />
          )}

          {/* Cancellation Warning */}
          {canCancel && <CancellationWarning daysUntilCheckIn={daysUntilCheckIn} />}

          <Separator />

          {/* Existing Review */}
          {reviewBelongsToThisBooking &&
            isPast &&
            booking.ponderStatus === "Completed" &&
            existingReview && (
              <ExistingReview
                existingReview={existingReview}
                reviewComment={reviewComment}
                isLoading={isLoadingReviewData || loadingComment}
              />
            )}

          {/* Action Buttons */}
          <ActionButtons
            canCancel={canCancel}
            canReview={canReview}
            onViewProperty={handleViewProperty}
            onMessage={handleMessage}
            onReviewClick={onReviewClick}
            onCancelClick={onCancelClick}
            onOpenChange={onOpenChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
