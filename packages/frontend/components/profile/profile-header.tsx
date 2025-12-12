"use client";

import * as React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Shield,
  Star,
  DollarSign,
  Home,
  Plane,
  Crown,
  Activity,
  Loader2,
} from "lucide-react";
import { formatAddress } from "@/lib/utils";
import { useTravelerSBTData, useHostSBTData, getTierName } from "@/lib/hooks/useSBTProfile";
import {
  useFullUserProfile,
  useTravelerProfile,
  useHostProfile,
  useUserReviewsReceived,
  useHostPropertyReviews,
} from "@/lib/hooks/useUserProfile";

export function ProfileHeader() {
  const { address, hasTravelerSBT, hasHostSBT, role } = useAuth();

  const travelerSBTData = useTravelerSBTData(address);
  const hostSBTData = useHostSBTData(address);
  const { bookings, properties, isLoading } = useFullUserProfile(address);
  const { data: travelerProfile } = useTravelerProfile(address);
  const { data: hostProfile } = useHostProfile(address);
  const { data: reviewsReceived = [] } = useUserReviewsReceived(address);

  // Get property IDs for the hook
  const propertyIds = React.useMemo(() => {
    if (!hasHostSBT || properties.length === 0) return undefined;
    return properties.map((p) => p.propertyId);
  }, [hasHostSBT, properties]);

  // Fetch property reviews with React Query (cached)
  const { data: propertyReviews = [], isLoading: isLoadingPropertyReviews } =
    useHostPropertyReviews(propertyIds);

  // Calculate average rating from property reviews for hosts, or personal reviews for travelers
  const calculatedAvgRating = React.useMemo(() => {
    // For hosts with properties, use property reviews
    if (hasHostSBT && propertyReviews.length > 0) {
      const nonFlagged = propertyReviews.filter((r) => !r.isFlagged);
      if (nonFlagged.length === 0) return null;
      const sum = nonFlagged.reduce((acc, r) => acc + Number(r.rating), 0);
      return sum / nonFlagged.length;
    }

    // For travelers or hosts without property reviews, use personal reviews
    const nonFlaggedReviews = reviewsReceived.filter((r) => !r.isFlagged);
    if (nonFlaggedReviews.length === 0) return null;
    const sum = nonFlaggedReviews.reduce((acc, r) => acc + Number(r.rating), 0);
    return sum / nonFlaggedReviews.length;
  }, [hasHostSBT, propertyReviews, reviewsReceived]);

  // Calculate total spent (from completed bookings)
  const totalSpent = bookings
    .filter((b) => b.status === "Completed")
    .reduce((sum, b) => sum + Number(b.totalPrice) / 1e6, 0);

  // Get member since date from the earliest SBT or activity
  const getMemberSince = () => {
    const dates: number[] = [];

    // Check SBT memberSince (primary source)
    if (travelerSBTData.profile?.memberSince) {
      const ts = Number(travelerSBTData.profile.memberSince);
      if (ts > 0) dates.push(ts);
    }
    if (hostSBTData.profile?.memberSince) {
      const ts = Number(hostSBTData.profile.memberSince);
      if (ts > 0) dates.push(ts);
    }

    // Check Ponder profile data
    if (travelerProfile?.memberSince) {
      const ts = Number(travelerProfile.memberSince);
      if (ts > 0) dates.push(ts);
    }
    if (hostProfile?.memberSince) {
      const ts = Number(hostProfile.memberSince);
      if (ts > 0) dates.push(ts);
    }

    // Fallback: check earliest booking or property creation
    if (dates.length === 0) {
      bookings.forEach((b) => {
        if (b.createdAt) {
          const ts = Number(b.createdAt);
          if (ts > 0) dates.push(ts);
        }
      });
      properties.forEach((p) => {
        if (p.createdAt) {
          const ts = Number(p.createdAt);
          if (ts > 0) dates.push(ts);
        }
      });
    }

    if (dates.length === 0) return null;

    const earliestDate = new Date(Math.min(...dates) * 1000);
    return `Member since ${earliestDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  };

  // Get last activity
  const getLastActivity = () => {
    const dates = [];
    if (travelerProfile?.lastActivityAt) {
      dates.push(Number(travelerProfile.lastActivityAt));
    }
    if (hostProfile?.lastActivityAt) {
      dates.push(Number(hostProfile.lastActivityAt));
    }
    if (dates.length === 0) return null;

    const latestDate = new Date(Math.max(...dates) * 1000);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Active today";
    if (diffDays === 1) return "Active yesterday";
    if (diffDays < 7) return `Active ${diffDays} days ago`;
    if (diffDays < 30)
      return `Active ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? "s" : ""} ago`;
    return `Active ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? "s" : ""} ago`;
  };

  // Get average rating - prefer calculated from property reviews for hosts (excludes flagged)
  const getAverageRating = () => {
    // Use calculated average from reviews (excludes flagged reviews)
    if (calculatedAvgRating !== null) {
      return calculatedAvgRating;
    }
    // Don't fall back to indexed data if we're still loading property reviews for hosts
    if (hasHostSBT && isLoadingPropertyReviews) {
      return null;
    }
    // Fallback to profile data only if no reviews loaded yet
    if (travelerProfile?.averageRating) {
      return Number(travelerProfile.averageRating) / 100;
    }
    if (hostProfile?.averageRating) {
      return Number(hostProfile.averageRating) / 100;
    }
    if (travelerSBTData.profile?.averageRating) {
      return Number(travelerSBTData.profile.averageRating) / 100;
    }
    if (hostSBTData.profile?.averageRating) {
      return Number(hostSBTData.profile.averageRating) / 100;
    }
    return null;
  };

  // Get tier badge - prefer Ponder data (more up-to-date), fallback to contract
  const getTierBadge = () => {
    // For traveler
    if (hasTravelerSBT) {
      // Prefer Ponder tier (already a string), fallback to contract tier (number)
      const tierName = travelerProfile?.tier || getTierName(travelerSBTData.profile?.tier, true);
      return (
        <Badge variant="outline" className="gap-1 text-xs">
          <Plane className="h-3 w-3" />
          {tierName}
        </Badge>
      );
    }
    // For host
    if (hasHostSBT) {
      const tierName = hostProfile?.tier || getTierName(hostSBTData.profile?.tier, false);
      const isSuperHost = hostProfile?.isSuperHost || hostSBTData.profile?.superHost;
      return (
        <Badge variant="outline" className="gap-1 text-xs">
          <Home className="h-3 w-3" />
          {tierName}
          {isSuperHost && <Crown className="ml-1 h-3 w-3 text-yellow-500" />}
        </Badge>
      );
    }
    return null;
  };

  const getRoleBadge = () => {
    if (role === "both") {
      return (
        <>
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Shield className="mr-1 h-3 w-3" />
            Traveler
          </Badge>
          <Badge
            variant="secondary"
            className="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          >
            <Shield className="mr-1 h-3 w-3" />
            Host
          </Badge>
        </>
      );
    }
    if (hasTravelerSBT) {
      return (
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Shield className="mr-1 h-3 w-3" />
          Traveler
        </Badge>
      );
    }
    if (hasHostSBT) {
      return (
        <Badge
          variant="secondary"
          className="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        >
          <Shield className="mr-1 h-3 w-3" />
          Host
        </Badge>
      );
    }
    return null;
  };

  const avgRating = getAverageRating();
  const lastActivity = getLastActivity();
  const memberSince = getMemberSince();
  const completedBookings = bookings.filter((b) => b.status === "Completed").length;
  const activeProperties = properties.filter((p) => p.isActive).length;

  return (
    <Card className="overflow-hidden">
      {/* Cover Image */}
      <div className="from-primary h-32 bg-gradient-to-r to-purple-600" />

      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="-mt-16 mb-4">
          <Avatar className="border-background h-32 w-32 border-4">
            <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${address}`} />
            <AvatarFallback>{address?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            {/* Address & Role */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">
                {address ? formatAddress(address) : "Anonymous"}
              </h1>
              {getRoleBadge()}
              {getTierBadge()}
            </div>

            {/* Rating */}
            {avgRating !== null && avgRating > 0 && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(avgRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-1 text-sm font-medium">{avgRating.toFixed(1)}</span>
              </div>
            )}

            {/* Metadata */}
            <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
              {memberSince && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{memberSince}</span>
                </div>
              )}
              {lastActivity && (
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span>{lastActivity}</span>
                </div>
              )}
            </div>

            {/* Stats Summary */}
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Loading stats...</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {hasTravelerSBT && completedBookings > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Plane className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">{completedBookings}</span>
                    <span className="text-muted-foreground">
                      trip{completedBookings !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {hasHostSBT && activeProperties > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Home className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">{activeProperties}</span>
                    <span className="text-muted-foreground">
                      propert{activeProperties !== 1 ? "ies" : "y"}
                    </span>
                  </div>
                )}
                {hasTravelerSBT && totalSpent > 0 && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">${totalSpent.toLocaleString()}</span>
                    <span className="text-muted-foreground">spent</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
