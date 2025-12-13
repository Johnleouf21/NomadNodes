"use client";

/**
 * Loading state for pending reviews
 */

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Display loading spinner
 */
export function LoadingState() {
  return (
    <Card>
      <CardContent className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </CardContent>
    </Card>
  );
}
