"use client";

/**
 * PendingReviewsList - Main component for moderating pending reviews
 *
 * Refactored from a 515-line file into modular components and hooks.
 */

import * as React from "react";
import type { PendingReviewsListProps } from "../../types";
import {
  LoadingState,
  EmptyState,
  SelectionBar,
  ReviewCard,
  Pagination,
  RejectModal,
  FlagPublishModal,
} from "./components";
import { useReviewActions, useFlagPublishFlow, useRejectModal } from "./hooks";

/**
 * List of pending reviews with moderation actions
 */
export function PendingReviewsList({
  reviews,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onRefresh,
}: PendingReviewsListProps) {
  const [selectedReviews, setSelectedReviews] = React.useState<Set<bigint>>(new Set());

  // Flag & Publish flow hook
  const {
    flagPublishModalOpen,
    setFlagPublishModalOpen,
    flaggingReview,
    flagReason,
    setFlagReason,
    flagPublishStep,
    isApproving: isFlagApproving,
    isPublishing: isFlagPublishing,
    isFlagging,
    startFlagAndPublish,
    openFlagModal,
    closeFlagModal,
  } = useFlagPublishFlow({ onRefresh });

  // Reject modal hook
  const {
    rejectModalOpen,
    setRejectModalOpen,
    rejectReason,
    setRejectReason,
    isRejecting,
    openRejectModal,
    handleReject,
  } = useRejectModal({ onRefresh });

  // Review actions hook
  const {
    approveReview,
    isApproving,
    publishReview,
    isPublishing,
    batchApprove,
    isBatchApproving,
    batchPublish,
    isBatchPublishing,
  } = useReviewActions({
    onRefresh,
    flagPublishStep,
    setSelectedReviews,
  });

  const toggleSelection = React.useCallback((id: bigint) => {
    setSelectedReviews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleBatchApprove = React.useCallback(() => {
    batchApprove(Array.from(selectedReviews));
  }, [batchApprove, selectedReviews]);

  const handleBatchPublish = React.useCallback(() => {
    batchPublish(Array.from(selectedReviews));
  }, [batchPublish, selectedReviews]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (reviews.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <SelectionBar
        selectedCount={selectedReviews.size}
        onBatchApprove={handleBatchApprove}
        onBatchPublish={handleBatchPublish}
        isBatchApproving={isBatchApproving}
        isBatchPublishing={isBatchPublishing}
      />

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.reviewId.toString()}
            review={review}
            isSelected={selectedReviews.has(review.reviewId)}
            onToggleSelection={toggleSelection}
            onApprove={approveReview}
            onReject={openRejectModal}
            onPublish={publishReview}
            onFlagAndPublish={openFlagModal}
            isApproving={isApproving}
            isPublishing={isPublishing}
          />
        ))}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />

      <RejectModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onReject={handleReject}
        isRejecting={isRejecting}
      />

      <FlagPublishModal
        open={flagPublishModalOpen}
        onOpenChange={setFlagPublishModalOpen}
        review={flaggingReview}
        reason={flagReason}
        onReasonChange={setFlagReason}
        step={flagPublishStep}
        onStart={startFlagAndPublish}
        onClose={closeFlagModal}
        isApproving={isFlagApproving}
        isPublishing={isFlagPublishing}
        isFlagging={isFlagging}
      />
    </div>
  );
}
