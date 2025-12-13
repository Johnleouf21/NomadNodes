"use client";

/**
 * Modal for Flag & Publish flow
 */

import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { PendingReviewData } from "@/lib/hooks/contracts/adminReviews";
import type { FlagPublishStep } from "../../../types";
import { RatingStars } from "../../RatingStars";
import { ReviewCommentDisplay } from "../../ReviewCommentDisplay";

interface FlagPublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: PendingReviewData | null;
  reason: string;
  onReasonChange: (reason: string) => void;
  step: FlagPublishStep;
  onStart: () => void;
  onClose: () => void;
  isApproving: boolean;
  isPublishing: boolean;
  isFlagging: boolean;
}

/**
 * Dialog for Flag & Publish multi-step flow
 */
export function FlagPublishModal({
  open,
  onOpenChange,
  review,
  reason,
  onReasonChange,
  step,
  onStart,
  onClose,
  isApproving,
  isPublishing,
  isFlagging,
}: FlagPublishModalProps) {
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && step === "idle") {
      onClose();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-orange-500" />
            Flag & Publish Review
          </DialogTitle>
          <DialogDescription>
            This will publish the review AND immediately flag it as inappropriate. The review will
            be visible on-chain with a flag, exposing the user&apos;s behavior.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {review && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="mb-2 flex items-center gap-2">
                <RatingStars rating={review.rating} />
                <span className="text-muted-foreground">
                  by {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                </span>
              </div>
              <ReviewCommentDisplay ipfsHash={review.ipfsCommentHash} />
            </div>
          )}
          <div>
            <Label htmlFor="flag-reason">Flag Reason</Label>
            <Textarea
              id="flag-reason"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="e.g., hate_speech, harassment, spam, fake_review, inappropriate_content"
              className="mt-2"
              disabled={step !== "idle"}
            />
          </div>
          {step !== "idle" && step !== "done" && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {step === "approving" && "Step 1/3: Approving review..."}
                {step === "publishing" && "Step 2/3: Publishing review..."}
                {step === "flagging" && "Step 3/3: Flagging review..."}
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={step !== "idle"}>
            Cancel
          </Button>
          <Button
            variant="default"
            className="bg-orange-500 hover:bg-orange-600"
            onClick={onStart}
            disabled={
              step !== "idle" || !reason.trim() || isApproving || isPublishing || isFlagging
            }
          >
            <Flag className="mr-2 h-4 w-4" />
            Flag & Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
