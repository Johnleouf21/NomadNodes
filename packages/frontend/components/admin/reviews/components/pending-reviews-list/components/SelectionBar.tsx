"use client";

/**
 * Selection bar for batch actions on reviews
 */

import { CheckCircle2, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SelectionBarProps {
  selectedCount: number;
  onBatchApprove: () => void;
  onBatchPublish: () => void;
  isBatchApproving: boolean;
  isBatchPublishing: boolean;
}

/**
 * Batch action bar displayed when reviews are selected
 */
export function SelectionBar({
  selectedCount,
  onBatchApprove,
  onBatchPublish,
  isBatchApproving,
  isBatchPublishing,
}: SelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <span className="text-sm">{selectedCount} selected</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBatchApprove} disabled={isBatchApproving}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Approve All
          </Button>
          <Button size="sm" onClick={onBatchPublish} disabled={isBatchPublishing}>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Publish All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
