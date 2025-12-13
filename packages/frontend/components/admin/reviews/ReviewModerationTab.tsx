"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetReviewsByStatus, ReviewStatus } from "@/lib/hooks/contracts/adminReviews";
import { usePonderReviews, useFlaggedReviews } from "@/lib/hooks/contracts/useAdminPlatform";
import { PendingReviewsList } from "./components/PendingReviewsList";
import { ApprovedReviewsList } from "./components/ApprovedReviewsList";
import { PublishedReviewsList } from "./components/PublishedReviewsList";
import { FlaggedReviewsList } from "./components/FlaggedReviewsList";
import type { ReviewModerationTabProps } from "./types";

export function ReviewModerationTab({
  reviews,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onRefresh,
}: ReviewModerationTabProps) {
  const [activeSubTab, setActiveSubTab] = React.useState("pending");

  // Approved reviews from contract (waiting to be published)
  const {
    data: approvedReviews,
    isLoading: isLoadingApproved,
    refetch: refetchApproved,
  } = useGetReviewsByStatus(ReviewStatus.Approved);

  // Ponder data for published reviews
  const {
    data: publishedReviews,
    isLoading: isLoadingPublished,
    refetch: refetchPublished,
  } = usePonderReviews(100);
  const {
    data: flaggedReviews,
    isLoading: isLoadingFlagged,
    refetch: refetchFlagged,
  } = useFlaggedReviews();

  const handleRefreshAll = () => {
    onRefresh();
    refetchApproved();
    refetchPublished();
    refetchFlagged();
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pending Moderation
              {reviews.length > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500 px-1.5 text-xs font-bold text-white">
                  {reviews.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="relative">
              Approved
              {(approvedReviews?.length || 0) > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1.5 text-xs font-bold text-white">
                  {approvedReviews?.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="published">Published ({publishedReviews?.length || 0})</TabsTrigger>
            <TabsTrigger value="flagged" className="relative">
              Flagged
              {(flaggedReviews?.length || 0) > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {flaggedReviews?.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={handleRefreshAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <TabsContent value="pending">
          <PendingReviewsList
            reviews={reviews}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onRefresh={onRefresh}
          />
        </TabsContent>

        <TabsContent value="approved">
          <ApprovedReviewsList
            reviews={approvedReviews || []}
            isLoading={isLoadingApproved}
            onRefresh={() => {
              refetchApproved();
              refetchPublished();
            }}
          />
        </TabsContent>

        <TabsContent value="published">
          <PublishedReviewsList reviews={publishedReviews || []} isLoading={isLoadingPublished} />
        </TabsContent>

        <TabsContent value="flagged">
          <FlaggedReviewsList reviews={flaggedReviews || []} isLoading={isLoadingFlagged} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
