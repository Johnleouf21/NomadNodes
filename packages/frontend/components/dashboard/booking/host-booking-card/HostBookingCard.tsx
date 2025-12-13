"use client";

/**
 * HostBookingCard - Booking card for host dashboard
 *
 * Refactored from a 442-line file into modular components.
 */

import { Card, CardContent } from "@/components/ui/card";
import { statusConfig, type HostBookingCardProps } from "./types";
import { getDaysUntil, getNightsCount, getBookingActionState } from "./utils";
import { BookingImage, BookingHeader, BookingDetails, BookingActions } from "./components";

/**
 * Display a booking card with property info and actions
 */
export function HostBookingCard({
  booking,
  propertyName,
  propertyImage,
  roomTypeName,
  currency = "USD",
  onViewDetails,
  onConfirm,
  onCheckIn,
  onComplete,
  onCancel,
  isActionPending = false,
  travelerRating,
  travelerReviewCount,
  onTravelerRatingClick,
}: HostBookingCardProps) {
  const status = statusConfig[booking.status];
  const checkInInfo = getDaysUntil(booking.checkInDate);
  const nights = getNightsCount(booking.checkInDate, booking.checkOutDate);
  const totalPrice = Number(booking.totalPrice) / 1e6;
  const currencyLabel = currency === "EUR" ? "EURC" : "USDC";

  const actionState = getBookingActionState(
    booking.status,
    booking.checkInDate,
    booking.checkOutDate
  );

  const showUrgency = booking.status !== "Completed" && booking.status !== "Cancelled";

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex">
          {propertyImage && (
            <BookingImage
              propertyImage={propertyImage}
              propertyName={propertyName}
              checkInInfo={checkInInfo}
              showUrgency={showUrgency}
            />
          )}

          <div className="flex flex-1 flex-col p-4">
            <BookingHeader
              propertyName={propertyName}
              roomTypeName={roomTypeName}
              bookingIndex={booking.bookingIndex}
              status={status}
            />

            <BookingDetails
              checkInDate={booking.checkInDate}
              checkOutDate={booking.checkOutDate}
              traveler={booking.traveler}
              totalPrice={totalPrice}
              currencyLabel={currencyLabel}
              nights={nights}
              travelerRating={travelerRating}
              travelerReviewCount={travelerReviewCount}
              onTravelerRatingClick={onTravelerRatingClick}
            />

            <BookingActions
              bookingId={booking.id}
              bookingStatus={booking.status}
              checkInDate={booking.checkInDate}
              checkOutDate={booking.checkOutDate}
              traveler={booking.traveler}
              escrowAddress={booking.escrowAddress}
              canConfirm={actionState.canConfirm}
              canCheckIn={actionState.canCheckIn}
              canComplete={actionState.canComplete}
              canCancel={actionState.canCancel}
              showCheckInDisabled={actionState.showCheckInDisabled}
              showCompleteDisabled={actionState.showCompleteDisabled}
              isActionPending={isActionPending}
              onViewDetails={onViewDetails}
              onConfirm={onConfirm}
              onCheckIn={onCheckIn}
              onComplete={onComplete}
              onCancel={onCancel}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
