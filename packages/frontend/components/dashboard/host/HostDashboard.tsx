"use client";

import * as React from "react";
import {
  Home,
  DollarSign,
  Clock,
  TrendingUp,
  Plus,
  Calendar,
  BarChart3,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardStats, type DashboardStat } from "../dashboard-stats";
import { HostBookingDetailSheet, CancelBookingModal } from "../booking";
import { HostAnalytics, HostRevenue } from "../analytics";
import { ReviewSubmissionForm, ReviewsModal } from "@/components/review";
import { BookingMessaging } from "@/components/messaging";
import type { PropertyWithMetadata } from "@/hooks/usePonderPropertiesWithMetadata";
import type { Address } from "viem";

import { useHostDashboard } from "./hooks/useHostDashboard";
import { ActionRequiredCard } from "./ActionRequiredCard";
import { PropertiesTab } from "./tabs/PropertiesTab";
import { BookingsTab } from "./tabs/BookingsTab";

export function HostDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const dashboard = useHostDashboard();

  // Calculate stats for display
  const totalProperties = dashboard.hostProperties?.length || 0;
  const activeBookings = dashboard.bookingCounts.Confirmed + dashboard.bookingCounts.CheckedIn;
  const completedBookings = dashboard.bookingCounts.Completed;

  const totalEarnings = React.useMemo(() => {
    if (!dashboard.ponderBookings) return 0;
    return dashboard.ponderBookings
      .filter((b) => b.status === "Completed")
      .reduce((sum, b) => sum + Number(b.totalPrice) / 1e6, 0);
  }, [dashboard.ponderBookings]);

  const occupancyRate = React.useMemo(() => {
    const total = dashboard.bookingCounts.all - dashboard.bookingCounts.Cancelled;
    if (total === 0) return 0;
    return Math.round(
      ((dashboard.bookingCounts.Confirmed + dashboard.bookingCounts.CheckedIn) / total) * 100
    );
  }, [dashboard.bookingCounts]);

  const pendingActionsTrend = React.useMemo(() => {
    const parts: string[] = [];
    if (dashboard.pendingActions.toConfirm.length > 0)
      parts.push(`${dashboard.pendingActions.toConfirm.length} to confirm`);
    if (dashboard.pendingActions.toCheckIn.length > 0)
      parts.push(`${dashboard.pendingActions.toCheckIn.length} to check-in`);
    if (dashboard.pendingActions.toComplete.length > 0)
      parts.push(`${dashboard.pendingActions.toComplete.length} to complete`);
    if (dashboard.pendingActions.toReview.length > 0)
      parts.push(`${dashboard.pendingActions.toReview.length} to review`);
    return parts.length > 0 ? parts.join(", ") : "All caught up!";
  }, [dashboard.pendingActions]);

  const stats: DashboardStat[] = [
    {
      title: t("dashboard.total_properties"),
      value: totalProperties.toString(),
      icon: Home,
      trend: `${activeBookings} active bookings`,
    },
    {
      title: t("dashboard.total_earnings"),
      value: `$${totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      trend: `From ${completedBookings} completed`,
    },
    {
      title: "Pending Actions",
      value: dashboard.pendingActions.total.toString(),
      icon: Clock,
      trend: pendingActionsTrend,
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      icon: TrendingUp,
      trend: `${activeBookings} active / ${dashboard.bookingCounts.all - dashboard.bookingCounts.Cancelled} total`,
    },
  ];

  return (
    <ProtectedRoute requireSBT="host">
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{t("dashboard.host_dashboard")}</h1>
            <p className="text-muted-foreground">
              {t("dashboard.manage")} {t("nav.my_properties")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/host/calendar")}>
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </Button>
            <Button onClick={() => router.push("/host/create-property")}>
              <Plus className="mr-2 h-4 w-4" />
              {t("dashboard.add_property")}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <DashboardStats stats={stats} />

        {/* Action Required Card */}
        <ActionRequiredCard
          pendingActions={dashboard.pendingActions}
          getPropertyInfo={dashboard.getPropertyInfo}
          onOpenDetails={dashboard.handleOpenDetails}
          onCheckIn={dashboard.handleCheckIn}
          onComplete={dashboard.handleComplete}
          onReview={(booking) => {
            dashboard.setSelectedBooking(booking);
            dashboard.setIsReviewModalOpen(true);
          }}
          isActionPending={dashboard.isActionPending}
        />

        {/* Tabs */}
        <Tabs value={dashboard.activeTab} onValueChange={dashboard.setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="properties">{t("dashboard.my_listings")}</TabsTrigger>
            <TabsTrigger value="bookings" className="relative">
              {t("dashboard.total_bookings")}
              {dashboard.pendingActions.total > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white">
                  {dashboard.pendingActions.total}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4" />
              Revenue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            <PropertiesTab properties={dashboard.hostProperties} isLoading={dashboard.isLoading} />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingsTab
              bookings={dashboard.ponderBookings}
              filteredBookings={dashboard.filteredBookings}
              isLoading={dashboard.isLoadingBookings}
              statusFilter={dashboard.statusFilter}
              onStatusFilterChange={dashboard.setStatusFilter}
              searchQuery={dashboard.searchQuery}
              onSearchChange={dashboard.setSearchQuery}
              sortBy={dashboard.sortBy}
              onSortChange={dashboard.setSortBy}
              propertyFilter={dashboard.propertyFilter}
              onPropertyFilterChange={dashboard.setPropertyFilter}
              properties={dashboard.propertiesForFilter}
              bookingCounts={dashboard.bookingCounts}
              getPropertyInfo={dashboard.getPropertyInfo}
              getRoomTypeInfo={dashboard.getRoomTypeInfo}
              getTravelerProfile={dashboard.getTravelerProfile}
              onViewDetails={dashboard.handleOpenDetails}
              onCheckIn={dashboard.handleCheckIn}
              onComplete={dashboard.handleComplete}
              onCancel={dashboard.handleOpenCancel}
              onTravelerRatingClick={(booking) => {
                dashboard.setSelectedTravelerAddress(booking.traveler);
                dashboard.setTravelerReviewsModalOpen(true);
              }}
              isActionPending={dashboard.isActionPending}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <HostAnalytics
              bookings={dashboard.ponderBookings || []}
              properties={dashboard.allProperties}
              roomTypesMap={dashboard.roomTypesMap}
              getPropertyInfo={dashboard.getPropertyInfo}
              getRoomTypeInfo={dashboard.getRoomTypeInfo}
            />
          </TabsContent>

          <TabsContent value="revenue">
            <HostRevenue
              bookings={dashboard.ponderBookings || []}
              getPropertyInfo={dashboard.getPropertyInfo}
              getRoomTypeInfo={dashboard.getRoomTypeInfo}
            />
          </TabsContent>
        </Tabs>

        {/* Booking Detail Sheet */}
        <HostBookingDetailSheet
          booking={dashboard.selectedBooking}
          propertyName={
            dashboard.selectedBooking
              ? dashboard.getPropertyInfo(dashboard.selectedBooking).name
              : ""
          }
          propertyImage={
            dashboard.selectedBooking
              ? dashboard.getPropertyInfo(dashboard.selectedBooking).imageUrl
              : undefined
          }
          roomTypeName={
            dashboard.selectedBooking
              ? dashboard.getRoomTypeInfo(dashboard.selectedBooking).name
              : undefined
          }
          currency={
            dashboard.selectedBooking
              ? dashboard.getRoomTypeInfo(dashboard.selectedBooking).currency
              : "USD"
          }
          open={dashboard.isDetailSheetOpen}
          onOpenChange={(open) => {
            dashboard.setIsDetailSheetOpen(open);
            if (!open && !dashboard.isReviewModalOpen) dashboard.setSelectedBooking(null);
          }}
          onCheckIn={
            dashboard.selectedBooking?.status === "Confirmed"
              ? () => dashboard.handleCheckIn(dashboard.selectedBooking!)
              : undefined
          }
          onComplete={
            dashboard.selectedBooking?.status === "CheckedIn"
              ? () => dashboard.handleComplete(dashboard.selectedBooking!)
              : undefined
          }
          onCancel={
            dashboard.selectedBooking?.status === "Pending" ||
            dashboard.selectedBooking?.status === "Confirmed"
              ? () => {
                  dashboard.setIsDetailSheetOpen(false);
                  dashboard.setCancelBooking(dashboard.selectedBooking);
                }
              : undefined
          }
          onReviewClick={
            dashboard.selectedBooking?.status === "Completed"
              ? dashboard.handleReviewClick
              : undefined
          }
          onMessage={() => {
            if (dashboard.selectedBooking) {
              dashboard.setMessagingBooking(dashboard.selectedBooking);
              dashboard.setIsDetailSheetOpen(false);
              dashboard.setIsMessagingOpen(true);
            }
          }}
          isActionPending={
            dashboard.selectedBooking
              ? dashboard.isActionPending(dashboard.selectedBooking.id)
              : false
          }
        />

        {/* Cancel Modal */}
        <CancelBookingModal
          open={!!dashboard.cancelBooking}
          onOpenChange={(open) => {
            if (!open) dashboard.setCancelBooking(null);
          }}
          booking={
            dashboard.cancelBooking
              ? {
                  id: dashboard.cancelBooking.id,
                  propertyName: dashboard.getPropertyInfo(dashboard.cancelBooking).name,
                  roomName: dashboard.getRoomTypeInfo(dashboard.cancelBooking).name,
                  checkIn: new Date(Number(dashboard.cancelBooking.checkInDate) * 1000),
                  checkOut: new Date(Number(dashboard.cancelBooking.checkOutDate) * 1000),
                  nights: Math.ceil(
                    (Number(dashboard.cancelBooking.checkOutDate) -
                      Number(dashboard.cancelBooking.checkInDate)) /
                      86400
                  ),
                  total: Number(dashboard.cancelBooking.totalPrice) / 1e6,
                  currency: dashboard.getRoomTypeInfo(dashboard.cancelBooking).currency,
                  escrowAddress: dashboard.cancelBooking.escrowAddress || null,
                }
              : null
          }
          onSuccess={() => {
            dashboard.setCancelBooking(null);
            setTimeout(() => dashboard.refetchBookings(), 2000);
          }}
        />

        {/* Review Modal */}
        {dashboard.isReviewModalOpen &&
          dashboard.selectedBooking &&
          dashboard.selectedBooking.escrowAddress &&
          dashboard.address && (
            <ReviewSubmissionForm
              booking={{
                id: dashboard.selectedBooking.id,
                propertyId: dashboard.selectedBooking.propertyId,
                propertyName: dashboard.getPropertyInfo(dashboard.selectedBooking).name,
                roomName: dashboard.getRoomTypeInfo(dashboard.selectedBooking).name,
                tokenId: dashboard.selectedBooking.tokenId,
                bookingIndex: dashboard.selectedBooking.bookingIndex,
                checkOut: new Date(Number(dashboard.selectedBooking.checkOutDate) * 1000),
                location:
                  dashboard.allProperties?.find(
                    (p: PropertyWithMetadata) =>
                      p.propertyId.toString() === dashboard.selectedBooking!.propertyId
                  )?.metadata?.location || "",
                image: dashboard.getPropertyInfo(dashboard.selectedBooking).imageUrl,
                escrowAddress: dashboard.selectedBooking.escrowAddress,
                hostAddress: dashboard.address as Address,
                travelerAddress: dashboard.selectedBooking.traveler as Address,
              }}
              open={dashboard.isReviewModalOpen}
              onOpenChange={(open) => {
                dashboard.setIsReviewModalOpen(open);
                if (!open) dashboard.setSelectedBooking(null);
              }}
              onSuccess={() => {
                dashboard.refetchBookings();
                dashboard.setSelectedBooking(null);
              }}
              isTravelerReview={false}
            />
          )}

        {/* Messaging Modal */}
        <BookingMessaging
          open={dashboard.isMessagingOpen}
          onOpenChange={(open) => {
            dashboard.setIsMessagingOpen(open);
            if (!open) dashboard.setMessagingBooking(null);
          }}
          peerAddress={dashboard.messagingBooking?.traveler || ""}
          bookingId={dashboard.messagingBooking?.id || ""}
          propertyName={
            dashboard.messagingBooking
              ? dashboard.getPropertyInfo(dashboard.messagingBooking).name
              : ""
          }
          isHost={true}
        />

        {/* Traveler Reviews Modal */}
        <ReviewsModal
          open={dashboard.travelerReviewsModalOpen}
          onOpenChange={(open) => {
            dashboard.setTravelerReviewsModalOpen(open);
            if (!open) dashboard.setSelectedTravelerAddress(null);
          }}
          reviewsReceived={dashboard.selectedTravelerReviewsReceived}
          reviewsGiven={dashboard.selectedTravelerReviewsGiven}
          averageRating={dashboard.selectedTravelerProfile?.averageRating || 0}
          totalReviews={dashboard.selectedTravelerProfile?.totalReviewsReceived || 0}
        />
      </div>
    </ProtectedRoute>
  );
}
