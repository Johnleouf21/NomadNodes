"use client";

import * as React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Star,
  Home,
  Calendar,
  TrendingUp,
  Loader2,
  DollarSign,
  Award,
  MessageSquare,
} from "lucide-react";
import { useTravelerSBTData, useHostSBTData, formatRating } from "@/lib/hooks/useSBTProfile";
import {
  useFullUserProfile,
  useTravelerProfile,
  useHostProfile,
  useUserReviewsSubmitted,
} from "@/lib/hooks/useUserProfile";
import { usePonderBookings } from "@/hooks/usePonderBookings";

export function ProfileStats() {
  const { t } = useTranslation();
  const { address, hasTravelerSBT, hasHostSBT } = useAuth();

  // SBT data from contracts
  const travelerSBTData = useTravelerSBTData(address);
  const hostSBTData = useHostSBTData(address);

  // Ponder data (more reliable for stats)
  const { bookings, properties, isLoading: isPonderLoading } = useFullUserProfile(address);
  const { data: travelerProfile, isLoading: isTravelerLoading } = useTravelerProfile(address);
  const { data: hostProfile, isLoading: isHostLoading } = useHostProfile(address);
  const { data: reviewsSubmitted, isLoading: isReviewsLoading } = useUserReviewsSubmitted(address);

  // Get property IDs for host bookings query
  const propertyIds = React.useMemo(() => {
    return properties.map((p) => p.propertyId);
  }, [properties]);

  // Fetch bookings received by host (bookings for host's properties)
  const { bookings: hostBookingsReceived, loading: isHostBookingsLoading } = usePonderBookings({
    propertyIds: hasHostSBT && propertyIds.length > 0 ? propertyIds : undefined,
  });

  // Calculate stats from Ponder data (traveler)
  const completedBookings = bookings.filter((b) => b.status === "Completed").length;
  const totalBookings = bookings.length;
  const totalSpent = bookings
    .filter((b) => b.status === "Completed")
    .reduce((sum, b) => sum + Number(b.totalPrice) / 1e6, 0);
  const activeProperties = properties.filter((p) => p.isActive).length;

  // Calculate host stats from actual booking data
  const hostBookingsReceivedCount = hostBookingsReceived.length;
  const hostCompletedBookings = hostBookingsReceived.filter((b) => b.status === "Completed").length;

  // Get reputation score - prefer Ponder data, fallback to SBT
  const getReputationScore = () => {
    // Try Ponder first
    if (travelerProfile?.averageRating && Number(travelerProfile.averageRating) > 0) {
      return (Number(travelerProfile.averageRating) / 100).toFixed(1);
    }
    if (hostProfile?.averageRating && Number(hostProfile.averageRating) > 0) {
      return (Number(hostProfile.averageRating) / 100).toFixed(1);
    }
    // Fallback to SBT data
    if (travelerSBTData.profile?.averageRating) {
      return formatRating(travelerSBTData.profile.averageRating);
    }
    if (hostSBTData.profile?.averageRating) {
      return formatRating(hostSBTData.profile.averageRating);
    }
    return "N/A";
  };

  // Get review count
  const getReviewCount = () => {
    if (travelerProfile?.totalReviewsReceived) {
      return Number(travelerProfile.totalReviewsReceived);
    }
    if (hostProfile?.totalReviewsReceived) {
      return Number(hostProfile.totalReviewsReceived);
    }
    if (travelerSBTData.profile?.totalReviewsReceived) {
      return Number(travelerSBTData.profile.totalReviewsReceived);
    }
    if (hostSBTData.profile?.totalReviewsReceived) {
      return Number(hostSBTData.profile.totalReviewsReceived);
    }
    return 0;
  };

  // Get tier name
  const getTierDisplay = () => {
    if (travelerProfile?.tier) return travelerProfile.tier;
    if (hostProfile?.tier) return hostProfile.tier;
    return null;
  };

  const isLoading =
    isPonderLoading ||
    isTravelerLoading ||
    isHostLoading ||
    isReviewsLoading ||
    isHostBookingsLoading ||
    (hasTravelerSBT && travelerSBTData.isLoading) ||
    (hasHostSBT && hostSBTData.isLoading);

  // Calculate reviews given
  const reviewsGivenCount = reviewsSubmitted?.length || 0;

  const reputationScore = getReputationScore();
  const reviewCount = getReviewCount();
  const tier = getTierDisplay();

  // Build stats array with real data
  const stats = [
    {
      icon: Star,
      label: t("profile.reputation_score"),
      value: reputationScore,
      subtext:
        reviewCount > 0
          ? `Based on ${reviewCount} review${reviewCount !== 1 ? "s" : ""}`
          : "No reviews yet",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/10",
      show: hasTravelerSBT || hasHostSBT,
    },
    {
      icon: Calendar,
      label: t("profile.total_bookings"),
      value: totalBookings.toString(),
      subtext: completedBookings > 0 ? `${completedBookings} completed` : "Start exploring",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      show: hasTravelerSBT,
    },
    {
      icon: MessageSquare,
      label: "Reviews Given",
      value: reviewsGivenCount.toString(),
      subtext: reviewsGivenCount > 0 ? "Thanks for the feedback!" : "Share your experiences",
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-500/10",
      show: hasTravelerSBT || hasHostSBT,
    },
    {
      icon: DollarSign,
      label: "Total Spent",
      value: totalSpent > 0 ? `$${totalSpent.toLocaleString()}` : "$0",
      subtext:
        completedBookings > 0
          ? `Across ${completedBookings} trip${completedBookings !== 1 ? "s" : ""}`
          : "Book your first stay",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
      show: hasTravelerSBT && totalSpent > 0,
    },
    {
      icon: Home,
      label: t("profile.properties_listed"),
      value: properties.length.toString(),
      subtext: activeProperties > 0 ? `${activeProperties} active` : "List your first property",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
      show: hasHostSBT,
    },
    {
      icon: TrendingUp,
      label: "Bookings Received",
      value: hostBookingsReceivedCount.toString(),
      subtext: hostCompletedBookings > 0 ? `${hostCompletedBookings} completed` : "Start hosting",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-500/10",
      show: hasHostSBT,
    },
    {
      icon: Award,
      label: "Current Tier",
      value: tier || "Newcomer",
      subtext:
        hostProfile?.isSuperHost || hostSBTData.profile?.superHost
          ? "SuperHost Status"
          : "Keep going to level up",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      show: (hasTravelerSBT || hasHostSBT) && tier !== null,
    },
  ];

  const visibleStats = stats.filter((stat) => stat.show);

  if (visibleStats.length === 0) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle>{t("profile.statistics")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground py-8 text-center">
            <Star className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>No statistics available yet</p>
            <p className="mt-1 text-sm">Complete your profile to see your stats</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>{t("profile.statistics")}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid h-full gap-4 sm:grid-cols-2">
          {visibleStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="flex items-start gap-4 rounded-lg border p-4">
                <div className={`rounded-full ${stat.bgColor} p-3`}>
                  {isLoading ? (
                    <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                  {isLoading ? (
                    <div className="bg-muted h-8 w-16 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold">{stat.value}</p>
                  )}
                  <p className="text-muted-foreground text-xs">{stat.subtext}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
