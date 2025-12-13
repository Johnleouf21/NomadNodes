"use client";

import * as React from "react";
import {
  Shield,
  Loader2,
  AlertTriangle,
  Settings,
  RefreshCw,
  Users,
  Building2,
  Activity,
  Star,
  Calendar,
} from "lucide-react";
import { useAccount } from "wagmi";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useIsModerator,
  useReviewValidatorOwner,
  useGetPendingCount,
  useGetPendingReviews,
  useAutoApproveEnabled,
  useAutoApproveThreshold,
  useReviewCounter,
  ReviewStatus,
  type PendingReviewData,
} from "@/lib/hooks/contracts/adminReviews";
import { usePlatformStats } from "@/lib/hooks/contracts/useAdminPlatform";

import { PlatformOverviewTab } from "./overview-tab";
import { ReviewModerationTab } from "./reviews-tab";
import { UsersManagementTab } from "./users-tab";
import { PropertiesOversightTab } from "./properties-tab";
import { BookingsMonitoringTab } from "./bookings-tab";
import { AdminSettingsTab } from "./settings-tab";

const PAGE_SIZE = 10;

export function AdminDashboard() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = React.useState("overview");
  const [currentPage, setCurrentPage] = React.useState(0);

  // Authorization checks
  const { data: isModerator, isLoading: isLoadingModerator } = useIsModerator(address);
  const { data: contractOwner, isLoading: isLoadingOwner } = useReviewValidatorOwner();

  const isOwner = Boolean(
    address && contractOwner && address.toLowerCase() === (contractOwner as string).toLowerCase()
  );
  const hasAccess = Boolean(isModerator) || isOwner;

  // Platform stats
  const {
    data: platformStats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = usePlatformStats();

  // Review stats
  const { data: pendingCount, refetch: refetchPendingCount } = useGetPendingCount();
  const { data: totalReviews, refetch: refetchTotalReviews } = useReviewCounter();
  const { data: autoApproveEnabled, refetch: refetchAutoApprove } = useAutoApproveEnabled();
  const { data: autoApproveThreshold } = useAutoApproveThreshold();

  // Pending reviews with pagination
  const {
    data: pendingReviewsRaw,
    isLoading: isLoadingReviews,
    refetch: refetchPendingReviews,
  } = useGetPendingReviews(currentPage * PAGE_SIZE, PAGE_SIZE);

  const pendingReviews = React.useMemo(() => {
    if (!pendingReviewsRaw) return [];
    return (pendingReviewsRaw as PendingReviewData[]).filter(
      (r) => r.status === ReviewStatus.Pending || r.status === ReviewStatus.Approved
    );
  }, [pendingReviewsRaw]);

  // Refetch all data
  const refetchAll = React.useCallback(() => {
    refetchStats();
    refetchPendingCount();
    refetchTotalReviews();
    refetchAutoApprove();
    refetchPendingReviews();
  }, [
    refetchStats,
    refetchPendingCount,
    refetchTotalReviews,
    refetchAutoApprove,
    refetchPendingReviews,
  ]);

  // Loading state - wallet not connected
  if (!isConnected) {
    return (
      <div className="container px-4 py-8">
        <Card>
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12">
            <AlertTriangle className="mb-4 h-16 w-16 text-yellow-500" />
            <p className="mb-2 text-xl font-semibold">Wallet Not Connected</p>
            <p className="text-muted-foreground text-center text-sm">
              Please connect your wallet to access the admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state - checking permissions
  if (isLoadingModerator || isLoadingOwner) {
    return (
      <div className="container px-4 py-8">
        <Card>
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12">
            <Loader2 className="text-muted-foreground mb-4 h-12 w-12 animate-spin" />
            <p className="text-muted-foreground">Checking access permissions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div className="container px-4 py-8">
        <Card>
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12">
            <Shield className="mb-4 h-16 w-16 text-red-500" />
            <p className="mb-2 text-xl font-semibold">Access Denied</p>
            <p className="text-muted-foreground text-center text-sm">
              You do not have permission to access the admin dashboard.
              <br />
              Only contract owners and moderators can access this page.
            </p>
            <div className="text-muted-foreground mt-4 text-xs">Your address: {address}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPages = Math.ceil(Number(pendingCount || 0) / PAGE_SIZE);

  return (
    <div className="container px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="text-primary h-8 w-8" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground mt-2">Platform management and oversight</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isOwner ? "default" : "secondary"}>
            {isOwner ? "Owner" : "Moderator"}
          </Badge>
          <Button variant="outline" size="sm" onClick={refetchAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="reviews" className="relative flex items-center gap-1.5">
            <Star className="h-4 w-4" />
            Reviews
            {Number(pendingCount || 0) > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500 px-1.5 text-xs font-bold text-white">
                {pendingCount?.toString()}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Bookings
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="settings" className="flex items-center gap-1.5">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <PlatformOverviewTab
            stats={platformStats}
            isLoading={isLoadingStats}
            pendingReviews={Number(pendingCount || 0)}
            totalReviews={Number(totalReviews || 0)}
          />
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews">
          <ReviewModerationTab
            reviews={pendingReviews}
            isLoading={isLoadingReviews}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onRefresh={refetchAll}
          />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <UsersManagementTab isOwner={isOwner} onRefresh={refetchAll} />
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties">
          <PropertiesOversightTab />
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <BookingsMonitoringTab />
        </TabsContent>

        {/* Settings Tab */}
        {isOwner && (
          <TabsContent value="settings">
            <AdminSettingsTab
              autoApproveEnabled={!!autoApproveEnabled}
              autoApproveThreshold={Number(autoApproveThreshold || 0)}
              onRefresh={refetchAll}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
