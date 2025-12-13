"use client";

import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EscrowStatusProps {
  foundEscrowId: bigint | null;
  isSearching: boolean;
  searchComplete: boolean;
  isCheckingReview: boolean;
  hasAlreadyReviewed: boolean | undefined;
}

/**
 * Displays escrow search and review status
 */
export function EscrowStatus({
  foundEscrowId,
  isSearching: _isSearching,
  searchComplete,
  isCheckingReview,
  hasAlreadyReviewed,
}: EscrowStatusProps) {
  // Searching for escrow
  if (foundEscrowId === null && !searchComplete) {
    return (
      <Alert variant="default">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>Finding booking details...</AlertDescription>
      </Alert>
    );
  }

  // Escrow not found
  if (foundEscrowId === null && searchComplete) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Could not find booking escrow. The booking may not have been properly registered.
        </AlertDescription>
      </Alert>
    );
  }

  // Checking if already reviewed
  if (foundEscrowId !== null && isCheckingReview) {
    return (
      <Alert variant="default">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>Checking review status...</AlertDescription>
      </Alert>
    );
  }

  // Already reviewed
  if (foundEscrowId !== null && !isCheckingReview && hasAlreadyReviewed) {
    return (
      <Alert className="border-blue-500/30 bg-blue-500/5">
        <CheckCircle2 className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          You have already submitted a review for this booking. Thank you for your feedback!
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
