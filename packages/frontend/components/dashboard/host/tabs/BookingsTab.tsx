"use client";

import * as React from "react";
import { Calendar, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookingFiltersToolbar,
  HostBookingCard,
  type BookingStatusFilter,
  type SortOption,
} from "../../booking";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { PropertyFilterOption, BookingCounts, TravelerProfile } from "../types";

interface BookingsTabProps {
  bookings: PonderBooking[] | undefined;
  filteredBookings: PonderBooking[];
  isLoading: boolean;
  statusFilter: BookingStatusFilter;
  onStatusFilterChange: (filter: BookingStatusFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  propertyFilter: string;
  onPropertyFilterChange: (filter: string) => void;
  properties: PropertyFilterOption[];
  bookingCounts: BookingCounts;
  getPropertyInfo: (booking: PonderBooking) => { name: string; imageUrl?: string };
  getRoomTypeInfo: (booking: PonderBooking) => { name: string; currency: "USD" | "EUR" };
  getTravelerProfile: (address: string) => TravelerProfile | undefined;
  onViewDetails: (booking: PonderBooking) => void;
  onCheckIn: (booking: PonderBooking) => void;
  onComplete: (booking: PonderBooking) => void;
  onCancel: (booking: PonderBooking) => void;
  onTravelerRatingClick: (booking: PonderBooking) => void;
  isActionPending: (bookingId: string) => boolean;
}

export function BookingsTab({
  bookings,
  filteredBookings,
  isLoading,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  propertyFilter,
  onPropertyFilterChange,
  properties,
  bookingCounts,
  getPropertyInfo,
  getRoomTypeInfo,
  getTravelerProfile,
  onViewDetails,
  onCheckIn,
  onComplete,
  onCancel,
  onTravelerRatingClick,
  isActionPending,
}: BookingsTabProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-12">
          <Loader2 className="text-muted-foreground mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground">{t("common.loading")}...</p>
        </CardContent>
      </Card>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-12">
          <Calendar className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="mb-2 text-lg font-semibold">{t("dashboard.no_bookings")}</p>
          <p className="text-muted-foreground text-sm">
            Bookings for your properties will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <BookingFiltersToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        propertyFilter={propertyFilter}
        onPropertyFilterChange={onPropertyFilterChange}
        properties={properties}
        bookingCounts={bookingCounts}
      />

      {/* Results summary */}
      <div className="text-muted-foreground text-sm">
        Showing {filteredBookings.length} of {bookings.length} bookings
      </div>

      {/* Booking Cards */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center p-8">
            <p className="mb-2 text-lg font-semibold">No bookings match your filters</p>
            <p className="text-muted-foreground text-sm">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const { name, imageUrl } = getPropertyInfo(booking);
            const { name: roomName, currency } = getRoomTypeInfo(booking);
            const travelerProfile = getTravelerProfile(booking.traveler);
            return (
              <HostBookingCard
                key={booking.id}
                booking={booking}
                propertyName={name}
                propertyImage={imageUrl}
                roomTypeName={roomName}
                currency={currency}
                onViewDetails={() => onViewDetails(booking)}
                onCheckIn={booking.status === "Confirmed" ? () => onCheckIn(booking) : undefined}
                onComplete={booking.status === "CheckedIn" ? () => onComplete(booking) : undefined}
                onCancel={
                  booking.status === "Pending" || booking.status === "Confirmed"
                    ? () => onCancel(booking)
                    : undefined
                }
                isActionPending={isActionPending(booking.id)}
                travelerRating={travelerProfile?.averageRating}
                travelerReviewCount={travelerProfile?.totalReviewsReceived}
                onTravelerRatingClick={() => onTravelerRatingClick(booking)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
