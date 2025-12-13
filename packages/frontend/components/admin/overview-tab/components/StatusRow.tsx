"use client";

/**
 * Status row helper component
 */

interface StatusRowProps {
  label: string;
  value: number;
  color: string;
}

export function StatusRow({ label, value, color }: StatusRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}
