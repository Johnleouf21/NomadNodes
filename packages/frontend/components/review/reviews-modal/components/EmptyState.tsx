"use client";

import { MessageSquare } from "lucide-react";

interface EmptyStateProps {
  message: string;
}

/**
 * Empty state display for reviews
 */
export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MessageSquare className="text-muted-foreground/50 mb-4 h-12 w-12" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
