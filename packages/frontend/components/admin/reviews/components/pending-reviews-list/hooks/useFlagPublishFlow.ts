"use client";

/**
 * Hook to manage the Flag & Publish multi-step flow
 */

import * as React from "react";
import { toast } from "sonner";
import {
  useApproveReview,
  usePublishReview,
  useFlagReview,
  ReviewStatus,
  type PendingReviewData,
} from "@/lib/hooks/contracts/adminReviews";
import type { FlagPublishStep } from "../../../types";

interface UseFlagPublishFlowProps {
  onRefresh: () => void;
}

/**
 * Manage the Flag & Publish multi-step flow
 */
export function useFlagPublishFlow({ onRefresh }: UseFlagPublishFlowProps) {
  const [flagPublishModalOpen, setFlagPublishModalOpen] = React.useState(false);
  const [flaggingReview, setFlaggingReview] = React.useState<PendingReviewData | null>(null);
  const [flagReason, setFlagReason] = React.useState("");
  const [flagPublishStep, setFlagPublishStep] = React.useState<FlagPublishStep>("idle");

  const {
    approveReview,
    isPending: isApproving,
    isSuccess: approveSuccess,
    reset: resetApprove,
  } = useApproveReview();

  const {
    publishReview,
    isPending: isPublishing,
    isSuccess: publishSuccess,
    reset: resetPublish,
  } = usePublishReview();

  const {
    flagReview,
    isPending: isFlagging,
    isSuccess: flagSuccess,
    reset: resetFlag,
  } = useFlagReview();

  // Flag & Publish flow: Step 1 - After approve, publish
  React.useEffect(() => {
    if (approveSuccess && flagPublishStep === "approving" && flaggingReview) {
      resetApprove();
      setFlagPublishStep("publishing");
      publishReview(flaggingReview.reviewId);
    }
  }, [approveSuccess, flagPublishStep, flaggingReview, resetApprove, publishReview]);

  // Flag & Publish flow: Step 2 - After publish, flag
  React.useEffect(() => {
    if (publishSuccess && flagPublishStep === "publishing" && flaggingReview && flagReason) {
      resetPublish();
      setFlagPublishStep("flagging");
      flagReview(flaggingReview.reviewId, flagReason);
    }
  }, [publishSuccess, flagPublishStep, flaggingReview, flagReason, resetPublish, flagReview]);

  // Flag & Publish flow: Step 3 - After flag, done
  React.useEffect(() => {
    if (flagSuccess && flagPublishStep === "flagging") {
      toast.success("Review published and flagged for inappropriate content");
      resetFlag();
      setFlagPublishStep("done");
      setFlagPublishModalOpen(false);
      setFlaggingReview(null);
      setFlagReason("");
      onRefresh();
      setTimeout(() => setFlagPublishStep("idle"), 100);
    }
  }, [flagSuccess, flagPublishStep, resetFlag, onRefresh]);

  // Start Flag & Publish process
  const startFlagAndPublish = React.useCallback(() => {
    if (!flaggingReview || !flagReason.trim()) return;

    if (flaggingReview.status === ReviewStatus.Pending) {
      setFlagPublishStep("approving");
      approveReview(flaggingReview.reviewId);
    } else if (flaggingReview.status === ReviewStatus.Approved) {
      setFlagPublishStep("publishing");
      publishReview(flaggingReview.reviewId);
    }
  }, [flaggingReview, flagReason, approveReview, publishReview]);

  const openFlagModal = React.useCallback((review: PendingReviewData) => {
    setFlaggingReview(review);
    setFlagPublishModalOpen(true);
  }, []);

  const closeFlagModal = React.useCallback(() => {
    if (flagPublishStep === "idle") {
      setFlagPublishModalOpen(false);
      setFlaggingReview(null);
      setFlagReason("");
    }
  }, [flagPublishStep]);

  return {
    // Modal state
    flagPublishModalOpen,
    setFlagPublishModalOpen,
    flaggingReview,
    flagReason,
    setFlagReason,
    flagPublishStep,

    // Loading states
    isApproving,
    isPublishing,
    isFlagging,

    // Actions
    startFlagAndPublish,
    openFlagModal,
    closeFlagModal,
  };
}
