"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Star,
  CheckCircle2,
  Clock,
  LogIn,
  ChevronRight,
  Loader2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePonderBookings } from "@/hooks/usePonderBookings";
import { usePonderHostProperties } from "@/hooks/usePonderProperties";
import { usePonderReviews } from "@/hooks/usePonderReviews";

interface PendingAction {
  id: string;
  type: "review" | "confirm" | "checkin" | "complete" | "withdraw";
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  iconBg: string;
}

export function NotificationBell() {
  const { address, hasTravelerSBT, hasHostSBT } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  // Fetch host properties to get property IDs
  const { properties: hostProperties } = usePonderHostProperties(address);
  const propertyIdStrings = React.useMemo(
    () => hostProperties?.map((p) => p.propertyId.toString()) || [],
    [hostProperties]
  );

  // Fetch bookings for host (by property IDs)
  const { bookings: hostBookings, loading: loadingHostBookings } = usePonderBookings({
    propertyIds: hasHostSBT && propertyIdStrings.length > 0 ? propertyIdStrings : undefined,
  });

  // Fetch bookings for traveler
  const { bookings: travelerBookings, loading: loadingTravelerBookings } = usePonderBookings({
    travelerAddress: hasTravelerSBT ? address : undefined,
  });

  // Fetch reviews left by the user (to count how many reviews were given)
  const { reviews: userReviews, loading: loadingReviews } = usePonderReviews({
    reviewerAddress: address,
  });

  // Calculate pending actions
  const pendingActions = React.useMemo(() => {
    const actions: PendingAction[] = [];
    const now = new Date();

    // Host actions
    if (hasHostSBT && hostBookings) {
      // Bookings to confirm (Pending status)
      const pendingConfirm = hostBookings.filter((b) => b.status === "Pending");
      if (pendingConfirm.length > 0) {
        actions.push({
          id: "host-confirm",
          type: "confirm",
          title: `${pendingConfirm.length} booking${pendingConfirm.length > 1 ? "s" : ""} to confirm`,
          description: "New booking requests waiting for your approval",
          href: "/dashboard/host?tab=bookings&status=Pending",
          icon: <Clock className="h-4 w-4 text-yellow-600" />,
          iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
        });
      }

      // Bookings to check-in (Confirmed + check-in day ended)
      const readyForCheckin = hostBookings.filter((b) => {
        if (b.status !== "Confirmed") return false;
        const checkInDate = new Date(Number(b.checkInDate) * 1000);
        const checkInDayEnd = new Date(checkInDate);
        checkInDayEnd.setUTCHours(23, 59, 59, 999);
        return now > checkInDayEnd;
      });
      if (readyForCheckin.length > 0) {
        actions.push({
          id: "host-checkin",
          type: "checkin",
          title: `${readyForCheckin.length} guest${readyForCheckin.length > 1 ? "s" : ""} to check in`,
          description: "Guests are waiting for check-in confirmation",
          href: "/dashboard/host?tab=bookings&status=Confirmed",
          icon: <LogIn className="h-4 w-4 text-orange-600" />,
          iconBg: "bg-orange-100 dark:bg-orange-900/30",
        });
      }

      // Bookings to complete (CheckedIn + checkout date reached)
      const readyForComplete = hostBookings.filter((b) => {
        if (b.status !== "CheckedIn") return false;
        const checkOutDate = new Date(Number(b.checkOutDate) * 1000);
        return now >= checkOutDate;
      });
      if (readyForComplete.length > 0) {
        actions.push({
          id: "host-complete",
          type: "complete",
          title: `${readyForComplete.length} stay${readyForComplete.length > 1 ? "s" : ""} to complete`,
          description: "Stays ready to be marked as completed",
          href: "/dashboard/host?tab=bookings&status=CheckedIn",
          icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
          iconBg: "bg-green-100 dark:bg-green-900/30",
        });
      }

      // Reviews to leave (Completed bookings without host review)
      // Host reviews travelers - we COUNT reviews per property-traveler combination
      // because the same traveler might book multiple times
      const reviewCountByKey = new Map<string, number>();
      userReviews.forEach((r) => {
        const key = `${r.propertyId}-${r.reviewee.toLowerCase()}`;
        reviewCountByKey.set(key, (reviewCountByKey.get(key) || 0) + 1);
      });

      // Count completed bookings per property-traveler
      const bookingCountByKey = new Map<string, number>();
      const completedWithEscrow = hostBookings.filter(
        (b) => b.status === "Completed" && b.escrowAddress
      );
      completedWithEscrow.forEach((b) => {
        const key = `${b.propertyId}-${b.traveler.toLowerCase()}`;
        bookingCountByKey.set(key, (bookingCountByKey.get(key) || 0) + 1);
      });

      // Calculate total pending reviews
      let pendingHostReviewsCount = 0;
      bookingCountByKey.forEach((bookingCount, key) => {
        const reviewCount = reviewCountByKey.get(key) || 0;
        pendingHostReviewsCount += Math.max(0, bookingCount - reviewCount);
      });

      if (pendingHostReviewsCount > 0) {
        actions.push({
          id: "host-reviews",
          type: "review",
          title: `${pendingHostReviewsCount} review${pendingHostReviewsCount > 1 ? "s" : ""} to leave`,
          description: "Share your experience with your guests",
          href: "/dashboard/host?tab=bookings&status=Completed",
          icon: <Star className="h-4 w-4 text-purple-600" />,
          iconBg: "bg-purple-100 dark:bg-purple-900/30",
        });
      }

      // Withdrawals available (only Completed bookings with escrow addresses)
      // CheckedIn bookings aren't ready for withdrawal yet - escrow is still pending
      const bookingsReadyForWithdrawal = hostBookings.filter(
        (b) => b.status === "Completed" && b.escrowAddress
      );
      if (bookingsReadyForWithdrawal.length > 0) {
        actions.push({
          id: "host-withdraw",
          type: "withdraw",
          title: `${bookingsReadyForWithdrawal.length} payment${bookingsReadyForWithdrawal.length > 1 ? "s" : ""} to manage`,
          description: "Check your earnings and withdraw funds",
          href: "/dashboard/host?tab=revenue",
          icon: <Wallet className="h-4 w-4 text-green-600" />,
          iconBg: "bg-green-100 dark:bg-green-900/30",
        });
      }
    }

    // Traveler actions
    if (hasTravelerSBT && travelerBookings) {
      // Reviews to leave (Completed bookings without traveler review)
      // Traveler reviews hosts - we COUNT reviews per propertyId
      // because the traveler might book the same property multiple times
      const reviewCountByProperty = new Map<string, number>();
      userReviews.forEach((r) => {
        reviewCountByProperty.set(r.propertyId, (reviewCountByProperty.get(r.propertyId) || 0) + 1);
      });

      // Count completed bookings per property
      const bookingCountByProperty = new Map<string, number>();
      const completedTravelerWithEscrow = travelerBookings.filter(
        (b) => b.status === "Completed" && b.escrowAddress
      );
      completedTravelerWithEscrow.forEach((b) => {
        bookingCountByProperty.set(
          b.propertyId,
          (bookingCountByProperty.get(b.propertyId) || 0) + 1
        );
      });

      // Calculate total pending reviews
      let pendingTravelerReviewsCount = 0;
      bookingCountByProperty.forEach((bookingCount, propertyId) => {
        const reviewCount = reviewCountByProperty.get(propertyId) || 0;
        pendingTravelerReviewsCount += Math.max(0, bookingCount - reviewCount);
      });

      if (pendingTravelerReviewsCount > 0) {
        actions.push({
          id: "traveler-reviews",
          type: "review",
          title: `${pendingTravelerReviewsCount} review${pendingTravelerReviewsCount > 1 ? "s" : ""} to leave`,
          description: "Share your experience with your hosts",
          href: "/dashboard/traveler?tab=past&status=Completed",
          icon: <Star className="h-4 w-4 text-purple-600" />,
          iconBg: "bg-purple-100 dark:bg-purple-900/30",
        });
      }

      // Check-ins today (Confirmed bookings on check-in day)
      const checkInsToday = travelerBookings.filter((b) => {
        if (b.status !== "Confirmed") return false;
        const checkInDate = new Date(Number(b.checkInDate) * 1000);
        const today = new Date();
        return (
          checkInDate.getFullYear() === today.getFullYear() &&
          checkInDate.getMonth() === today.getMonth() &&
          checkInDate.getDate() === today.getDate()
        );
      });
      if (checkInsToday.length > 0) {
        actions.push({
          id: "traveler-checkin",
          type: "checkin",
          title: `${checkInsToday.length} check-in${checkInsToday.length > 1 ? "s" : ""} today`,
          description: "You have arrivals scheduled for today",
          href: "/dashboard/traveler?tab=upcoming",
          icon: <LogIn className="h-4 w-4 text-blue-600" />,
          iconBg: "bg-blue-100 dark:bg-blue-900/30",
        });
      }
    }

    return actions;
  }, [hostBookings, travelerBookings, userReviews, hasHostSBT, hasTravelerSBT]);

  const isLoading = loadingHostBookings || loadingTravelerBookings || loadingReviews;
  const totalCount = pendingActions.length;

  // Don't show if no SBT
  if (!hasTravelerSBT && !hasHostSBT) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {totalCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <h4 className="font-semibold">Notifications</h4>
          <p className="text-muted-foreground text-xs">
            {totalCount > 0
              ? `You have ${totalCount} pending action${totalCount > 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>

        <ScrollArea className="max-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : pendingActions.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="text-muted-foreground/50 mx-auto mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">No pending actions</p>
            </div>
          ) : (
            <div className="divide-y">
              {pendingActions.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-muted flex items-center gap-3 px-4 py-3 transition-colors"
                >
                  <div className={`rounded-full p-2 ${action.iconBg}`}>{action.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-muted-foreground truncate text-xs">{action.description}</p>
                  </div>
                  <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>

        {pendingActions.length > 0 && (
          <div className="border-t p-2">
            <Link
              href={hasHostSBT ? "/dashboard/host" : "/dashboard/traveler"}
              onClick={() => setIsOpen(false)}
            >
              <Button variant="ghost" size="sm" className="w-full">
                View Dashboard
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
