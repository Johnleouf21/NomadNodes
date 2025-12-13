/**
 * Types for PlatformOverviewTab
 */

import type { usePlatformStats } from "@/lib/hooks/contracts/useAdminPlatform";

export interface PlatformOverviewTabProps {
  stats: ReturnType<typeof usePlatformStats>["data"];
  isLoading: boolean;
  pendingReviews: number;
  totalReviews: number;
}

export type PlatformStats = NonNullable<ReturnType<typeof usePlatformStats>["data"]>;
