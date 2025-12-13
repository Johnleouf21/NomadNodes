"use client";

/**
 * Hook to read and sync URL parameters
 */

import * as React from "react";
import { useSearchParams } from "next/navigation";
import type { BookingStatusFilter } from "../../../../booking";

const VALID_TABS = ["properties", "bookings", "analytics", "revenue"];
const VALID_STATUSES: BookingStatusFilter[] = [
  "all",
  "Pending",
  "Confirmed",
  "CheckedIn",
  "Completed",
  "Cancelled",
];

interface UseUrlParamsReturn {
  initialTab: string;
  initialStatus: BookingStatusFilter;
}

/**
 * Read tab and status from URL query parameters
 */
export function useUrlParams(
  setActiveTab: (tab: string) => void,
  setStatusFilter: (status: BookingStatusFilter) => void
): UseUrlParamsReturn {
  const searchParams = useSearchParams();

  const initialTab = React.useMemo(() => {
    const tab = searchParams.get("tab");
    return tab && VALID_TABS.includes(tab) ? tab : "properties";
  }, [searchParams]);

  const initialStatus = React.useMemo(() => {
    const status = searchParams.get("status") as BookingStatusFilter;
    return status && VALID_STATUSES.includes(status) ? status : "all";
  }, [searchParams]);

  React.useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && VALID_TABS.includes(tab)) {
      setActiveTab(tab);
    }

    const status = searchParams.get("status") as BookingStatusFilter;
    if (status && VALID_STATUSES.includes(status)) {
      setStatusFilter(status);
    }
  }, [searchParams, setActiveTab, setStatusFilter]);

  return { initialTab, initialStatus };
}
