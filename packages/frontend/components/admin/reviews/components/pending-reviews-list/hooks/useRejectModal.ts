"use client";

/**
 * Hook to manage the reject modal state
 */

import * as React from "react";
import { toast } from "sonner";
import { useRejectReview, type PendingReviewData } from "@/lib/hooks/contracts/adminReviews";

interface UseRejectModalProps {
  onRefresh: () => void;
}

/**
 * Manage reject modal state and logic
 */
export function useRejectModal({ onRefresh }: UseRejectModalProps) {
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [rejectingReview, setRejectingReview] = React.useState<PendingReviewData | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  const {
    rejectReview,
    isPending: isRejecting,
    isSuccess: rejectSuccess,
    reset: resetReject,
  } = useRejectReview();

  React.useEffect(() => {
    if (rejectSuccess) {
      toast.success("Review rejected");
      setRejectModalOpen(false);
      setRejectingReview(null);
      setRejectReason("");
      resetReject();
      onRefresh();
    }
  }, [rejectSuccess, resetReject, onRefresh]);

  const openRejectModal = React.useCallback((review: PendingReviewData) => {
    setRejectingReview(review);
    setRejectModalOpen(true);
  }, []);

  const handleReject = React.useCallback(() => {
    if (rejectingReview) {
      rejectReview(rejectingReview.reviewId, rejectReason);
    }
  }, [rejectingReview, rejectReason, rejectReview]);

  return {
    rejectModalOpen,
    setRejectModalOpen,
    rejectingReview,
    rejectReason,
    setRejectReason,
    isRejecting,
    openRejectModal,
    handleReject,
  };
}
