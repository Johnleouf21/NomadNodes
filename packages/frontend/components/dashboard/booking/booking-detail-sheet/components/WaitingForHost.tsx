"use client";

import { Clock } from "lucide-react";

/**
 * Waiting for host confirmation message
 */
export function WaitingForHost() {
  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 h-5 w-5 text-yellow-600" />
        <div>
          <p className="font-medium text-yellow-700 dark:text-yellow-400">
            Waiting for Host Confirmation
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            The host needs to confirm your booking before you can check in. You'll be able to
            confirm your arrival once the booking is confirmed.
          </p>
        </div>
      </div>
    </div>
  );
}
