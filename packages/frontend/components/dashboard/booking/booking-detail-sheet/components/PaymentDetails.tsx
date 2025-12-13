"use client";

import { DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PaymentDetailsProps {
  nights: number;
  total: number;
  currencyLabel: string;
}

/**
 * Payment breakdown display
 */
export function PaymentDetails({ nights, total, currencyLabel }: PaymentDetailsProps) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="mb-3 flex items-center gap-2 font-semibold">
        <DollarSign className="h-4 w-4" />
        Payment Details
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{nights} nights</span>
          <span>
            {(total * 0.95).toFixed(2)} {currencyLabel}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Platform fee (5%)</span>
          <span>
            {(total * 0.05).toFixed(2)} {currencyLabel}
          </span>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between text-base font-semibold">
          <span>Total Paid</span>
          <span>
            {total.toFixed(2)} {currencyLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
