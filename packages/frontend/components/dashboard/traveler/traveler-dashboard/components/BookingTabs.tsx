"use client";

import { Calendar, Star, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingCard } from "../../BookingCard";
import { EmptyState } from "./EmptyState";
import type { BookingSummary, PastBookingCounts } from "../../types";

interface BookingTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  upcomingBookings: BookingSummary[];
  pastBookings: BookingSummary[];
  filteredPastBookings: BookingSummary[];
  pastBookingCounts: PastBookingCounts;
  pastStatusFilter: "all" | "Completed" | "Cancelled";
  setPastStatusFilter: (filter: "all" | "Completed" | "Cancelled") => void;
  handleBookingClick: (booking: BookingSummary) => void;
  handleRoomClick: (booking: BookingSummary) => void;
  isBookingReviewed: (booking: BookingSummary) => boolean;
}

/**
 * Tabs for upcoming and past bookings
 */
export function BookingTabs({
  activeTab,
  setActiveTab,
  upcomingBookings,
  pastBookings,
  filteredPastBookings,
  pastBookingCounts,
  pastStatusFilter,
  setPastStatusFilter,
  handleBookingClick,
  handleRoomClick,
  isBookingReviewed,
}: BookingTabsProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.my_trips")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">
              {t("dashboard.upcoming")} ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              {t("dashboard.past")} ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcomingBookings.length === 0 ? (
              <EmptyState
                icon={<Calendar className="text-muted-foreground mb-4 h-12 w-12" />}
                title={t("dashboard.no_bookings")}
                subtitle="Start exploring properties to book your next adventure"
                action={<Button onClick={() => router.push("/explore")}>{t("nav.explore")}</Button>}
              />
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onClick={() => handleBookingClick(booking)}
                    onRoomClick={() => handleRoomClick(booking)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastBookings.length === 0 ? (
              <EmptyState
                icon={<Star className="text-muted-foreground mb-4 h-12 w-12" />}
                title="No past trips"
                subtitle="Your completed bookings will appear here"
              />
            ) : (
              <div className="space-y-4">
                {/* Status Filter Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={pastStatusFilter === "all" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setPastStatusFilter("all")}
                  >
                    All ({pastBookingCounts.all})
                  </Badge>
                  <Badge
                    variant={pastStatusFilter === "Completed" ? "default" : "outline"}
                    className={`cursor-pointer ${
                      pastStatusFilter === "Completed"
                        ? "bg-green-600 hover:bg-green-700"
                        : "hover:bg-green-100 dark:hover:bg-green-900/30"
                    }`}
                    onClick={() => setPastStatusFilter("Completed")}
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed ({pastBookingCounts.Completed})
                  </Badge>
                  <Badge
                    variant={pastStatusFilter === "Cancelled" ? "default" : "outline"}
                    className={`cursor-pointer ${
                      pastStatusFilter === "Cancelled"
                        ? "bg-red-600 hover:bg-red-700"
                        : "hover:bg-red-100 dark:hover:bg-red-900/30"
                    }`}
                    onClick={() => setPastStatusFilter("Cancelled")}
                  >
                    Cancelled ({pastBookingCounts.Cancelled})
                  </Badge>
                </div>

                {/* Filtered Bookings */}
                {filteredPastBookings.length === 0 ? (
                  <EmptyState
                    title=""
                    subtitle={`No ${pastStatusFilter.toLowerCase()} bookings found`}
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredPastBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onClick={() => handleBookingClick(booking)}
                        onRoomClick={() => handleRoomClick(booking)}
                        isReviewed={isBookingReviewed(booking)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
