/**
 * Search hooks for Property contracts
 * Uses PropertyRegistry and AvailabilityManager for blockchain queries
 *
 * Note: For better performance, consider using Ponder GraphQL queries
 * instead of on-chain queries for complex searches.
 */

import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { useMemo } from "react";
import { getStartOfDayTimestamp } from "./useAvailability";

/**
 * Get total property count from PropertyRegistry
 */
export function useTotalProperties(enabled: boolean = true) {
  return useReadContract({
    ...CONTRACTS.propertyRegistry,
    functionName: "totalProperties",
    query: {
      enabled,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnWindowFocus: false,
    },
  });
}

/**
 * Get all active property IDs from the PropertyRegistry
 * @deprecated Use Ponder GraphQL queries for better performance
 */
export function useAllActiveProperties(_enabled: boolean = true) {
  // Note: The new architecture doesn't have a getAllActiveProperties function
  // Use Ponder GraphQL to query active properties
  return {
    data: undefined as bigint[] | undefined,
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve({ data: undefined }),
  };
}

/**
 * Search for available rooms based on dates and guest count via AvailabilityManager
 * @deprecated This function calls a non-existent contract method.
 * Use useCheckMultipleAvailability from useAvailability.ts instead.
 */
export function useSearchAvailableRooms(
  _checkIn: bigint | undefined,
  _checkOut: bigint | undefined,
  _minGuests: bigint | undefined,
  _enabled: boolean = true
) {
  // This function is deprecated - searchAvailableRooms doesn't exist in the contract
  // Use useCheckMultipleAvailability from useAvailability.ts instead
  return {
    data: undefined as bigint[] | undefined,
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve({ data: undefined }),
  };
}

/**
 * Check if a specific room is available for the given dates via AvailabilityManager
 * @param tokenId - Room token ID
 * @param checkIn - Check-in timestamp in seconds
 * @param checkOut - Check-out timestamp in seconds
 * @param _enabled - Whether the query should be enabled
 */
export function useIsRoomAvailable(
  tokenId: bigint | undefined,
  checkIn: bigint | undefined,
  checkOut: bigint | undefined,
  enabled: boolean = true
) {
  return useReadContract({
    ...CONTRACTS.availabilityManager,
    functionName: "isRoomAvailable",
    args: tokenId && checkIn && checkOut ? [tokenId, checkIn, checkOut] : undefined,
    query: {
      enabled: enabled && !!tokenId && !!checkIn && !!checkOut && checkIn < checkOut,
      staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      refetchOnWindowFocus: false,
    },
  });
}

/**
 * Get available units for a specific room on a specific day via AvailabilityManager
 * @param tokenId - Room token ID
 * @param dayTimestamp - Day timestamp (normalized to start of day)
 * @param _enabled - Whether the query should be enabled
 */
export function useAvailableUnits(
  tokenId: bigint | undefined,
  dayTimestamp: bigint | undefined,
  enabled: boolean = true
) {
  // Calculate endTimestamp as next day start (startDate + 86400 seconds)
  const endTimestamp = dayTimestamp !== undefined ? dayTimestamp + 86400n : undefined;

  return useReadContract({
    ...CONTRACTS.availabilityManager,
    functionName: "getAvailableUnits",
    args:
      tokenId && dayTimestamp !== undefined && endTimestamp !== undefined
        ? [tokenId, dayTimestamp, endTimestamp]
        : undefined,
    query: {
      enabled: enabled && !!tokenId && dayTimestamp !== undefined,
      staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      refetchOnWindowFocus: false,
    },
  });
}

/**
 * Hook to check if a room type has any availability for tomorrow
 * Useful for showing availability status without specific dates
 * @param tokenId - Room token ID
 * @param _enabled - Whether the query should be enabled
 */
export function useRoomHasAvailability(tokenId: bigint | undefined, enabled: boolean = true) {
  // Check availability for tomorrow (minimum 1 night stay)
  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return BigInt(getStartOfDayTimestamp(date));
  }, []);

  const dayAfterTomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return BigInt(getStartOfDayTimestamp(date));
  }, []);

  return useReadContract({
    ...CONTRACTS.availabilityManager,
    functionName: "isRoomAvailable",
    args: tokenId ? [tokenId, tomorrow, dayAfterTomorrow] : undefined,
    query: {
      enabled: enabled && !!tokenId,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnWindowFocus: false,
    },
  });
}

/**
 * Hook to check availability for multiple room types in batch
 * Returns a map of tokenId -> hasAvailability
 * @deprecated Use useCheckMultipleAvailability from useAvailability.ts instead
 */
export function useMultipleRoomsAvailability(tokenIds: bigint[], _enabled: boolean = true) {
  // This function is deprecated - searchAvailableRooms doesn't exist in the contract
  // Use useCheckMultipleAvailability from useAvailability.ts instead
  const availabilityMap = useMemo(() => {
    const map = new Map<string, boolean>();
    tokenIds.forEach((tokenId) => {
      map.set(tokenId.toString(), true); // Default to available
    });
    return map;
  }, [tokenIds]);

  return {
    availabilityMap,
    isLoading: false,
    availableCount: tokenIds.length,
  };
}

/**
 * Combined hook for property search with filtering
 * Useful for the main property search/listing page
 *
 * Note: For production use, prefer Ponder GraphQL queries
 * for better performance and more flexible filtering
 */
export function usePropertySearchWithFilters(filters?: {
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  _enabled?: boolean;
}) {
  const checkInTimestamp = useMemo(
    () => (filters?.checkIn ? BigInt(getStartOfDayTimestamp(filters.checkIn)) : undefined),
    [filters?.checkIn]
  );

  const checkOutTimestamp = useMemo(
    () => (filters?.checkOut ? BigInt(getStartOfDayTimestamp(filters.checkOut)) : undefined),
    [filters?.checkOut]
  );

  const guestsBigInt = useMemo(
    () => (filters?.guests ? BigInt(filters.guests) : undefined),
    [filters?.guests]
  );

  // If dates and guests are provided, use filtered search
  const hasFilters = !!(checkInTimestamp && checkOutTimestamp && guestsBigInt !== undefined);

  // Only enable filtered search when we have filters
  const filteredSearch = useSearchAvailableRooms(
    checkInTimestamp,
    checkOutTimestamp,
    guestsBigInt,
    hasFilters && (filters?._enabled ?? true)
  );

  // Return filtered results or inform user to use Ponder
  return {
    data: hasFilters ? (filteredSearch.data as bigint[] | undefined) : undefined,
    isLoading: hasFilters ? filteredSearch.isLoading : false,
    error: hasFilters ? filteredSearch.error : null,
    refetch: hasFilters ? filteredSearch.refetch : () => Promise.resolve({ data: undefined }),
    isFiltered: hasFilters,
    // Note: For unfiltered property listing, use Ponder GraphQL queries
  };
}
