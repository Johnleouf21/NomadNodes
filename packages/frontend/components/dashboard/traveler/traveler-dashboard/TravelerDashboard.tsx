"use client";

import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CheckInScanner } from "@/components/booking/CheckInScanner";

import { useTravelerDashboard } from "../hooks/travelerDashboard";
import { ProfileCard } from "../ProfileCard";
import { StatsGrid, ActionRequiredCard, BookingTabs, TravelerModals } from "./components";

/**
 * Main traveler dashboard component
 * Displays bookings, stats, and pending actions for travelers
 */
export function TravelerDashboard() {
  const { t } = useTranslation();
  const dashboard = useTravelerDashboard();

  return (
    <ProtectedRoute requireSBT="any">
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{t("dashboard.traveler_dashboard")}</h1>
          <p className="text-muted-foreground">{t("nav.my_bookings")}</p>
        </div>

        {/* Loading State */}
        {dashboard.isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            <span className="text-muted-foreground ml-2">Loading dashboard...</span>
          </div>
        )}

        {!dashboard.isLoading && (
          <>
            {/* Profile Card */}
            <ProfileCard
              address={dashboard.address}
              traveler={dashboard.traveler}
              calculatedAvgRating={dashboard.calculatedAvgRating}
              nonFlaggedReviewCount={dashboard.nonFlaggedReviewCount}
              onReviewsClick={() => dashboard.setReviewsModalOpen(true)}
            />

            {/* Stats Grid */}
            <StatsGrid
              bookings={dashboard.bookings}
              upcomingBookings={dashboard.upcomingBookings}
              completedBookingsCount={dashboard.completedBookingsCount}
              totalNights={dashboard.totalNights}
              uniqueProperties={dashboard.uniqueProperties}
              totalSpent={dashboard.totalSpent}
              nextCheckIn={dashboard.nextCheckIn}
              calculatedAvgRating={dashboard.calculatedAvgRating}
              nonFlaggedReviewCount={dashboard.nonFlaggedReviewCount}
              traveler={dashboard.traveler}
              onReviewsClick={() => dashboard.setReviewsModalOpen(true)}
            />

            {/* Action Required Card */}
            <ActionRequiredCard
              pendingActions={dashboard.pendingActions}
              reviewsGiven={dashboard.reviewsGiven}
              handleBookingClick={dashboard.handleBookingClick}
              setSelectedBooking={dashboard.setSelectedBooking}
              setReviewModalOpen={dashboard.setReviewModalOpen}
              refetchBookings={dashboard.refetchBookings}
            />

            {/* Check-In Scanner */}
            {dashboard.upcomingBookings.length > 0 && (
              <div className="mb-8">
                <CheckInScanner />
              </div>
            )}

            {/* Bookings Tabs */}
            <BookingTabs
              activeTab={dashboard.activeTab}
              setActiveTab={dashboard.setActiveTab}
              upcomingBookings={dashboard.upcomingBookings}
              pastBookings={dashboard.pastBookings}
              filteredPastBookings={dashboard.filteredPastBookings}
              pastBookingCounts={dashboard.pastBookingCounts}
              pastStatusFilter={dashboard.pastStatusFilter}
              setPastStatusFilter={dashboard.setPastStatusFilter}
              handleBookingClick={dashboard.handleBookingClick}
              handleRoomClick={dashboard.handleRoomClick}
              isBookingReviewed={dashboard.isBookingReviewed}
            />
          </>
        )}

        {/* Modals */}
        <TravelerModals
          selectedBooking={dashboard.selectedBooking}
          detailSheetOpen={dashboard.detailSheetOpen}
          setDetailSheetOpen={dashboard.setDetailSheetOpen}
          handleCancelClick={dashboard.handleCancelClick}
          handleReviewClick={dashboard.handleReviewClick}
          getExistingReview={dashboard.getExistingReview}
          cancelModalOpen={dashboard.cancelModalOpen}
          setCancelModalOpen={dashboard.setCancelModalOpen}
          handleCancelSuccess={dashboard.handleCancelSuccess}
          roomModalOpen={dashboard.roomModalOpen}
          setRoomModalOpen={dashboard.setRoomModalOpen}
          reviewModalOpen={dashboard.reviewModalOpen}
          setReviewModalOpen={dashboard.setReviewModalOpen}
          handleReviewSuccess={dashboard.handleReviewSuccess}
          messagingOpen={dashboard.messagingOpen}
          setMessagingOpen={dashboard.setMessagingOpen}
          reviewsModalOpen={dashboard.reviewsModalOpen}
          setReviewsModalOpen={dashboard.setReviewsModalOpen}
          reviewsReceived={dashboard.reviewsReceived}
          reviewsGiven={dashboard.reviewsGiven}
          calculatedAvgRating={dashboard.calculatedAvgRating}
          nonFlaggedReviewCount={dashboard.nonFlaggedReviewCount}
          traveler={dashboard.traveler}
        />
      </div>
    </ProtectedRoute>
  );
}
