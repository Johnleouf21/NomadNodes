"use client";

import { CheckCircle2, LogIn, Clock, Home, MessageSquare, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionAvailability } from "../types";
import type { PonderBooking } from "@/hooks/usePonderBookings";

interface ActionButtonsProps {
  bookingStatus: PonderBooking["status"];
  actions: ActionAvailability;
  isActionPending: boolean;
  onConfirm?: () => void;
  onCheckIn?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  onReviewClick?: () => void;
  onViewProperty: () => void;
  onMessage: () => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * Action buttons section
 */
export function ActionButtons({
  bookingStatus,
  actions,
  isActionPending,
  onConfirm,
  onCheckIn,
  onComplete,
  onCancel,
  onReviewClick,
  onViewProperty,
  onMessage,
  onOpenChange,
}: ActionButtonsProps) {
  return (
    <div className="space-y-3">
      {/* Primary Action based on status */}
      {actions.canConfirm && onConfirm && (
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
          disabled={isActionPending}
        >
          {isActionPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          Confirm Booking
        </Button>
      )}

      {bookingStatus === "Confirmed" && onCheckIn && (
        <>
          {actions.canCheckIn ? (
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                onCheckIn();
                onOpenChange(false);
              }}
              disabled={isActionPending}
            >
              {isActionPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Mark as Checked In
            </Button>
          ) : (
            <Button className="w-full" variant="outline" disabled>
              <Clock className="mr-2 h-4 w-4" />
              {actions.checkInDisabledReason}
            </Button>
          )}
        </>
      )}

      {bookingStatus === "CheckedIn" && onComplete && (
        <>
          {actions.canComplete ? (
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => {
                onComplete();
                onOpenChange(false);
              }}
              disabled={isActionPending}
            >
              {isActionPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Complete & Release Payment
            </Button>
          ) : (
            <Button className="w-full" variant="outline" disabled>
              <Clock className="mr-2 h-4 w-4" />
              {actions.completeDisabledReason}
            </Button>
          )}
        </>
      )}

      {/* Secondary Actions */}
      <Button className="w-full" variant="outline" onClick={onViewProperty}>
        <Home className="mr-2 h-4 w-4" />
        View Property
      </Button>

      <Button className="w-full" variant="outline" onClick={onMessage}>
        <MessageSquare className="mr-2 h-4 w-4" />
        Message Guest
      </Button>

      {/* Review Button for Completed bookings */}
      {bookingStatus === "Completed" && onReviewClick && (
        <Button className="w-full" variant="outline" onClick={onReviewClick}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Review Guest
        </Button>
      )}

      {/* Cancel Button */}
      {actions.canCancel && onCancel && (
        <Button
          className="w-full"
          variant="destructive"
          onClick={() => {
            onCancel();
            onOpenChange(false);
          }}
          disabled={isActionPending}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Cancel Booking
        </Button>
      )}
    </div>
  );
}
