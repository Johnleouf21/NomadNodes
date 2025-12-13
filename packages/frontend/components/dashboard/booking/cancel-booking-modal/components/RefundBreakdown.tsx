"use client";

/**
 * Refund breakdown display component
 */

import * as React from "react";
import { DollarSign, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { RefundCalculation } from "../types";

interface RefundBreakdownProps {
  loading: boolean;
  refund: RefundCalculation;
  currencyLabel: string;
}

export function RefundBreakdown({ loading, refund, currencyLabel }: RefundBreakdownProps) {
  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 font-semibold">
        <DollarSign className="h-4 w-4" />
        Refund Breakdown
      </h4>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <BreakdownRow
            label="Total paid"
            value={`${refund.totalAmount.toFixed(2)} ${currencyLabel}`}
          />
          <BreakdownRow
            label="Platform fee (non-refundable)"
            value={`-${refund.fee.toFixed(2)} ${currencyLabel}`}
          />
          <BreakdownRow
            label="Refundable amount"
            value={`${refund.refundableAmount.toFixed(2)} ${currencyLabel}`}
          />
          <BreakdownRow label="Refund rate" value={`${refund.refundPercent}%`} />

          <Separator className="my-2" />

          <div className="flex justify-between font-semibold text-green-600">
            <span>Your refund</span>
            <span>
              {refund.yourRefund.toFixed(2)} {currencyLabel}
            </span>
          </div>

          {refund.hostReceives > 0 && (
            <BreakdownRow
              label="Host receives"
              value={`${refund.hostReceives.toFixed(2)} ${currencyLabel}`}
              muted
            />
          )}
        </div>
      )}
    </div>
  );
}

interface BreakdownRowProps {
  label: string;
  value: string;
  muted?: boolean;
}

function BreakdownRow({ label, value, muted }: BreakdownRowProps) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
