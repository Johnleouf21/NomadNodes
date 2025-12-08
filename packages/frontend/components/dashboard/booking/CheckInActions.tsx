"use client";

import * as React from "react";
import { Clock, CheckCircle2, AlertCircle, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { useInvalidateQueries } from "@/hooks/useInvalidateQueries";

const ESCROW_ABI = [
  {
    inputs: [],
    name: "confirmStay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "autoReleaseToHost",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "checkIn",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "status",
    outputs: [{ type: "uint8", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface CheckInActionsProps {
  escrowAddress: string;
  checkInDate: Date;
  isTraveler: boolean;
  onSuccess?: () => void;
}

export function CheckInActions({
  escrowAddress,
  checkInDate,
  isTraveler,
  onSuccess,
}: CheckInActionsProps) {
  const { invalidateAfterBooking } = useInvalidateQueries();

  // Read escrow data
  const { data: escrowStatus } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "status",
  });

  const { data: checkInTimestamp } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "checkIn",
  });

  // Confirm stay mutation
  const {
    writeContract: confirmStay,
    data: confirmHash,
    isPending: isConfirmPending,
  } = useWriteContract();
  const { isLoading: isConfirmLoading, isSuccess: isConfirmSuccess } = useWaitForTransactionReceipt(
    {
      hash: confirmHash,
    }
  );

  // Auto-release mutation
  const {
    writeContract: autoRelease,
    data: autoReleaseHash,
    isPending: isAutoReleasePending,
  } = useWriteContract();
  const { isLoading: isAutoReleaseLoading, isSuccess: isAutoReleaseSuccess } =
    useWaitForTransactionReceipt({
      hash: autoReleaseHash,
    });

  // Calculate timing
  const now = Date.now();
  const checkInMs = Number(checkInTimestamp) * 1000;

  // Traveler can confirm on check-in day (00:00 - 23:59 UTC)
  const checkInDayStart = new Date(checkInMs);
  checkInDayStart.setUTCHours(0, 0, 0, 0);
  const travelerWindowStart = checkInDayStart.getTime();

  const checkInDayEnd = new Date(checkInMs);
  checkInDayEnd.setUTCHours(23, 59, 59, 999);
  const travelerWindowEnd = checkInDayEnd.getTime();

  // Host can release AFTER 23:59 of check-in day (if traveler didn't confirm)
  const hostWindowStart = travelerWindowEnd + 1;

  // For traveler: available on check-in day only (00:00 - 23:59)
  const canConfirm = now >= travelerWindowStart && now <= travelerWindowEnd && escrowStatus === 0;

  // Traveler deadline passed - they missed their window
  const travelerDeadlinePassed = now > travelerWindowEnd;

  // For host: can release after traveler's deadline (after 23:59)
  const canAutoRelease = now > travelerWindowEnd && escrowStatus === 0;

  const timeUntilTravelerWindow = Math.max(0, travelerWindowStart - now);
  const timeUntilTravelerDeadline = Math.max(0, travelerWindowEnd - now);
  const timeUntilHostWindow = Math.max(0, hostWindowStart - now);

  // Success effects with cache invalidation
  React.useEffect(() => {
    if (isConfirmSuccess) {
      toast.success("Stay confirmed! Funds released to host.");
      onSuccess?.();
      // Invalidate cache to refresh UI
      invalidateAfterBooking(3000);
    }
  }, [isConfirmSuccess, onSuccess, invalidateAfterBooking]);

  React.useEffect(() => {
    if (isAutoReleaseSuccess) {
      toast.success("Funds automatically released to host.");
      onSuccess?.();
      // Invalidate cache to refresh UI
      invalidateAfterBooking(3000);
    }
  }, [isAutoReleaseSuccess, onSuccess, invalidateAfterBooking]);

  const handleConfirmStay = () => {
    confirmStay({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "confirmStay",
    });
  };

  const handleAutoRelease = () => {
    autoRelease({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "autoReleaseToHost",
    });
  };

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return "Now available";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `in ${days}d ${hours % 24}h`;
    }
    return `in ${hours}h ${minutes}m`;
  };

  // Don't show if already completed
  if (escrowStatus !== 0) {
    return null;
  }

  // For traveler: show on check-in day only (00:00 - 23:59)
  // After deadline, traveler can no longer confirm
  if (isTraveler && (now < travelerWindowStart || travelerDeadlinePassed)) {
    return null;
  }

  // For host: show only after traveler's deadline (after 23:59 of check-in day)
  if (!isTraveler && now <= travelerWindowEnd) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Check-in Actions
        </CardTitle>
        <CardDescription>
          {isTraveler
            ? "Confirm your arrival to release payment to the host"
            : "Payment will be automatically released if guest doesn't confirm"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Traveler: Confirm Stay */}
        {isTraveler && (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Confirm Your Stay
                </h4>
                <p className="text-muted-foreground text-sm">
                  Available on check-in day ({checkInDate.toLocaleDateString()})
                </p>
              </div>
              <Badge variant="default" className="bg-green-500">
                Available
              </Badge>
            </div>

            <Button
              onClick={handleConfirmStay}
              disabled={!canConfirm || isConfirmPending || isConfirmLoading}
              className="w-full"
              size="lg"
            >
              {isConfirmPending || isConfirmLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm My Arrival
                </>
              )}
            </Button>
          </div>
        )}

        {/* Host: Auto-Release Info */}
        {!isTraveler && (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="flex items-center gap-2 font-medium">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Release Payment
                </h4>
                <p className="text-muted-foreground text-sm">
                  Guest didn't confirm on {checkInDate.toLocaleDateString()}
                </p>
              </div>
              <Badge variant="default" className="bg-blue-500">
                Available
              </Badge>
            </div>

            <Button
              onClick={handleAutoRelease}
              disabled={!canAutoRelease || isAutoReleasePending || isAutoReleaseLoading}
              className="w-full"
              size="lg"
            >
              {isAutoReleasePending || isAutoReleaseLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Guest Arrival & Release Payment
                </>
              )}
            </Button>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The guest did not confirm their arrival. As the host, you can now release the
                payment to yourself.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Timeline visualization */}
        <div className="border-t pt-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Check-in date:</span>
              <span className="font-medium">{checkInDate.toLocaleDateString()}</span>
            </div>
            {isTraveler && timeUntilTravelerWindow > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Window opens:</span>
                <span className="font-medium text-yellow-600">
                  {formatTimeRemaining(timeUntilTravelerWindow)}
                </span>
              </div>
            )}
            {isTraveler && timeUntilTravelerDeadline > 0 && timeUntilTravelerWindow === 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Time to confirm:</span>
                <span className="font-medium text-green-600">
                  {formatTimeRemaining(timeUntilTravelerDeadline)}
                </span>
              </div>
            )}
            {!isTraveler && timeUntilHostWindow > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Can release:</span>
                <span className="font-medium text-blue-600">
                  {formatTimeRemaining(timeUntilHostWindow)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Traveler window:</span>
              <span className="font-medium">00:00 - 23:59 UTC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Host can release:</span>
              <span className="font-medium">After 23:59 UTC</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
