"use client";

/**
 * Empty state when no pending reviews
 */

import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Display when no pending reviews exist
 */
export function EmptyState() {
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
