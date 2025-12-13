"use client";

/**
 * CancelBookingModal - Modal for cancelling bookings with refund information
 */

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, XCircle } from "lucide-react";

import type { CancelBookingModalProps } from "./types";
import { calculateRefund, getDaysUntilCheckIn, getCurrencyLabel } from "./utils";
import { useCancellationData, useCancellation } from "./hooks";
import {
  BookingInfo,
  CancellationPolicy,
  RefundBreakdown,
  CancellationWarning,
} from "./components";

export function CancelBookingModal({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: CancelBookingModalProps) {
  const [confirmed, setConfirmed] = React.useState(false);

  // Fetch escrow data
  const { refundPercentage, escrowAmount, platformFee, loadingPercentage } = useCancellationData({
    escrowAddress: booking?.escrowAddress ?? null,
    enabled: open,
  });

  // Calculate refund amounts
  const refund = React.useMemo(
    () =>
      calculateRefund({
        refundPercentage,
        escrowAmount,
        platformFee,
        bookingTotal: booking?.total || 0,
      }),
    [refundPercentage, escrowAmount, platformFee, booking?.total]
  );

  const currencyLabel = getCurrencyLabel(booking?.currency);
  const daysUntilCheckIn = booking ? getDaysUntilCheckIn(booking.checkIn) : 0;

  // Cancellation transaction
  const { handleCancel, isProcessing, isConfirming } = useCancellation({
    escrowAddress: booking?.escrowAddress ?? null,
    yourRefund: refund.yourRefund,
    currencyLabel,
    onSuccess,
    onOpenChange,
  });

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setConfirmed(false);
    }
  }, [open]);

  // Handle cancel button click
  const onCancelClick = () => {
    if (confirmed) {
      handleCancel();
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="text-destructive h-5 w-5" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription>
            Review the cancellation policy and refund amounts before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto py-4">
          <BookingInfo booking={booking} />

          <CancellationPolicy
            daysUntilCheckIn={daysUntilCheckIn}
            refundPercent={refund.refundPercent}
          />

          <Separator />

          <RefundBreakdown
            loading={loadingPercentage}
            refund={refund}
            currencyLabel={currencyLabel}
          />

          <CancellationWarning refundPercent={refund.refundPercent} />

          {/* Confirmation */}
          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="confirm-cancel"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              disabled={isProcessing}
            />
            <Label htmlFor="confirm-cancel" className="cursor-pointer text-sm leading-relaxed">
              I understand that this action cannot be undone and I agree to the refund terms above.
            </Label>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            onClick={onCancelClick}
            disabled={!confirmed || isProcessing || !booking.escrowAddress}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isConfirming ? "Confirming..." : "Cancelling..."}
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Booking
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
