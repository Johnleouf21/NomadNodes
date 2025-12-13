"use client";

/**
 * Tier row helper component with progress bar
 */

import { Progress } from "@/components/ui/progress";

interface TierRowProps {
  label: string;
  value: number;
  total: number;
}

export function TierRow({ label, value, total }: TierRowProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <Progress value={percentage} className="h-1.5" />
    </div>
  );
}
