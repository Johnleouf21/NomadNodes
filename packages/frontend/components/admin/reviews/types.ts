import { type PendingReviewData } from "@/lib/hooks/contracts/adminReviews";

export interface ReviewModerationTabProps {
  reviews: PendingReviewData[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export interface PendingReviewsListProps {
  reviews: PendingReviewData[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export interface ApprovedReviewsListProps {
  reviews: PendingReviewData[];
  isLoading: boolean;
  onRefresh: () => void;
}

export type FlagPublishStep = "idle" | "approving" | "publishing" | "flagging" | "done";
