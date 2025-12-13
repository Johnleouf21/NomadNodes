import { useUserBookings } from "./useUserBookings";
import { useUserReviewsSubmitted } from "./useUserReviews";
import { useUserProperties } from "./useUserProperties";
import type { UserActivity, DateFilterOption } from "./types";

/**
 * Transform raw data into activity timeline with optional date filter
 */
export function useUserActivityTimeline(
  address: string | undefined,
  dateFilter: DateFilterOption = "30d"
) {
  const { data: bookings = [], isLoading: bookingsLoading } = useUserBookings(address, dateFilter);
  const { data: reviewsSubmitted = [], isLoading: reviewsLoading } = useUserReviewsSubmitted(
    address,
    dateFilter
  );
  const { data: properties = [], isLoading: propertiesLoading } = useUserProperties(
    address,
    dateFilter
  );

  const isLoading = bookingsLoading || reviewsLoading || propertiesLoading;

  const activities: UserActivity[] = [];

  // Add bookings as activities
  bookings.forEach((booking) => {
    const checkIn = new Date(Number(booking.checkInDate) * 1000);
    const checkOut = new Date(Number(booking.checkOutDate) * 1000);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const isUpcoming = checkIn > new Date();
    const isPast = checkOut < new Date();

    let status: UserActivity["status"] = "active";
    if (booking.status === "Cancelled") status = "cancelled";
    else if (booking.status === "Completed") status = "completed";
    else if (isUpcoming) status = "upcoming";
    else if (isPast && booking.status !== "Completed") status = "active";

    activities.push({
      id: `booking-${booking.id}`,
      type: "booking",
      title: `Booked Property #${booking.propertyId}`,
      description: `${nights} night${nights !== 1 ? "s" : ""} • ${checkIn.toLocaleDateString()} - ${checkOut.toLocaleDateString()} • $${(Number(booking.totalPrice) / 1e6).toFixed(0)}`,
      date: new Date(Number(booking.createdAt) * 1000),
      status,
      propertyId: booking.propertyId,
    });
  });

  // Add reviews submitted as activities
  reviewsSubmitted.forEach((review) => {
    activities.push({
      id: `review-${review.id}`,
      type: "review",
      title: `Reviewed Property #${review.propertyId}`,
      description: `${review.rating} star${review.rating !== 1 ? "s" : ""}`,
      date: new Date(Number(review.createdAt) * 1000),
      status: "completed",
      propertyId: review.propertyId,
      rating: review.rating,
    });
  });

  // Add property listings as activities
  properties.forEach((property) => {
    activities.push({
      id: `listing-${property.id}`,
      type: "listing",
      title: `Listed ${property.propertyType} in ${property.location || "Unknown location"}`,
      description: `Property #${property.propertyId}`,
      date: new Date(Number(property.createdAt) * 1000),
      status: property.isActive ? "active" : "completed",
      propertyId: property.propertyId,
    });
  });

  // Sort by date (newest first)
  activities.sort((a, b) => b.date.getTime() - a.date.getTime());

  return { activities, isLoading };
}
