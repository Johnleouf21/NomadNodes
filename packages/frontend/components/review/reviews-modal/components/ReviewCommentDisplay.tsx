"use client";

import * as React from "react";
import { Loader2, Quote } from "lucide-react";
import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { fetchFromIPFS, type ReviewComment } from "@/lib/utils/ipfs";
import type { ReviewValidatorData } from "../types";

interface ReviewCommentDisplayProps {
  reviewId: bigint;
}

/**
 * Component to fetch and display review comment from IPFS
 */
export function ReviewCommentDisplay({ reviewId }: ReviewCommentDisplayProps) {
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
