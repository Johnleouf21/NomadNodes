"use client";

import * as React from "react";
import { Clock, CheckCircle2, AlertCircle, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";

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
  {
    inputs: [],
    name: "GUEST_GRACE_PERIOD",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "AUTO_RELEASE_DELAY",
    outputs: [{ type: "uint256", name: "" }],
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

  const { data: gracePeriod } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "GUEST_GRACE_PERIOD",
  });

  const { data: autoReleaseDelay } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "AUTO_RELEASE_DELAY",
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
  const gracePeriodMs = Number(gracePeriod || 4 * 60 * 60) * 1000; // 4h default
  const autoReleaseDelayMs = Number(autoReleaseDelay || 12 * 60 * 60) * 1000; // 12h default

  const confirmAvailableAt = checkInMs + gracePeriodMs;
  const autoReleaseAvailableAt = checkInMs + autoReleaseDelayMs;

  const canConfirm = now >= confirmAvailableAt && escrowStatus === 0; // Status.Pending = 0
  const canAutoRelease = now >= autoReleaseAvailableAt && escrowStatus === 0;

  const timeUntilConfirm = Math.max(0, confirmAvailableAt - now);
  const timeUntilAutoRelease = Math.max(0, autoReleaseAvailableAt - now);

  // Success effects
  React.useEffect(() => {
    if (isConfirmSuccess) {
      toast.success("Stay confirmed! Funds released to host.");
      onSuccess?.();
    }
  }, [isConfirmSuccess, onSuccess]);

  React.useEffect(() => {
    if (isAutoReleaseSuccess) {
      toast.success("Funds automatically released to host.");
      onSuccess?.();
    }
  }, [isAutoReleaseSuccess, onSuccess]);

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

  // Don't show before check-in date
  if (now < checkInMs) {
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
                  Available 4h after check-in ({new Date(confirmAvailableAt).toLocaleString()})
                </p>
              </div>
              {canConfirm ? (
                <Badge variant="default" className="bg-green-500">
                  Available
                </Badge>
              ) : (
                <Badge variant="outline">{formatTimeRemaining(timeUntilConfirm)}</Badge>
              )}
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

            {!canConfirm && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  You can confirm your stay {formatTimeRemaining(timeUntilConfirm)}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Host: Auto-Release Info */}
        {!isTraveler && (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="flex items-center gap-2 font-medium">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Auto-Release Payment
                </h4>
                <p className="text-muted-foreground text-sm">
                  Available 12h after check-in ({new Date(autoReleaseAvailableAt).toLocaleString()})
                </p>
              </div>
              {canAutoRelease ? (
                <Badge variant="default" className="bg-blue-500">
                  Available
                </Badge>
              ) : (
                <Badge variant="outline">{formatTimeRemaining(timeUntilAutoRelease)}</Badge>
              )}
            </div>

            {canAutoRelease && (
              <Button
                onClick={handleAutoRelease}
                disabled={isAutoReleasePending || isAutoReleaseLoading}
                className="w-full"
                variant="outline"
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
                    Release Payment
                  </>
                )}
              </Button>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {canAutoRelease
                  ? "Guest hasn't confirmed their stay. You can now release the payment yourself."
                  : `Payment will auto-release ${formatTimeRemaining(timeUntilAutoRelease)} if guest doesn't confirm.`}
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
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Traveler can confirm:</span>
              <span className="font-medium">+4h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Auto-release available:</span>
              <span className="font-medium">+12h</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
