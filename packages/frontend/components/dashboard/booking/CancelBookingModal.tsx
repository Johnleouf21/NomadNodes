"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Loader2,
  XCircle,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { useInvalidateQueries } from "@/hooks/useInvalidateQueries";

// TravelEscrow ABI (only the functions we need)
const ESCROW_ABI = [
  {
    inputs: [],
    name: "getRefundPercentage",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "cancelBooking",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "amount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFee",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "checkIn",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface CancelBookingModalProps {
  booking: {
    id: string;
    propertyName: string;
    roomName: string;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    total: number;
    currency?: "USD" | "EUR";
    escrowAddress: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CancelBookingModal({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: CancelBookingModalProps) {
  const [confirmed, setConfirmed] = React.useState(false);
  const { invalidateAfterBooking } = useInvalidateQueries();

  // Read refund percentage from escrow
  const { data: refundPercentage, isLoading: loadingPercentage } = useReadContract({
    address: booking?.escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "getRefundPercentage",
    query: {
      enabled: !!booking?.escrowAddress && open,
    },
  });

  // Read escrow amount
  const { data: escrowAmount } = useReadContract({
    address: booking?.escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "amount",
    query: {
      enabled: !!booking?.escrowAddress && open,
    },
  });

  // Read platform fee
  const { data: platformFee } = useReadContract({
    address: booking?.escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "platformFee",
    query: {
      enabled: !!booking?.escrowAddress && open,
    },
  });

  // Cancel booking transaction
  const {
    writeContract,
    data: txHash,
    isPending: isCancelling,
    error: cancelError,
  } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Calculate amounts
  const refundPercent = refundPercentage !== undefined ? Number(refundPercentage) : 0;
  const totalAmount = escrowAmount !== undefined ? Number(escrowAmount) / 1e6 : booking?.total || 0;
  const fee = platformFee !== undefined ? Number(platformFee) / 1e6 : totalAmount * 0.05;
  const refundableAmount = totalAmount - fee;
  const yourRefund = (refundableAmount * refundPercent) / 100;
  const hostReceives = refundableAmount - yourRefund;

  // Days until check-in
  const daysUntilCheckIn = booking
    ? Math.ceil((booking.checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // Handle cancel
  const handleCancel = () => {
    if (!booking?.escrowAddress || !confirmed) return;

    writeContract({
      address: booking.escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "cancelBooking",
    });
  };

  // Currency label
  const currencyLabel = booking?.currency === "EUR" ? "EURC" : "USDC";

  // Handle success with cache invalidation
  React.useEffect(() => {
    if (isSuccess) {
      toast.success("Booking cancelled successfully", {
        description: `You will receive ${yourRefund.toFixed(2)} ${currencyLabel} refund`,
      });
      onSuccess?.();
      onOpenChange(false);
      // Invalidate cache to refresh UI across the app
      invalidateAfterBooking(3000);
    }
  }, [isSuccess, yourRefund, onSuccess, onOpenChange, currencyLabel, invalidateAfterBooking]);

  // Handle error
  React.useEffect(() => {
    if (cancelError) {
      toast.error("Failed to cancel booking", {
        description: cancelError.message,
      });
    }
  }, [cancelError]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setConfirmed(false);
    }
  }, [open]);

  if (!booking) return null;

  const isProcessing = isCancelling || isConfirming;

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
          {/* Booking Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold">{booking.propertyName}</h4>
            <p className="text-muted-foreground text-sm">{booking.roomName}</p>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span>
                {booking.checkIn.toLocaleDateString()} - {booking.checkOut.toLocaleDateString()}
              </span>
              <span className="text-muted-foreground">({booking.nights} nights)</span>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-semibold">
              <Clock className="h-4 w-4" />
              Cancellation Policy
            </h4>

            <div className="grid gap-2 text-sm">
              <div
                className={`flex items-center justify-between rounded p-2 ${daysUntilCheckIn > 30 ? "border border-green-500/30 bg-green-500/10" : "bg-muted/50"}`}
              >
                <div className="flex items-center gap-2">
                  {daysUntilCheckIn > 30 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="border-muted-foreground/30 h-4 w-4 rounded-full border-2" />
                  )}
                  <span>More than 30 days before</span>
                </div>
                <Badge
                  variant="outline"
                  className="border-green-500/30 bg-green-500/10 text-green-700"
                >
                  100% refund
                </Badge>
              </div>

              <div
                className={`flex items-center justify-between rounded p-2 ${daysUntilCheckIn >= 14 && daysUntilCheckIn <= 30 ? "border border-yellow-500/30 bg-yellow-500/10" : "bg-muted/50"}`}
              >
                <div className="flex items-center gap-2">
                  {daysUntilCheckIn >= 14 && daysUntilCheckIn <= 30 ? (
                    <CheckCircle2 className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <div className="border-muted-foreground/30 h-4 w-4 rounded-full border-2" />
                  )}
                  <span>14-30 days before</span>
                </div>
                <Badge
                  variant="outline"
                  className="border-yellow-500/30 bg-yellow-500/10 text-yellow-700"
                >
                  50% refund
                </Badge>
              </div>

              <div
                className={`flex items-center justify-between rounded p-2 ${daysUntilCheckIn < 14 ? "border border-red-500/30 bg-red-500/10" : "bg-muted/50"}`}
              >
                <div className="flex items-center gap-2">
                  {daysUntilCheckIn < 14 ? (
                    <CheckCircle2 className="h-4 w-4 text-red-600" />
                  ) : (
                    <div className="border-muted-foreground/30 h-4 w-4 rounded-full border-2" />
                  )}
                  <span>Less than 14 days before</span>
                </div>
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700">
                  0% refund
                </Badge>
              </div>
            </div>

            <div className="bg-primary/5 border-primary/20 flex items-center gap-2 rounded-lg border p-3">
              <Clock className="text-primary h-5 w-5" />
              <div>
                <p className="text-sm font-medium">{daysUntilCheckIn} days until check-in</p>
                <p className="text-muted-foreground text-xs">
                  Current refund rate: <span className="font-semibold">{refundPercent}%</span>
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Refund Breakdown */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-semibold">
              <DollarSign className="h-4 w-4" />
              Refund Breakdown
            </h4>

            {loadingPercentage ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total paid</span>
                  <span>
                    {totalAmount.toFixed(2)} {currencyLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee (non-refundable)</span>
                  <span>
                    -{fee.toFixed(2)} {currencyLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refundable amount</span>
                  <span>
                    {refundableAmount.toFixed(2)} {currencyLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refund rate</span>
                  <span>{refundPercent}%</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-green-600">
                  <span>Your refund</span>
                  <span>
                    {yourRefund.toFixed(2)} {currencyLabel}
                  </span>
                </div>
                {hostReceives > 0 && (
                  <div className="text-muted-foreground flex justify-between">
                    <span>Host receives</span>
                    <span>
                      {hostReceives.toFixed(2)} {currencyLabel}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Warning */}
          {refundPercent < 100 && (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
              <div className="text-sm">
                <p className="font-medium text-yellow-700 dark:text-yellow-400">
                  {refundPercent === 0 ? "No refund available" : "Partial refund only"}
                </p>
                <p className="text-muted-foreground mt-1">
                  {refundPercent === 0
                    ? "Cancelling now means you will lose the entire booking amount (minus platform fees which go to the host)."
                    : `You will only receive ${refundPercent}% of the refundable amount. The rest goes to the host.`}
                </p>
              </div>
            </div>
          )}

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
            onClick={handleCancel}
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
