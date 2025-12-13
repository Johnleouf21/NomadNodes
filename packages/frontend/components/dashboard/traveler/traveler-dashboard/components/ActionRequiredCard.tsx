"use client";

import { AlertCircle, LogIn, CheckCircle2, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompleteStayButton } from "../../../booking";
import { ActionCollapsible } from "./ActionCollapsible";
import type { BookingSummary, TravelerPendingActions } from "../../types";

interface Review {
  propertyId: string;
  reviewee: string;
}

interface ActionRequiredCardProps {
  pendingActions: TravelerPendingActions;
  reviewsGiven: Review[];
  handleBookingClick: (booking: BookingSummary) => void;
  setSelectedBooking: (booking: BookingSummary) => void;
  setReviewModalOpen: (open: boolean) => void;
  refetchBookings: () => void;
}

/**
 * Card showing pending actions required from traveler
 */
export function ActionRequiredCard({
  pendingActions,
  reviewsGiven,
  handleBookingClick,
  setSelectedBooking,
  setReviewModalOpen,
  refetchBookings,
}: ActionRequiredCardProps) {
  if (pendingActions.total === 0) return null;

  return (
    <Card className="mb-8 border-yellow-500/50 bg-yellow-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="h-5 w-5" />
          Action Required
          <Badge
            variant="secondary"
            className="ml-auto bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
          >
            {pendingActions.total} pending
          </Badge>
        </CardTitle>
        <CardDescription>Complete these actions to keep your bookings on track</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Check-ins Today */}
        {pendingActions.checkInsToday.length > 0 && (
          <ActionCollapsible
            icon={<LogIn className="h-4 w-4 text-blue-500" />}
            title="Check-in Today"
            count={pendingActions.checkInsToday.length}
            badgeClass="bg-blue-500"
            items={pendingActions.checkInsToday}
            renderItem={(booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border bg-white/50 p-3 dark:bg-gray-800/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{booking.propertyName}</p>
                  <p className="text-muted-foreground text-sm">{booking.roomName}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBookingClick(booking as BookingSummary)}
                >
                  View Details
                </Button>
              </div>
            )}
          />
        )}

        {/* Confirm Arrival */}
        {pendingActions.toConfirmArrival.length > 0 && (
          <ActionCollapsible
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            title="Confirm Your Arrival"
            count={pendingActions.toConfirmArrival.length}
            badgeClass="bg-green-500"
            items={pendingActions.toConfirmArrival}
            renderItem={(booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border bg-white/50 p-3 dark:bg-gray-800/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{booking.propertyName}</p>
                  <p className="text-muted-foreground text-sm">
                    Confirm to release payment to host
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleBookingClick(booking as BookingSummary)}
                >
                  Confirm Stay
                </Button>
              </div>
            )}
          />
        )}

        {/* Complete or Review */}
        {pendingActions.toCompleteOrReview.length > 0 && (
          <ActionCollapsible
            icon={<Star className="h-4 w-4 text-yellow-500" />}
            title="Complete or Review"
            count={pendingActions.toCompleteOrReview.length}
            badgeClass="bg-yellow-500"
            items={pendingActions.toCompleteOrReview.slice(0, 5)}
            renderItem={(booking) => {
              const fullBooking = booking as BookingSummary;
              const hasReview = reviewsGiven.some(
                (r) =>
                  r.propertyId === fullBooking.propertyId &&
                  r.reviewee.toLowerCase() === fullBooking.hostAddress?.toLowerCase()
              );
              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border bg-white/50 p-3 dark:bg-gray-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{booking.propertyName}</p>
                    <p className="text-muted-foreground text-sm">
                      Stayed {booking.checkOut?.toLocaleDateString()}
                    </p>
                  </div>
                  <CompleteStayButton
                    escrowAddress={fullBooking.escrowAddress!}
                    checkInDate={fullBooking.checkIn}
                    onSuccess={() => refetchBookings()}
                    hasReview={hasReview}
                    onReviewClick={() => {
                      setSelectedBooking(fullBooking);
                      setReviewModalOpen(true);
                    }}
                  />
                </div>
              );
            }}
            moreCount={
              pendingActions.toCompleteOrReview.length > 5
                ? pendingActions.toCompleteOrReview.length - 5
                : 0
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
