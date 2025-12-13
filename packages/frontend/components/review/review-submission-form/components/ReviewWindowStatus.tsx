"use client";

import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ReviewWindowInfo } from "../types";
import { getReviewWindowDays } from "../utils";

interface ReviewWindowStatusProps {
  reviewWindowInfo: ReviewWindowInfo;
}

/**
 * Displays review window status alerts
 */
export function ReviewWindowStatus({ reviewWindowInfo }: ReviewWindowStatusProps) {
  if (reviewWindowInfo.isTooEarly) {
    return (
      <Alert variant="default" className="border-yellow-500/30 bg-yellow-500/5">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-700">
          Reviews can only be submitted after checkout.
        </AlertDescription>
      </Alert>
    );
  }

  if (reviewWindowInfo.isExpired) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          The review window has expired. Reviews must be submitted within {getReviewWindowDays()}{" "}
          days of checkout.
        </AlertDescription>
      </Alert>
    );
  }

  if (reviewWindowInfo.isOpen) {
    return (
      <Alert className="border-green-500/30 bg-green-500/5">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          {reviewWindowInfo.isDevMode ? (
            <span className="font-medium text-orange-600">
              DEV MODE: Review bypass active (checkout not required)
            </span>
          ) : (
            `${reviewWindowInfo.daysLeft} days left to submit your review`
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
