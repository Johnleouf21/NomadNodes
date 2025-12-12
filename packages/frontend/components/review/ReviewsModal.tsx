"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  MessageSquare,
  Loader2,
  Quote,
  User,
  ArrowUpDown,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { fetchFromIPFS, type ReviewComment } from "@/lib/utils/ipfs";

interface Review {
  id: string;
  reviewId: string;
  propertyId: string;
  reviewer: string;
  reviewee: string;
  rating: number;
  helpfulVotes: string | number;
  unhelpfulVotes: string | number;
  isFlagged: boolean;
  createdAt: string;
}

interface ReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewsReceived: Review[];
  reviewsGiven: Review[];
  averageRating?: number;
  totalReviews?: number;
  isLoading?: boolean;
}

type SortOption = "newest" | "oldest" | "highest" | "lowest";
type FilterOption = "all" | "5" | "4" | "3" | "2" | "1";

export function ReviewsModal({
  open,
  onOpenChange,
  reviewsReceived,
  reviewsGiven,
  averageRating: _averageRating = 0,
  totalReviews: _totalReviews = 0,
  isLoading = false,
}: ReviewsModalProps) {
  const [activeTab, setActiveTab] = React.useState<"received" | "given">("received");
  const [sortBy, setSortBy] = React.useState<SortOption>("newest");
  const [filterRating, setFilterRating] = React.useState<FilterOption>("all");
  const [showFlaggedReviews, setShowFlaggedReviews] = React.useState(false);

  // Separate flagged and non-flagged reviews
  const { nonFlaggedReceived, flaggedReceived, nonFlaggedGiven, flaggedGiven } =
    React.useMemo(() => {
      return {
        nonFlaggedReceived: reviewsReceived.filter((r) => !r.isFlagged),
        flaggedReceived: reviewsReceived.filter((r) => r.isFlagged),
        nonFlaggedGiven: reviewsGiven.filter((r) => !r.isFlagged),
        flaggedGiven: reviewsGiven.filter((r) => r.isFlagged),
      };
    }, [reviewsReceived, reviewsGiven]);

  // Calculate average rating EXCLUDING flagged reviews
  const averageRating = React.useMemo(() => {
    if (nonFlaggedReceived.length === 0) return 0;
    const sum = nonFlaggedReceived.reduce((acc, r) => acc + r.rating, 0);
    return sum / nonFlaggedReceived.length;
  }, [nonFlaggedReceived]);

  // Total reviews count EXCLUDING flagged
  const totalReviews = nonFlaggedReceived.length;

  // Get current reviews based on tab (excluding flagged by default)
  const currentReviews =
    activeTab === "received"
      ? showFlaggedReviews
        ? reviewsReceived
        : nonFlaggedReceived
      : showFlaggedReviews
        ? reviewsGiven
        : nonFlaggedGiven;

  const flaggedCount = activeTab === "received" ? flaggedReceived.length : flaggedGiven.length;

  // Filter reviews
  const filteredReviews = React.useMemo(() => {
    let reviews = [...currentReviews];

    // Apply rating filter
    if (filterRating !== "all") {
      reviews = reviews.filter((r) => r.rating === parseInt(filterRating));
    }

    // Apply sorting
    reviews.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return Number(b.createdAt) - Number(a.createdAt);
        case "oldest":
          return Number(a.createdAt) - Number(b.createdAt);
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return reviews;
  }, [currentReviews, sortBy, filterRating]);

  // Calculate rating distribution EXCLUDING flagged reviews
  const ratingDistribution = React.useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    nonFlaggedReceived.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating as keyof typeof dist]++;
      }
    });
    return dist;
  }, [nonFlaggedReceived]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "highest", label: "Highest rated" },
    { value: "lowest", label: "Lowest rated" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            Reviews
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and manage reviews received and given
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pt-4">
          {/* Rating Summary */}
          <div className="mb-6 flex items-start gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
              <div className="mt-1 flex items-center justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(averageRating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <div className="text-muted-foreground mt-1 text-sm">
                {totalReviews} review{totalReviews !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-1">
              {([5, 4, 3, 2, 1] as const).map((rating) => {
                const count = ratingDistribution[rating];
                const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <button
                    key={rating}
                    onClick={() =>
                      setFilterRating(
                        filterRating === rating.toString()
                          ? "all"
                          : (rating.toString() as FilterOption)
                      )
                    }
                    className={`hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-0.5 transition-colors ${
                      filterRating === rating.toString() ? "bg-muted" : ""
                    }`}
                  >
                    <span className="w-3 text-sm">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                      <div
                        className="h-full bg-yellow-500 transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-8 text-right text-xs">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "received" | "given")}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="mb-4 flex shrink-0 flex-col gap-3">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="received" className="gap-1">
                    Received
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {nonFlaggedReceived.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="given" className="gap-1">
                    Given
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {nonFlaggedGiven.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                {/* Sort & Filter */}
                <div className="flex items-center gap-2">
                  {filterRating !== "all" && (
                    <Badge
                      variant="outline"
                      className="cursor-pointer gap-1"
                      onClick={() => setFilterRating("all")}
                    >
                      {filterRating} stars
                      <span className="ml-1">×</span>
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <ArrowUpDown className="h-3 w-3" />
                        Sort
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {sortOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => setSortBy(option.value)}
                          className={sortBy === option.value ? "bg-muted" : ""}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Flagged Reviews Toggle */}
              {flaggedCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFlaggedReviews(!showFlaggedReviews)}
                  className={`w-full gap-2 ${showFlaggedReviews ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400" : ""}`}
                >
                  {showFlaggedReviews ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Hide {flaggedCount} flagged review{flaggedCount !== 1 ? "s" : ""}
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Show {flaggedCount} flagged review{flaggedCount !== 1 ? "s" : ""} (not
                      included in rating)
                    </>
                  )}
                </Button>
              )}
            </div>

            <ScrollArea className="h-[400px] pr-3">
              <TabsContent value="received" className="mt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <EmptyState
                    message={
                      filterRating !== "all"
                        ? `No ${filterRating}-star reviews`
                        : "No reviews received yet"
                    }
                  />
                ) : (
                  <div className="space-y-4 pb-6">
                    {filteredReviews.map((review) => (
                      <ReviewItem key={review.id} review={review} type="received" />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="given" className="mt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <EmptyState
                    message={
                      filterRating !== "all"
                        ? `No ${filterRating}-star reviews`
                        : "You haven't left any reviews yet"
                    }
                  />
                ) : (
                  <div className="space-y-4 pb-6">
                    {filteredReviews.map((review) => (
                      <ReviewItem key={review.id} review={review} type="given" />
                    ))}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MessageSquare className="text-muted-foreground/50 mb-4 h-12 w-12" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function ReviewItem({ review, type }: { review: Review; type: "received" | "given" }) {
  const formattedDate = new Date(Number(review.createdAt) * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`rounded-lg border p-4 ${review.isFlagged ? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20" : ""}`}
    >
      {/* Flagged Warning Banner */}
      {review.isFlagged && (
        <div className="mb-3 flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            This review was flagged for inappropriate content and is not included in the rating
            average.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${review.isFlagged ? "bg-red-200 dark:bg-red-900/50" : "bg-muted"}`}
          >
            {review.isFlagged ? (
              <Flag className="h-5 w-5 text-red-600 dark:text-red-400" />
            ) : (
              <User className="text-muted-foreground h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">
                {type === "received"
                  ? `${review.reviewer.slice(0, 6)}...${review.reviewer.slice(-4)}`
                  : `${review.reviewee.slice(0, 6)}...${review.reviewee.slice(-4)}`}
              </span>
              {review.isFlagged && (
                <Badge variant="destructive" className="text-xs">
                  Flagged
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground text-xs">{formattedDate}</div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= review.rating
                  ? review.isFlagged
                    ? "fill-red-400 text-red-400"
                    : "fill-yellow-500 text-yellow-500"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Comment */}
      <ReviewCommentDisplay reviewId={BigInt(review.reviewId)} />

      {/* Footer - Votes */}
      <div className="mt-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-green-600">
          <ThumbsUp className="h-3.5 w-3.5" />
          <span>{review.helpfulVotes}</span>
        </div>
        <div className="flex items-center gap-1 text-red-600">
          <ThumbsDown className="h-3.5 w-3.5" />
          <span>{review.unhelpfulVotes}</span>
        </div>
        <span className="text-muted-foreground ml-auto text-xs">Property #{review.propertyId}</span>
      </div>
    </div>
  );
}

// Type for the review struct from ReviewValidator
interface ReviewValidatorData {
  reviewId: bigint;
  escrowId: bigint;
  propertyId: bigint;
  bookingIndex: bigint;
  reviewer: string;
  reviewee: string;
  rating: number;
  ipfsCommentHash: string;
  submittedAt: bigint;
  status: number;
  moderationNote: string;
  moderator: string;
  travelerToHost: boolean;
}

// Component to fetch and display review comment
function ReviewCommentDisplay({ reviewId }: { reviewId: bigint }) {
  const [comment, setComment] = React.useState<string | null>(null);
  const [isLoadingComment, setIsLoadingComment] = React.useState(true);

  const { data: reviewData, isLoading: isContractLoading } = useReadContract({
    ...CONTRACTS.reviewValidator,
    functionName: "getReview",
    args: [reviewId],
  });

  React.useEffect(() => {
    const fetchComment = async () => {
      if (isContractLoading) return;

      if (!reviewData) {
        setIsLoadingComment(false);
        return;
      }

      const review = reviewData as unknown as ReviewValidatorData;
      const ipfsHash = review.ipfsCommentHash;

      if (!ipfsHash || ipfsHash === "QmPlaceholder" || ipfsHash === "") {
        setComment(null);
        setIsLoadingComment(false);
        return;
      }

      try {
        const data = await fetchFromIPFS<ReviewComment>(ipfsHash);
        if (data?.comment) {
          setComment(data.comment);
        } else {
          setComment(null);
        }
      } catch {
        setComment(null);
      } finally {
        setIsLoadingComment(false);
      }
    };

    fetchComment();
  }, [reviewData, isContractLoading]);

  if (isLoadingComment || isContractLoading) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
        <span className="text-muted-foreground text-xs">Loading comment...</span>
      </div>
    );
  }

  if (!comment) {
    return <div className="text-muted-foreground mt-3 text-sm italic">No comment provided</div>;
  }

  return (
    <div className="bg-muted/50 mt-3 flex items-start gap-2 rounded-md p-3">
      <Quote className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
      <p className="text-sm leading-relaxed">{comment}</p>
    </div>
  );
}
