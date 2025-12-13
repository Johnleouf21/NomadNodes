"use client";

/**
 * Cancellation warning display component
 */

import * as React from "react";
import { AlertTriangle } from "lucide-react";

interface CancellationWarningProps {
  refundPercent: number;
}

export function CancellationWarning({ refundPercent }: CancellationWarningProps) {
  if (refundPercent >= 100) return null;

  return (
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
  );
}
