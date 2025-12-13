"use client";

/**
 * Hook for URL parameter state management
 */

import * as React from "react";
import { useSearchParams } from "next/navigation";
import type { PastBookingStatusFilter } from "../../types";

/**
 * Manage tab and filter state from URL parameters
 */
export function useUrlParams() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState("upcoming");
  const [pastStatusFilter, setPastStatusFilter] = React.useState<PastBookingStatusFilter>("all");

  React.useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["upcoming", "past"].includes(tab)) {
      setActiveTab(tab);
    }

    const status = searchParams.get("status");
    if (status && ["all", "Completed", "Cancelled"].includes(status)) {
      setPastStatusFilter(status as PastBookingStatusFilter);
    }
  }, [searchParams]);

  return {
    activeTab,
    setActiveTab,
    pastStatusFilter,
    setPastStatusFilter,
  };
}
