"use client";

import { Home, MessageSquare, Edit3, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  canCancel: boolean;
  canReview: boolean;
  onViewProperty: () => void;
  onMessage: () => void;
  onReviewClick: () => void;
  onCancelClick: () => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * Action buttons for booking detail sheet
 */
export function ActionButtons({
  canCancel,
  canReview,
  onViewProperty,
  onMessage,
  onReviewClick,
  onCancelClick,
  onOpenChange,
}: ActionButtonsProps) {
  return (
    <div className="space-y-3">
      <Button className="w-full" variant="outline" onClick={onViewProperty}>
        <Home className="mr-2 h-4 w-4" />
        View Property
      </Button>

      <Button className="w-full" variant="outline" onClick={onMessage}>
        <MessageSquare className="mr-2 h-4 w-4" />
        Message Host
      </Button>

      {canReview && (
        <Button
          className="w-full"
          onClick={() => {
            onReviewClick();
            onOpenChange(false);
          }}
        >
          <Edit3 className="mr-2 h-4 w-4" />
          Leave a Review
        </Button>
      )}

      {canCancel && (
        <Button
          className="w-full"
          variant="destructive"
          onClick={() => {
            onCancelClick();
            onOpenChange(false);
          }}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Cancel Booking
        </Button>
      )}
    </div>
  );
}
