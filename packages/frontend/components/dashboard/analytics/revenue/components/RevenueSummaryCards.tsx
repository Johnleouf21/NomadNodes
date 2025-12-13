"use client";

import { DollarSign, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RevenueTotals } from "../types";

interface RevenueSummaryCardsProps {
  totals: RevenueTotals;
  pendingCount: number;
}

export function RevenueSummaryCards({ totals, pendingCount }: RevenueSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">${totals.pending.toFixed(2)}</div>
          <p className="text-muted-foreground text-xs">
            {pendingCount} escrow{pendingCount !== 1 ? "s" : ""} ready
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Already Withdrawn</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">${totals.withdrawn.toFixed(2)}</div>
          <p className="text-muted-foreground text-xs">Sent to your wallet</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          <DollarSign className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totals.total.toFixed(2)}</div>
          <p className="text-muted-foreground text-xs">From completed bookings</p>
        </CardContent>
      </Card>
    </div>
  );
}
