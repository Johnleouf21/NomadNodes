"use client";

import { Layers, Loader2, CheckCircle2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatUnits } from "viem";
import type { BatchWithdrawState } from "../types";
import type { PonderBooking } from "@/hooks/usePonderBookings";

interface BatchWithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchWithdraw: BatchWithdrawState;
  batchTotalAmount: bigint;
  isBatchWithdrawPending: boolean;
  isBatchWithdrawLoading: boolean;
  onCancel: () => void;
  onClose: () => void;
  getPropertyInfo: (booking: PonderBooking) => { name: string };
}

export function BatchWithdrawalModal({
  open,
  onOpenChange,
  batchWithdraw,
  batchTotalAmount,
  isBatchWithdrawPending,
  isBatchWithdrawLoading,
  onCancel,
  onClose,
  getPropertyInfo,
}: BatchWithdrawalModalProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && batchWithdraw.status === "done") {
      onClose();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Batch Withdrawal
          </DialogTitle>
          <DialogDescription>
            {batchWithdraw.status === "done"
              ? "Batch withdrawal complete!"
              : `Withdrawing from ${batchWithdraw.escrows.length} escrow${batchWithdraw.escrows.length > 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total Amount */}
          <div className="rounded-lg bg-green-500/10 p-4 text-center">
            <p className="text-muted-foreground text-sm">Total Amount</p>
            <p className="text-2xl font-bold text-green-600">
              ${Number(formatUnits(batchTotalAmount, 6)).toFixed(2)}
            </p>
          </div>

          {/* Progress */}
          {batchWithdraw.isActive && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {batchWithdraw.completed.length + batchWithdraw.failed.length} /{" "}
                  {batchWithdraw.escrows.length}
                </span>
              </div>
              <Progress
                value={
                  ((batchWithdraw.completed.length + batchWithdraw.failed.length) /
                    batchWithdraw.escrows.length) *
                  100
                }
                className="h-2"
              />
            </div>
          )}

          {/* Current Transaction */}
          {batchWithdraw.isActive &&
            batchWithdraw.status !== "done" &&
            batchWithdraw.currentIndex < batchWithdraw.escrows.length && (
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  {(isBatchWithdrawPending || isBatchWithdrawLoading) && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {
                        getPropertyInfo(batchWithdraw.escrows[batchWithdraw.currentIndex].booking)
                          .name
                      }
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {isBatchWithdrawPending
                        ? "Waiting for confirmation..."
                        : "Processing transaction..."}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {batchWithdraw.currentIndex + 1} of {batchWithdraw.escrows.length}
                  </Badge>
                </div>
              </div>
            )}

          {/* Completed List */}
          {(batchWithdraw.completed.length > 0 || batchWithdraw.failed.length > 0) && (
            <div className="max-h-[200px] space-y-2 overflow-y-auto">
              {batchWithdraw.escrows.map((escrow, index) => {
                const isCompleted = batchWithdraw.completed.includes(escrow.escrowAddress);
                const isFailed = batchWithdraw.failed.includes(escrow.escrowAddress);
                const isPending = index === batchWithdraw.currentIndex && !isCompleted && !isFailed;
                const isWaiting = index > batchWithdraw.currentIndex;

                if (isWaiting) return null;

                const { name: propertyName } = getPropertyInfo(escrow.booking);
                const hostAmount =
                  escrow.amount && escrow.platformFee
                    ? escrow.amount - escrow.platformFee
                    : BigInt(0);

                return (
                  <div
                    key={escrow.escrowAddress}
                    className={`flex items-center justify-between rounded-lg p-2 text-sm ${
                      isCompleted
                        ? "bg-green-500/10"
                        : isFailed
                          ? "bg-red-500/10"
                          : "bg-blue-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {isFailed && <X className="h-4 w-4 text-red-500" />}
                      {isPending && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                      <span
                        className={isCompleted ? "text-green-700" : isFailed ? "text-red-700" : ""}
                      >
                        {propertyName}
                      </span>
                    </div>
                    <span
                      className={`font-medium ${isCompleted ? "text-green-600" : isFailed ? "text-red-600" : ""}`}
                    >
                      ${Number(formatUnits(hostAmount, 6)).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary when done */}
          {batchWithdraw.status === "done" && (
            <div className="grid grid-cols-2 gap-4 rounded-lg border p-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {batchWithdraw.completed.length}
                </p>
                <p className="text-muted-foreground text-xs">Successful</p>
              </div>
              {batchWithdraw.failed.length > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{batchWithdraw.failed.length}</p>
                  <p className="text-muted-foreground text-xs">Failed</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {batchWithdraw.status === "done" ? (
              <Button onClick={onClose} className="w-full">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Done
              </Button>
            ) : (
              <Button
                onClick={onCancel}
                variant="outline"
                className="w-full"
                disabled={isBatchWithdrawLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>

          {/* Info */}
          {batchWithdraw.status !== "done" && (
            <p className="text-muted-foreground text-center text-xs">
              Please confirm each transaction in your wallet. Do not close this window.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
