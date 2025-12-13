"use client";

import { Progress } from "@/components/ui/progress";
import { PROGRESS_STEPS } from "../constants";
import type { StatusConfig } from "../types";
import type { PonderBooking } from "@/hooks/usePonderBookings";

interface StatusCardProps {
  status: StatusConfig;
  bookingStatus: PonderBooking["status"];
}

/**
 * Status card with progress timeline
 */
export function StatusCard({ status, bookingStatus }: StatusCardProps) {
  const StatusIcon = status.icon;
  const currentStep = bookingStatus === "Cancelled" ? 0 : status.step;

  return (
    <div className={`rounded-lg border p-4 ${status.bgColor}`}>
      <div className="flex items-start gap-3">
        <StatusIcon className={`mt-0.5 h-5 w-5 ${status.color}`} />
        <div className="flex-1">
          <p className={`font-medium ${status.color}`}>{status.label}</p>
          <p className="text-muted-foreground mt-1 text-sm">{status.description}</p>
        </div>
      </div>

      {/* Progress Timeline */}
      {bookingStatus !== "Cancelled" && (
        <div className="mt-4">
          <div className="text-muted-foreground mb-2 flex justify-between text-xs">
            {PROGRESS_STEPS.map((step, i) => (
              <span key={step} className={i + 1 <= currentStep ? "text-primary font-medium" : ""}>
                {step}
              </span>
            ))}
          </div>
          <Progress value={(currentStep / 4) * 100} className="h-2" />
        </div>
      )}
    </div>
  );
}
