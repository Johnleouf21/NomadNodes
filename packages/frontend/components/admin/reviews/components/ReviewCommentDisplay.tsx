"use client";

import * as React from "react";
import { Loader2, MessageSquare, Quote } from "lucide-react";
import { fetchFromIPFS, type ReviewComment } from "@/lib/utils/ipfs";

interface ReviewCommentDisplayProps {
  ipfsHash: string;
}

export function ReviewCommentDisplay({ ipfsHash }: ReviewCommentDisplayProps) {
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
