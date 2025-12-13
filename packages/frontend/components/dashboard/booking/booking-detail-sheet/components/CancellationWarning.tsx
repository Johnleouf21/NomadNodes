"use client";

import { AlertTriangle } from "lucide-react";

interface CancellationWarningProps {
  daysUntilCheckIn: number;
}

/**
 * Cancellation policy warning
 */
export function CancellationWarning({ daysUntilCheckIn }: CancellationWarningProps) {
  const getRefundMessage = () => {
    if (daysUntilCheckIn > 30) {
      return "Full refund if cancelled now (100%)";
    }
    if (daysUntilCheckIn >= 14) {
      return "Partial refund if cancelled now (50%)";
    }
    return "No refund available at this time (0%)";
  };

  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
        <div>
          <p className="font-medium text-yellow-700 dark:text-yellow-400">Cancellation Policy</p>
          <p className="text-muted-foreground mt-1 text-sm">{getRefundMessage()}</p>
        </div>
      </div>
    </div>
  );
}
