"use client";

/**
 * Cancellation policy display component
 */

import * as React from "react";
import { Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CancellationPolicyProps {
  daysUntilCheckIn: number;
  refundPercent: number;
}

export function CancellationPolicy({ daysUntilCheckIn, refundPercent }: CancellationPolicyProps) {
  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 font-semibold">
        <Clock className="h-4 w-4" />
        Cancellation Policy
      </h4>

      <div className="grid gap-2 text-sm">
        <PolicyRow
          isActive={daysUntilCheckIn > 30}
          label="More than 30 days before"
          refundText="100% refund"
          variant="green"
        />

        <PolicyRow
          isActive={daysUntilCheckIn >= 14 && daysUntilCheckIn <= 30}
          label="14-30 days before"
          refundText="50% refund"
          variant="yellow"
        />

        <PolicyRow
          isActive={daysUntilCheckIn < 14}
          label="Less than 14 days before"
          refundText="0% refund"
          variant="red"
        />
      </div>

      <div className="bg-primary/5 border-primary/20 flex items-center gap-2 rounded-lg border p-3">
        <Clock className="text-primary h-5 w-5" />
        <div>
          <p className="text-sm font-medium">{daysUntilCheckIn} days until check-in</p>
          <p className="text-muted-foreground text-xs">
            Current refund rate: <span className="font-semibold">{refundPercent}%</span>
          </p>
        </div>
      </div>
    </div>
  );
}

interface PolicyRowProps {
  isActive: boolean;
  label: string;
  refundText: string;
  variant: "green" | "yellow" | "red";
}

function PolicyRow({ isActive, label, refundText, variant }: PolicyRowProps) {
  const variantStyles = {
    green: {
      container: isActive ? "border border-green-500/30 bg-green-500/10" : "bg-muted/50",
      icon: "text-green-600",
      badge: "border-green-500/30 bg-green-500/10 text-green-700",
    },
    yellow: {
      container: isActive ? "border border-yellow-500/30 bg-yellow-500/10" : "bg-muted/50",
      icon: "text-yellow-600",
      badge: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700",
    },
    red: {
      container: isActive ? "border border-red-500/30 bg-red-500/10" : "bg-muted/50",
      icon: "text-red-600",
      badge: "border-red-500/30 bg-red-500/10 text-red-700",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`flex items-center justify-between rounded p-2 ${styles.container}`}>
      <div className="flex items-center gap-2">
        {isActive ? (
          <CheckCircle2 className={`h-4 w-4 ${styles.icon}`} />
        ) : (
          <div className="border-muted-foreground/30 h-4 w-4 rounded-full border-2" />
        )}
        <span>{label}</span>
      </div>
      <Badge variant="outline" className={styles.badge}>
        {refundText}
      </Badge>
    </div>
  );
}
