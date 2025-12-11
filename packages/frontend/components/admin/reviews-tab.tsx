"use client";

import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Loader2,
  User,
  Home,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Flag,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  MessageSquare,
  Quote,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useApproveReview,
  useRejectReview,
  usePublishReview,
  useBatchApprove,
  useBatchPublish,
  useGetReviewsByStatus,
  ReviewStatus,
  type PendingReviewData,
} from "@/lib/hooks/contracts/useAdminReviews";
import {
  usePonderReviews,
  useFlaggedReviews,
  type PonderReview,
} from "@/lib/hooks/contracts/useAdminPlatform";
import { fetchFromIPFS, type ReviewComment } from "@/lib/utils/ipfs";

interface ReviewModerationTabProps {
  reviews: PendingReviewData[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

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

// ===== Pending Reviews List =====

function PendingReviewsList({
  reviews,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onRefresh,
}: {
  reviews: PendingReviewData[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}) {
  const [selectedReviews, setSelectedReviews] = React.useState<Set<bigint>>(new Set());
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [rejectingReview, setRejectingReview] = React.useState<PendingReviewData | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

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

  React.useEffect(() => {
    if (approveSuccess) {
      toast.success("Review approved");
      resetApprove();
      onRefresh();
    }
  }, [approveSuccess, resetApprove, onRefresh]);

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

  React.useEffect(() => {
    if (publishSuccess) {
      toast.success("Review published");
      resetPublish();
      onRefresh();
    }
  }, [publishSuccess, resetPublish, onRefresh]);

  React.useEffect(() => {
    if (batchApproveSuccess) {
      toast.success("Reviews approved");
      setSelectedReviews(new Set());
      resetBatchApprove();
      onRefresh();
    }
  }, [batchApproveSuccess, resetBatchApprove, onRefresh]);

  React.useEffect(() => {
    if (batchPublishSuccess) {
      toast.success("Reviews published");
      setSelectedReviews(new Set());
      resetBatchPublish();
      onRefresh();
    }
  }, [batchPublishSuccess, resetBatchPublish, onRefresh]);

  const toggleSelection = (id: bigint) => {
    const s = new Set(selectedReviews);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedReviews(s);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center">
          <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
          <p className="text-xl font-semibold">All Caught Up!</p>
          <p className="text-muted-foreground">No pending reviews to moderate.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {selectedReviews.size > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <span className="text-sm">{selectedReviews.size} selected</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => batchApprove(Array.from(selectedReviews))}
                disabled={isBatchApproving}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve All
              </Button>
              <Button
                size="sm"
                onClick={() => batchPublish(Array.from(selectedReviews))}
                disabled={isBatchPublishing}
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Publish All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card
            key={review.reviewId.toString()}
            className={selectedReviews.has(review.reviewId) ? "ring-primary ring-2" : ""}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedReviews.has(review.reviewId)}
                    onChange={() => toggleSelection(review.reviewId)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <RatingStars rating={review.rating} />
                      <Badge
                        variant={review.status === ReviewStatus.Pending ? "secondary" : "outline"}
                      >
                        {review.status === ReviewStatus.Pending ? "Pending" : "Approved"}
                      </Badge>
                      <Badge variant="outline">
                        {review.travelerToHost ? "Traveler → Host" : "Host → Traveler"}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground grid gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          Reviewer: {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          Reviewee: {review.reviewee.slice(0, 6)}...{review.reviewee.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        <span>Property #{review.propertyId.toString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(Number(review.submittedAt) * 1000).toLocaleString()}</span>
                      </div>
                    </div>
                    {/* Review Comment */}
                    <ReviewCommentDisplay ipfsHash={review.ipfsCommentHash} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {review.status === ReviewStatus.Pending && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveReview(review.reviewId)}
                        disabled={isApproving}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRejectingReview(review);
                          setRejectModalOpen(true);
                        }}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {review.status === ReviewStatus.Approved && (
                    <Button
                      size="sm"
                      onClick={() => publishReview(review.reviewId)}
                      disabled={isPublishing}
                    >
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                      Publish
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Review</DialogTitle>
            <DialogDescription>Provide a reason for rejection.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectingReview) rejectReview(rejectingReview.reviewId, rejectReason);
              }}
              disabled={isRejecting || !rejectReason.trim()}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Approved Reviews List (ready to publish) =====

function ApprovedReviewsList({
  reviews,
  isLoading,
  onRefresh,
}: {
  reviews: PendingReviewData[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const [selectedReviews, setSelectedReviews] = React.useState<Set<bigint>>(new Set());

  const {
    publishReview,
    isPending: isPublishing,
    isSuccess: publishSuccess,
    reset: resetPublish,
  } = usePublishReview();
  const {
    batchPublish,
    isPending: isBatchPublishing,
    isSuccess: batchPublishSuccess,
    reset: resetBatchPublish,
  } = useBatchPublish();

  React.useEffect(() => {
    if (publishSuccess) {
      toast.success("Review published");
      resetPublish();
      onRefresh();
    }
  }, [publishSuccess, resetPublish, onRefresh]);

  React.useEffect(() => {
    if (batchPublishSuccess) {
      toast.success("Reviews published");
      setSelectedReviews(new Set());
      resetBatchPublish();
      onRefresh();
    }
  }, [batchPublishSuccess, resetBatchPublish, onRefresh]);

  const toggleSelection = (id: bigint) => {
    const s = new Set(selectedReviews);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedReviews(s);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center">
          <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
          <p className="text-xl font-semibold">No Approved Reviews</p>
          <p className="text-muted-foreground">
            Approved reviews ready for publishing will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {selectedReviews.size > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <span className="text-sm">{selectedReviews.size} selected</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => batchPublish(Array.from(selectedReviews))}
                disabled={isBatchPublishing}
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Publish All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            Ready to Publish
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card
            key={review.reviewId.toString()}
            className={`border-green-300 ${selectedReviews.has(review.reviewId) ? "ring-primary ring-2" : ""}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedReviews.has(review.reviewId)}
                    onChange={() => toggleSelection(review.reviewId)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <RatingStars rating={review.rating} />
                      <Badge variant="default" className="bg-green-500">
                        Approved
                      </Badge>
                      <Badge variant="outline">
                        {review.travelerToHost ? "Traveler → Host" : "Host → Traveler"}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground grid gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          Reviewer: {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          Reviewee: {review.reviewee.slice(0, 6)}...{review.reviewee.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        <span>Property #{review.propertyId.toString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(Number(review.submittedAt) * 1000).toLocaleString()}</span>
                      </div>
                    </div>
                    {/* Review Comment */}
                    <ReviewCommentDisplay ipfsHash={review.ipfsCommentHash} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => publishReview(review.reviewId)}
                    disabled={isPublishing}
                  >
                    <ArrowUpRight className="mr-1 h-4 w-4" />
                    Publish
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ===== Published Reviews List (from Ponder) =====

function PublishedReviewsList({
  reviews,
  isLoading,
}: {
  reviews: PonderReview[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center">
          <Star className="text-muted-foreground mb-4 h-16 w-16" />
          <p className="text-xl font-semibold">No Published Reviews</p>
          <p className="text-muted-foreground">Published reviews will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className={review.isFlagged ? "border-red-500" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <RatingStars rating={review.rating} />
                  <Badge variant="default">Published</Badge>
                  {review.isFlagged && (
                    <Badge variant="destructive">
                      <Flag className="mr-1 h-3 w-3" />
                      Flagged
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground grid gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      Reviewer: {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      Reviewee: {review.reviewee.slice(0, 6)}...{review.reviewee.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>Property #{review.propertyId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(Number(review.createdAt) * 1000).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{review.helpfulVotes}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <ThumbsDown className="h-4 w-4" />
                    <span>{review.unhelpfulVotes}</span>
                  </div>
                </div>
                <span className="text-muted-foreground text-xs">Review #{review.reviewId}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ===== Flagged Reviews List =====

function FlaggedReviewsList({
  reviews,
  isLoading,
}: {
  reviews: PonderReview[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center">
          <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
          <p className="text-xl font-semibold">No Flagged Reviews</p>
          <p className="text-muted-foreground">All reviews are in good standing.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Flag className="h-5 w-5" />
            Flagged Reviews Require Attention
          </CardTitle>
        </CardHeader>
      </Card>

      {reviews.map((review) => (
        <Card key={review.id} className="border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <RatingStars rating={review.rating} />
                  <Badge variant="destructive">
                    <Flag className="mr-1 h-3 w-3" />
                    Flagged
                  </Badge>
                </div>
                <div className="text-muted-foreground grid gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      Reviewer: {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      Reviewee: {review.reviewee.slice(0, 6)}...{review.reviewee.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>Property #{review.propertyId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(Number(review.createdAt) * 1000).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{review.helpfulVotes}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <ThumbsDown className="h-4 w-4" />
                    <span>{review.unhelpfulVotes}</span>
                  </div>
                </div>
                <span className="text-muted-foreground text-xs">Review #{review.reviewId}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ===== Shared Components =====

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

// Component to fetch and display review comment from IPFS
function ReviewCommentDisplay({ ipfsHash }: { ipfsHash: string }) {
  const [comment, setComment] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!ipfsHash || ipfsHash === "QmPlaceholder") {
      setIsLoading(false);
      setComment(null);
      return;
    }

    setIsLoading(true);
    setError(false);

    fetchFromIPFS<ReviewComment>(ipfsHash)
      .then((data) => {
        if (data?.comment) {
          setComment(data.comment);
        } else {
          setComment(null);
        }
      })
      .catch(() => {
        setError(true);
        setComment(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [ipfsHash]);

  if (!ipfsHash || ipfsHash === "QmPlaceholder") {
    return (
      <div className="bg-muted/50 mt-3 rounded-lg border p-3">
        <div className="flex items-start gap-2">
          <MessageSquare className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-muted-foreground text-sm italic">No comment provided</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-muted/50 mt-3 rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-muted-foreground text-sm">Loading comment...</span>
        </div>
      </div>
    );
  }

  if (error || !comment) {
    return (
      <div className="bg-muted/50 mt-3 rounded-lg border p-3">
        <div className="flex items-start gap-2">
          <MessageSquare className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-muted-foreground text-sm italic">Unable to load comment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 mt-3 rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <Quote className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-sm leading-relaxed">{comment}</p>
      </div>
    </div>
  );
}
