"use client";

import * as React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Home,
  Star,
  MessageCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  XCircle,
  Clock,
  Plane,
  ChevronDown,
  ChevronUp,
  Users,
  LogIn,
} from "lucide-react";
import {
  useUserActivityTimeline,
  useUserProperties,
  formatRelativeTime,
  type UserActivity,
  type DateFilterOption,
} from "@/lib/hooks/useUserProfile";
import { usePonderBookings, type PonderBooking } from "@/hooks/usePonderBookings";
import Link from "next/link";

type ActivityType = UserActivity["type"];

// Date filter labels
const dateFilterLabels: Record<DateFilterOption, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 3 months",
  "1y": "Last year",
  all: "All time",
};

// Status config for bookings
const bookingStatusConfig: Record<
  PonderBooking["status"],
  {
    variant: "default" | "secondary" | "outline" | "destructive";
    label: string;
    icon: React.ElementType;
    color: string;
  }
> = {
  Pending: { variant: "secondary", label: "Pending", icon: Clock, color: "text-yellow-600" },
  Confirmed: { variant: "outline", label: "Confirmed", icon: CheckCircle, color: "text-blue-600" },
  CheckedIn: { variant: "outline", label: "Checked In", icon: LogIn, color: "text-purple-600" },
  Completed: { variant: "default", label: "Completed", icon: CheckCircle, color: "text-green-600" },
  Cancelled: { variant: "destructive", label: "Cancelled", icon: XCircle, color: "text-red-600" },
};

export function ActivityHistory() {
  const { t } = useTranslation();
  const { address, hasTravelerSBT, hasHostSBT } = useAuth();
  const [dateFilter, setDateFilter] = React.useState<DateFilterOption>("30d");
  const { activities, isLoading: isActivitiesLoading } = useUserActivityTimeline(
    address,
    dateFilter
  );
  const [showAll, setShowAll] = React.useState(false);

  // Fetch properties for host to get bookings received
  const { data: properties = [], isLoading: isPropertiesLoading } = useUserProperties(address);

  // Get property IDs for host bookings query
  const propertyIds = React.useMemo(() => {
    return properties.map((p) => p.propertyId);
  }, [properties]);

  // Fetch bookings received by host
  const { bookings: hostBookingsReceived, loading: isHostBookingsLoading } = usePonderBookings({
    propertyIds: hasHostSBT && propertyIds.length > 0 ? propertyIds : undefined,
  });

  // Filter host bookings by date
  const filteredHostBookings = React.useMemo(() => {
    if (!hostBookingsReceived || hostBookingsReceived.length === 0) return [];

    const now = Date.now();
    let minTimestamp = 0;

    switch (dateFilter) {
      case "7d":
        minTimestamp = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "30d":
        minTimestamp = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case "90d":
        minTimestamp = now - 90 * 24 * 60 * 60 * 1000;
        break;
      case "1y":
        minTimestamp = now - 365 * 24 * 60 * 60 * 1000;
        break;
      case "all":
      default:
        minTimestamp = 0;
    }

    return hostBookingsReceived
      .filter((b) => Number(b.createdAt) * 1000 >= minTimestamp)
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
  }, [hostBookingsReceived, dateFilter]);

  const isLoading =
    isActivitiesLoading || (hasHostSBT && (isPropertiesLoading || isHostBookingsLoading));

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "booking":
        return Calendar;
      case "review":
        return Star;
      case "listing":
        return Home;
      case "review_received":
        return MessageCircle;
      case "mint":
        return CheckCircle;
      default:
        return Calendar;
    }
  };

  const getStatusBadge = (status?: UserActivity["status"]) => {
    if (!status) return null;

    const config = {
      completed: { variant: "default" as const, label: "Completed", icon: CheckCircle },
      upcoming: { variant: "secondary" as const, label: "Upcoming", icon: Clock },
      active: { variant: "outline" as const, label: "Active", icon: Plane },
      cancelled: { variant: "destructive" as const, label: "Cancelled", icon: XCircle },
    };

    const { variant, label, icon: Icon } = config[status];

    return (
      <Badge variant={variant} className="gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Filter activities based on user's SBTs (for travelers)
  const filteredActivities = React.useMemo(() => {
    return activities.filter((activity) => {
      // For travelers, show bookings and reviews
      if (activity.type === "booking" || activity.type === "review") {
        return hasTravelerSBT;
      }
      // Don't show listing activities anymore - not useful
      if (activity.type === "listing") {
        return false;
      }
      return true;
    });
  }, [activities, hasTravelerSBT]);

  // Determine what to display based on user type
  // For hosts with properties: show bookings received
  // For travelers: show their activities (bookings made, reviews)
  const isHostView = hasHostSBT && propertyIds.length > 0;

  // Show only first 5 unless expanded
  const displayedActivities = showAll ? filteredActivities : filteredActivities.slice(0, 5);
  const displayedHostBookings = showAll ? filteredHostBookings : filteredHostBookings.slice(0, 5);

  // Get the count for the badge
  const totalCount = isHostView ? filteredHostBookings.length : filteredActivities.length;
  const hasMore = isHostView ? filteredHostBookings.length > 5 : filteredActivities.length > 5;
  const remainingCount = isHostView
    ? filteredHostBookings.length - 5
    : filteredActivities.length - 5;

  if (isLoading) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="text-primary h-5 w-5" />
            {isHostView ? "Bookings Received" : t("profile.activity_history")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isHostView ? (
              <Users className="text-primary h-5 w-5" />
            ) : (
              <Calendar className="text-primary h-5 w-5" />
            )}
            {isHostView ? "Bookings Received" : t("profile.activity_history")}
          </CardTitle>
          <Badge variant="secondary">
            {totalCount} {isHostView ? "bookings" : "activities"}
          </Badge>
        </div>

        {/* Date filter */}
        <div className="mt-2">
          <Select
            value={dateFilter}
            onValueChange={(value) => setDateFilter(value as DateFilterOption)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["7d", "30d", "90d", "1y", "all"] as DateFilterOption[]).map((option) => (
                <SelectItem key={option} value={option} className="text-xs">
                  {dateFilterLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className={showAll ? "h-[350px]" : "h-[280px]"}>
          <div className="grid gap-2">
            {isHostView ? (
              // Host view: show bookings received
              displayedHostBookings.length > 0 ? (
                displayedHostBookings.map((booking) => {
                  const statusConfig = bookingStatusConfig[booking.status];
                  const StatusIcon = statusConfig.icon;
                  const checkIn = new Date(Number(booking.checkInDate) * 1000);
                  const checkOut = new Date(Number(booking.checkOutDate) * 1000);
                  const nights = Math.ceil(
                    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const total = Number(booking.totalPrice) / 1e6;

                  return (
                    <div
                      key={booking.id}
                      className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-2.5 transition-colors"
                    >
                      <div
                        className={`shrink-0 rounded-full p-2 ${
                          booking.status === "Completed"
                            ? "bg-green-500/10"
                            : booking.status === "Cancelled"
                              ? "bg-red-500/10"
                              : booking.status === "CheckedIn"
                                ? "bg-purple-500/10"
                                : booking.status === "Confirmed"
                                  ? "bg-blue-500/10"
                                  : "bg-yellow-500/10"
                        }`}
                      >
                        <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">
                            Booking #{booking.bookingIndex}
                          </p>
                          <Badge variant={statusConfig.variant} className="gap-1 text-xs">
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-0.5 text-[11px]">
                          {checkIn.toLocaleDateString()} - {checkOut.toLocaleDateString()} ({nights}{" "}
                          night{nights !== 1 ? "s" : ""})
                        </p>
                        <div className="mt-1 flex items-center gap-3">
                          <p className="text-muted-foreground text-[10px]">
                            {formatRelativeTime(new Date(Number(booking.createdAt) * 1000))}
                          </p>
                          <span className="text-[10px] font-medium text-green-600">
                            ${total.toFixed(0)} USDC
                          </span>
                          <Link
                            href={`/property/${booking.propertyId}`}
                            className="text-primary inline-flex items-center gap-1 text-[10px] hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-muted-foreground py-8 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="font-medium">No bookings received yet</p>
                  <p className="mt-1 text-sm">Bookings for your properties will appear here</p>
                </div>
              )
            ) : // Traveler view: show activities
            displayedActivities.length > 0 ? (
              displayedActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div
                    key={activity.id}
                    className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-2.5 transition-colors"
                  >
                    <div className="bg-primary/10 shrink-0 rounded-full p-2">
                      <Icon className="text-primary h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{activity.title}</p>
                        {getStatusBadge(activity.status)}
                      </div>
                      <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                        {activity.description}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <p className="text-muted-foreground text-[10px]">
                          {formatRelativeTime(activity.date)}
                        </p>
                        {activity.propertyId && (
                          <Link
                            href={`/property/${activity.propertyId}`}
                            className="text-primary inline-flex items-center gap-1 text-[10px] hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Link>
                        )}
                        {activity.rating && (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-2.5 w-2.5 ${
                                  star <= activity.rating!
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                <Calendar className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="font-medium">No activity yet</p>
                <p className="mt-1 text-sm">Start exploring and booking properties!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Show more/less button */}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <ChevronUp className="mr-1 h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-4 w-4" />
                Show {remainingCount} more
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
