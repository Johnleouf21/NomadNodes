"use client";

import { Shield, Clock } from "lucide-react";
import type { StatusConfig } from "../types";

interface StatusInfoProps {
  statusConfig: StatusConfig;
  isUpcoming: boolean;
  daysUntilCheckIn: number;
}

/**
 * Booking status information display
 */
export function StatusInfo({ statusConfig, isUpcoming, daysUntilCheckIn }: StatusInfoProps) {
  return (
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
  );
}
