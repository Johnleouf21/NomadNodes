"use client";

import { Calendar, Star, Clock, TrendingUp, DollarSign } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { formatTravelerRating, type PonderTraveler } from "@/hooks/usePonderTraveler";
import { StatCard } from "./StatCard";
import type { BookingSummary } from "../../types";

interface StatsGridProps {
  bookings: BookingSummary[];
  upcomingBookings: BookingSummary[];
  completedBookingsCount: number;
  totalNights: number;
  uniqueProperties: number;
  totalSpent: number;
  nextCheckIn: Date | null;
  calculatedAvgRating: number | null;
  nonFlaggedReviewCount: number;
  traveler: PonderTraveler | null | undefined;
  onReviewsClick: () => void;
}

/**
 * Grid of statistic cards for traveler dashboard
 */
export function StatsGrid({
  bookings,
  upcomingBookings,
  completedBookingsCount,
  totalNights,
  uniqueProperties,
  totalSpent,
  nextCheckIn,
  calculatedAvgRating,
  nonFlaggedReviewCount,
  traveler,
  onReviewsClick,
}: StatsGridProps) {
  const { t } = useTranslation();

  const ratingValue =
    calculatedAvgRating !== null
      ? calculatedAvgRating.toFixed(1)
      : traveler && Number(traveler.averageRating) > 0
        ? formatTravelerRating(traveler.averageRating).toFixed(1)
        : "—";

  const ratingSubtitle =
    nonFlaggedReviewCount > 0
      ? `${nonFlaggedReviewCount} review${nonFlaggedReviewCount !== 1 ? "s" : ""}`
      : traveler && Number(traveler.totalReviewsReceived) > 0
        ? `${traveler.totalReviewsReceived} reviews`
        : "No reviews yet";

  return (
    <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title={t("dashboard.total_bookings")}
        value={bookings.length.toString()}
        subtitle={totalNights > 0 ? `${totalNights} nights total` : "Start exploring"}
        icon={<Calendar className="text-primary h-6 w-6" />}
        iconBgClass="bg-primary/10"
      />
      <StatCard
        title={t("dashboard.upcoming")}
        value={upcomingBookings.length.toString()}
        subtitle={nextCheckIn ? `Next: ${nextCheckIn.toLocaleDateString()}` : "No trips planned"}
        icon={<Clock className="h-6 w-6 text-blue-500" />}
        iconBgClass="bg-blue-500/10"
      />
      <StatCard
        title="Completed Stays"
        value={completedBookingsCount.toString()}
        subtitle={
          uniqueProperties > 0
            ? `${uniqueProperties} unique properties`
            : "Complete your first stay"
        }
        icon={<TrendingUp className="h-6 w-6 text-green-500" />}
        iconBgClass="bg-green-500/10"
      />
      <StatCard
        title="Your Rating"
        value={ratingValue}
        subtitle={ratingSubtitle}
        icon={<Star className="h-6 w-6 text-yellow-500" />}
        iconBgClass="bg-yellow-500/10"
        onClick={onReviewsClick}
      />
      <StatCard
        title="Total Spent"
        value={`$${totalSpent > 0 ? totalSpent.toFixed(0) : "0"}`}
        subtitle={
          completedBookingsCount > 0
            ? `~$${Math.round(totalSpent / completedBookingsCount)}/trip avg`
            : "Book your first stay"
        }
        icon={<DollarSign className="h-6 w-6 text-purple-500" />}
        iconBgClass="bg-purple-500/10"
      />
    </div>
  );
}
