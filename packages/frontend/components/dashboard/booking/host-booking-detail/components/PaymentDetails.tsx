"use client";

import { DollarSign, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { PaymentBreakdown } from "../types";
import type { PonderBooking } from "@/hooks/usePonderBookings";

interface PaymentDetailsProps {
  payment: PaymentBreakdown;
  bookingStatus: PonderBooking["status"];
}

/**
 * Payment details section
 */
export function PaymentDetails({ payment, bookingStatus }: PaymentDetailsProps) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="mb-3 flex items-center gap-2 font-semibold">
        <DollarSign className="h-4 w-4" />
        Payment Details
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Booking total</span>
          <span>
            {payment.escrowTotal.toFixed(2)} {payment.currencyLabel}
          </span>
        </div>
        <div className="text-muted-foreground flex justify-between">
          <span>Platform fee (5%)</span>
          <span>
            -{payment.fee.toFixed(2)} {payment.currencyLabel}
          </span>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between text-base font-semibold">
          <span>Your earnings</span>
          <span className="text-green-600">
            {payment.hostReceives.toFixed(2)} {payment.currencyLabel}
          </span>
        </div>
      </div>
      {bookingStatus === "Completed" && (
        <div className="mt-3 flex items-center gap-2 rounded bg-yellow-500/10 p-2 text-sm text-yellow-700 dark:text-yellow-400">
          <Clock className="h-4 w-4" />
          Funds ready to withdraw in Revenue tab
        </div>
      )}
    </div>
  );
}
