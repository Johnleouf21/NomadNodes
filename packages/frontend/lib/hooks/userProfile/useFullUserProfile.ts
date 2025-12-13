import { useUserBookings } from "./useUserBookings";
import { useUserReviewsSubmitted, useUserReviewsReceived } from "./useUserReviews";
import { useUserProperties } from "./useUserProperties";
import { useHostProfile, useTravelerProfile } from "./useUserProfiles";

/**
 * Combined hook for all user profile data
 */
export function useFullUserProfile(address: string | undefined) {
  const bookings = useUserBookings(address);
  const reviewsSubmitted = useUserReviewsSubmitted(address);
  const reviewsReceived = useUserReviewsReceived(address);
  const properties = useUserProperties(address);
  const hostProfile = useHostProfile(address);
  const travelerProfile = useTravelerProfile(address);

  const isLoading =
    bookings.isLoading ||
    reviewsSubmitted.isLoading ||
    reviewsReceived.isLoading ||
    properties.isLoading ||
    hostProfile.isLoading ||
    travelerProfile.isLoading;

  return {
    bookings: bookings.data || [],
    reviewsSubmitted: reviewsSubmitted.data || [],
    reviewsReceived: reviewsReceived.data || [],
    properties: properties.data || [],
    hostProfile: hostProfile.data,
    travelerProfile: travelerProfile.data,
    isLoading,
    refetch: () => {
      bookings.refetch();
      reviewsSubmitted.refetch();
      reviewsReceived.refetch();
      properties.refetch();
      hostProfile.refetch();
      travelerProfile.refetch();
    },
  };
}
