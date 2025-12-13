"use client";

/**
 * Revenue summary card component
 */

import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PlatformStats } from "../types";

interface RevenueSummaryCardProps {
  stats: PlatformStats | undefined;
}

export function RevenueSummaryCard({ stats }: RevenueSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Revenue Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Total Volume Processed</span>
          <span className="text-xl font-bold">
            ${(stats?.revenue.totalVolume || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Completed Transactions</span>
          <span className="font-medium">
            ${(stats?.revenue.totalCompleted || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Pending in Escrow</span>
          <span className="font-medium text-yellow-600">
            ${(stats?.revenue.pendingValue || 0).toLocaleString()}
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Platform Fees (5%)</span>
          <span className="text-xl font-bold text-green-600">
            ${(stats?.revenue.platformFees || 0).toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
