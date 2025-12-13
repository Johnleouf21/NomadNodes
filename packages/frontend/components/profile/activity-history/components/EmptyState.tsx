"use client";

/**
 * Empty state display for activity history
 */

import * as React from "react";
import { Calendar, Users } from "lucide-react";

interface EmptyStateProps {
  isHostView: boolean;
}

export function EmptyState({ isHostView }: EmptyStateProps) {
  if (isHostView) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p className="font-medium">No bookings received yet</p>
        <p className="mt-1 text-sm">Bookings for your properties will appear here</p>
      </div>
    );
  }

  return (
    <div className="text-muted-foreground py-8 text-center">
      <Calendar className="mx-auto mb-2 h-8 w-8 opacity-50" />
      <p className="font-medium">No activity yet</p>
      <p className="mt-1 text-sm">Start exploring and booking properties!</p>
    </div>
  );
}
