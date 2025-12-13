"use client";

/**
 * Hook to manage all review actions
 */

import * as React from "react";
import { toast } from "sonner";
import {
  useApproveReview,
  useRejectReview,
  usePublishReview,
  useBatchApprove,
  useBatchPublish,
} from "@/lib/hooks/contracts/adminReviews";

interface UseReviewActionsProps {
  onRefresh: () => void;
  flagPublishStep: string;
  setSelectedReviews: (reviews: Set<bigint>) => void;
}

/**
 * Combined hook for all review actions
 */
export function useReviewActions({
  onRefresh,
  flagPublishStep,
  setSelectedReviews,
}: UseReviewActionsProps) {
  const {
    approveReview,
    isPending: isApproving,
    isSuccess: approveSuccess,
    reset: resetApprove,
  } = useApproveReview();

  const {
    rejectReview,
    isPending: isRejecting,
    isSuccess: rejectSuccess,
    reset: resetReject,
  } = useRejectReview();

  const {
    publishReview,
    isPending: isPublishing,
    isSuccess: publishSuccess,
    reset: resetPublish,
  } = usePublishReview();

  const {
    batchApprove,
    isPending: isBatchApproving,
    isSuccess: batchApproveSuccess,
    reset: resetBatchApprove,
  } = useBatchApprove();

  const {
    batchPublish,
    isPending: isBatchPublishing,
    isSuccess: batchPublishSuccess,
    reset: resetBatchPublish,
  } = useBatchPublish();

  // Regular approve success (not part of Flag & Publish flow)
  React.useEffect(() => {
    if (approveSuccess && flagPublishStep === "idle") {
      toast.success("Review approved");
      resetApprove();
      onRefresh();
    }
  }, [approveSuccess, resetApprove, onRefresh, flagPublishStep]);

  // Regular publish success (not part of Flag & Publish flow)
  React.useEffect(() => {
    if (publishSuccess && flagPublishStep === "idle") {
      toast.success("Review published");
      resetPublish();
      onRefresh();
    }
  }, [publishSuccess, resetPublish, onRefresh, flagPublishStep]);

  React.useEffect(() => {
    if (batchApproveSuccess) {
      toast.success("Reviews approved");
      setSelectedReviews(new Set());
      resetBatchApprove();
      onRefresh();
    }
  }, [batchApproveSuccess, resetBatchApprove, onRefresh, setSelectedReviews]);

  React.useEffect(() => {
    if (batchPublishSuccess) {
      toast.success("Reviews published");
      setSelectedReviews(new Set());
      resetBatchPublish();
      onRefresh();
    }
  }, [batchPublishSuccess, resetBatchPublish, onRefresh, setSelectedReviews]);

  return {
    // Single actions
    approveReview,
    isApproving,
    approveSuccess,
    resetApprove,

    rejectReview,
    isRejecting,
    rejectSuccess,
    resetReject,

    publishReview,
    isPublishing,
    publishSuccess,
    resetPublish,

    // Batch actions
    batchApprove,
    isBatchApproving,
    batchPublish,
    isBatchPublishing,
  };
}
