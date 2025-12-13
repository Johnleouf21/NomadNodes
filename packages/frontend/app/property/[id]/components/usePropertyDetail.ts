import { useMemo, useState } from "react";
import { usePropertyById, usePropertyMetadata } from "@/lib/hooks/usePropertyNFT";
import { usePonderRoomTypes, type RoomTypeWithMeta_data } from "@/hooks/usePonderRoomTypes";
import { usePonderReviews } from "@/hooks/usePonderReviews";
import { useCheckMultipleAvailability, useCalendarAvailability } from "@/lib/hooks/property";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSearchStore } from "@/lib/store";
import type { DateRange } from "react-day-picker";
import type { RoomTypeWithAvailability } from "./types";

/**
 * Custom hook for property detail page data and logic
 */
export function usePropertyDetail(propertyId: bigint | undefined) {
  const { address } = useAuth();
  const { filters: searchFilters, setFilters } = useSearchStore();
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);

  // Convert search filters to DateRange format
  const dateRange: DateRange | undefined = useMemo(() => {
    if (searchFilters.checkIn && searchFilters.checkOut) {
      return { from: searchFilters.checkIn, to: searchFilters.checkOut };
    }
    return undefined;
  }, [searchFilters.checkIn, searchFilters.checkOut]);

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setFilters({ checkIn: range.from, checkOut: range.to });
    } else if (range?.from) {
      setFilters({ checkIn: range.from, checkOut: null });
    } else {
      setFilters({ checkIn: null, checkOut: null });
    }
  };

  // Handle guest count change
  const handleGuestsChange = (guests: number) => {
    setFilters({ guests });
  };

  // Check if user has selected dates
  const hasUserDateFilters = !!(searchFilters.checkIn && searchFilters.checkOut);

  // Fetch property data
  const { data: propertyData, isLoading: isLoadingProperty } = usePropertyById(propertyId);

  // Use Ponder to get room types with metadata
  const { data: ponderRoomTypes, isLoading: isLoadingRoomTypes } = usePonderRoomTypes(
    propertyId?.toString()
  );

  // Extract tokenIds from room types for availability check
  const roomTokenIds = useMemo(() => {
    if (!ponderRoomTypes) return [];
    return ponderRoomTypes.map((rt: RoomTypeWithMeta_data) => BigInt(rt.tokenId));
  }, [ponderRoomTypes]);

  // Check availability using multicall
  const { availabilityMap, isLoading: isLoadingAvailability } = useCheckMultipleAvailability(
    roomTokenIds,
    searchFilters.checkIn,
    searchFilters.checkOut,
    hasUserDateFilters && roomTokenIds.length > 0
  );

  // Get calendar availability for visual display
  const calendarStartDate = useMemo(() => new Date(), []);
  const {
    availableDates: calendarAvailableDates,
    unavailableDates: calendarUnavailableDates,
    isLoading: isLoadingCalendarAvailability,
  } = useCalendarAvailability(roomTokenIds, calendarStartDate, 90, roomTokenIds.length > 0);

  // Room types with availability status
  const roomTypesWithAvailability: RoomTypeWithAvailability[] = useMemo(() => {
    if (!ponderRoomTypes) return [];

    return ponderRoomTypes.map((roomType: RoomTypeWithMeta_data) => {
      const isAvailable = !hasUserDateFilters
        ? true
        : (availabilityMap.get(roomType.tokenId.toString()) ?? false);

      return {
        ...roomType,
        isAvailable,
      };
    });
  }, [ponderRoomTypes, hasUserDateFilters, availabilityMap]);

  // Count available room types
  const availableRoomTypesCount = useMemo(() => {
    return roomTypesWithAvailability.filter((rt) => rt.isAvailable).length;
  }, [roomTypesWithAvailability]);

  // Total room units
  const totalRoomUnits = useMemo(() => {
    return roomTypesWithAvailability.reduce((sum, rt) => sum + Number(rt.totalSupply || 0), 0);
  }, [roomTypesWithAvailability]);

  // Property metadata
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = propertyData as any;
  const ipfsHash = data?.ipfsMetadataHash;
  const { data: metadata } = usePropertyMetadata(ipfsHash);

  // Check ownership
  const isOwner = data?.hostWallet?.toLowerCase() === address?.toLowerCase();

  // Fetch reviews
  const { reviews: propertyReviews } = usePonderReviews({
    propertyId: propertyId?.toString(),
  });

  // Filter reviews and calculate average
  const { nonFlaggedReviews, averageRating, totalReviews } = useMemo(() => {
    const nonFlagged = propertyReviews.filter((r) => !r.isFlagged);
    const avg =
      nonFlagged.length > 0
        ? nonFlagged.reduce((sum, r) => sum + r.rating, 0) / nonFlagged.length
        : 0;
    return {
      nonFlaggedReviews: nonFlagged,
      averageRating: avg,
      totalReviews: nonFlagged.length,
    };
  }, [propertyReviews]);

  const totalBookings = Number(data?.totalBookings || 0n);
  const totalRoomTypesCount = roomTypesWithAvailability.length;

  // Format location
  const displayLocation = useMemo(() => {
    if (metadata?.city && metadata?.country) {
      return `${metadata.city}, ${metadata.country}`;
    }
    return metadata?.location || data?.location || "Unknown Location";
  }, [metadata, data]);

  const fullAddress = useMemo(() => {
    const parts = [metadata?.address, metadata?.city, metadata?.country].filter(Boolean);
    return parts.join(", ") || displayLocation;
  }, [metadata, displayLocation]);

  return {
    // Data
    propertyData: data,
    metadata,
    ipfsHash,
    roomTypesWithAvailability,
    propertyReviews,
    nonFlaggedReviews,

    // Computed values
    isOwner,
    displayLocation,
    fullAddress,
    averageRating,
    totalReviews,
    totalBookings,
    totalRoomUnits,
    totalRoomTypesCount,
    availableRoomTypesCount,

    // Loading states
    isLoadingProperty,
    isLoadingRoomTypes,
    isLoadingAvailability,
    isLoadingCalendarAvailability,

    // Date/availability
    dateRange,
    handleDateRangeChange,
    hasUserDateFilters,
    calendarAvailableDates,
    calendarUnavailableDates,

    // Guests
    guests: searchFilters.guests,
    handleGuestsChange,

    // Reviews modal
    reviewsModalOpen,
    setReviewsModalOpen,
  };
}
