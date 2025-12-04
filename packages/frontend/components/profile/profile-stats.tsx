"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Home, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { useTravelerSBTData, useHostSBTData, formatRating } from "@/lib/hooks/useSBTProfile";

export function ProfileStats() {
  const { t } = useTranslation();
  const { address, hasTravelerSBT, hasHostSBT } = useAuth();

  const travelerData = useTravelerSBTData(address);
  const hostData = useHostSBTData(address);

  // Build stats array with real data
  const stats = [
    {
      icon: Star,
      label: t("profile.reputation_score"),
      value: travelerData.profile?.averageRating
        ? formatRating(travelerData.profile.averageRating)
        : hostData.profile?.averageRating
          ? formatRating(hostData.profile.averageRating)
          : "N/A",
      subtext: travelerData.profile?.totalReviewsReceived
        ? `Based on ${travelerData.profile.totalReviewsReceived.toString()} reviews`
        : hostData.profile?.totalReviewsReceived
          ? `Based on ${hostData.profile.totalReviewsReceived.toString()} reviews`
          : "No reviews yet",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/10",
      show: hasTravelerSBT || hasHostSBT,
      isLoading: (hasTravelerSBT && travelerData.isLoading) || (hasHostSBT && hostData.isLoading),
    },
    {
      icon: Calendar,
      label: t("profile.total_bookings"),
      value: travelerData.profile?.totalBookings?.toString() || "0",
      subtext: travelerData.profile?.completedStays
        ? `${travelerData.profile.completedStays.toString()} completed`
        : "Start exploring",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      show: hasTravelerSBT,
      isLoading: travelerData.isLoading,
    },
    {
      icon: Home,
      label: t("profile.properties_listed"),
      value: hostData.profile?.totalPropertiesListed?.toString() || "0",
      subtext: hostData.profile?.completedBookings
        ? `${hostData.profile.completedBookings.toString()} completed bookings`
        : "List your first property",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
      show: hasHostSBT,
      isLoading: hostData.isLoading,
    },
    {
      icon: TrendingUp,
      label: t("profile.total_earnings"),
      value: hostData.profile?.totalBookingsReceived
        ? `${hostData.profile.totalBookingsReceived.toString()} bookings`
        : "0 bookings",
      subtext: hostData.profile?.superHost ? "SuperHost Status" : "Keep hosting",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
      show: hasHostSBT,
      isLoading: hostData.isLoading,
    },
  ];

  const visibleStats = stats.filter((stat) => stat.show);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.statistics")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="flex items-start gap-4 rounded-lg border p-4">
                <div className={`rounded-full ${stat.bgColor} p-3`}>
                  {stat.isLoading ? (
                    <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                  {stat.isLoading ? (
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
