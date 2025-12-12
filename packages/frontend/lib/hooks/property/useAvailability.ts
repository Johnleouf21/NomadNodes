/**
 * Hooks for managing room availability via AvailabilityManager contract
 */

import * as React from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useReadContracts,
} from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

/**
 * Hook to set availability for a room type via AvailabilityManager
 * @param tokenId - The room type token ID
 * @param unitIndex - The specific unit (0 to totalSupply-1)
 * @param startDate - Start date
 * @param endDate - End date
 * @param available - True to mark as available, false to mark as booked
 */
export function useSetAvailability() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const setAvailability = React.useCallback(
    (tokenId: bigint, unitIndex: number, startDate: Date, endDate: Date, available: boolean) => {
      // IMPORTANT: Use start of day timestamps as required by smart contract
      const startTimestamp = BigInt(getStartOfDayTimestamp(startDate));

      // CRITICAL: Smart contract loop is `for (d = start; d < end; d += 1 days)`
      // So endDate must be the day AFTER the last day we want to update
      // If we want to update Dec 25, we need: start = Dec 25, end = Dec 26
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1); // Add one day
      const endTimestamp = BigInt(getStartOfDayTimestamp(nextDay));

      // Calculate number of days that will be updated
      const daysDiff = Math.ceil((nextDay.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Estimate gas: ~50k base + ~50k per day
      const estimatedGas = 50000 + daysDiff * 50000;

      writeContract({
        ...CONTRACTS.availabilityManager,
        functionName: "setAvailability",
        args: [tokenId, BigInt(unitIndex), startTimestamp, endTimestamp, available],
        gas: BigInt(Math.min(estimatedGas, 15000000)), // Cap at 15M to stay under block limit
      });
    },
    [writeContract]
  );

  return {
    setAvailability,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
  };
}

/**
 * Hook to set bulk availability for multiple units over a date range
 * Sets units 0 to numUnitsAvailable-1 as available, rest as unavailable
 * @param tokenId - The room type token ID
 * @param numUnitsAvailable - Number of units to mark as available (0 to totalSupply)
 * @param startDate - Start date
 * @param endDate - End date
 */
export function useSetBulkAvailability() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const setBulkAvailability = React.useCallback(
    (tokenId: bigint, numUnitsAvailable: number, startDate: Date, endDate: Date) => {
      // IMPORTANT: Use start of day timestamps as required by smart contract
      const startTimestamp = BigInt(getStartOfDayTimestamp(startDate));

      // CRITICAL: Smart contract loop is `for (d = start; d < end; d += 1 days)`
      // So endDate must be the day AFTER the last day we want to update
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1); // Add one day
      const endTimestamp = BigInt(getStartOfDayTimestamp(nextDay));

      // Calculate number of days that will be updated
      const daysDiff = Math.ceil((nextDay.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Estimate gas: base + (days * units * ~50k)
      // For 5 units over 30 days = ~7.5M gas
      const estimatedGas = 100000 + daysDiff * numUnitsAvailable * 50000;

      writeContract({
        ...CONTRACTS.availabilityManager,
        functionName: "setBulkAvailability",
        args: [tokenId, BigInt(numUnitsAvailable), startTimestamp, endTimestamp],
        gas: BigInt(Math.min(estimatedGas, 15000000)), // Cap at 15M to stay under block limit
      });
    },
    [writeContract]
  );

  return {
    setBulkAvailability,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
  };
}

/**
 * Hook to check availability for a specific date range via AvailabilityManager
 * Returns true if ANY unit is available for the date range
 */
export function useCheckAvailability(
  tokenId: bigint | undefined,
  checkIn: Date | undefined,
  checkOut: Date | undefined
) {
  const checkInTimestamp = checkIn ? BigInt(getStartOfDayTimestamp(checkIn)) : undefined;
  const checkOutTimestamp = checkOut ? BigInt(getStartOfDayTimestamp(checkOut)) : undefined;

  return useReadContract({
    ...CONTRACTS.availabilityManager,
    functionName: "checkAvailability",
    args:
      tokenId && checkInTimestamp && checkOutTimestamp
        ? [tokenId, checkInTimestamp, checkOutTimestamp]
        : undefined,
    query: {
      enabled: !!tokenId && !!checkInTimestamp && !!checkOutTimestamp,
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  });
}

/**
 * Hook to check if room is available for specific dates
 */
export function useIsRoomAvailable(
  tokenId: bigint | undefined,
  checkIn: Date | undefined,
  checkOut: Date | undefined
) {
  const checkInTimestamp = checkIn ? BigInt(getStartOfDayTimestamp(checkIn)) : undefined;
  const checkOutTimestamp = checkOut ? BigInt(getStartOfDayTimestamp(checkOut)) : undefined;

  return useReadContract({
    ...CONTRACTS.availabilityManager,
    functionName: "isRoomAvailable",
    args:
      tokenId && checkInTimestamp && checkOutTimestamp
        ? [tokenId, checkInTimestamp, checkOutTimestamp]
        : undefined,
    query: {
      enabled: !!tokenId && !!checkInTimestamp && !!checkOutTimestamp,
    },
  });
}

/**
 * Hook to get available units for a specific day
 */
export function useGetAvailableUnits(tokenId: bigint | undefined, date: Date | undefined) {
  const dayTimestamp = date ? BigInt(getStartOfDayTimestamp(date)) : undefined;
  // endTimestamp is next day start (dayTimestamp + 86400 seconds)
  const endTimestamp = dayTimestamp ? dayTimestamp + 86400n : undefined;

  return useReadContract({
    ...CONTRACTS.availabilityManager,
    functionName: "getAvailableUnits",
    args:
      tokenId && dayTimestamp && endTimestamp ? [tokenId, dayTimestamp, endTimestamp] : undefined,
    query: {
      enabled: !!tokenId && !!dayTimestamp,
    },
  });
}

/**
 * Helper to get start of day timestamp (normalized to UTC midnight)
 * Uses LOCAL date components to create UTC midnight timestamp
 * This ensures Dec 6 in user's timezone becomes Dec 6 00:00:00 UTC
 */
export function getStartOfDayTimestamp(date: Date): number {
  // Use Date.UTC with local date components to preserve the user's selected date
  // e.g., Dec 6 00:00 Paris (CET) → Dec 6 00:00:00 UTC (not Dec 5)
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 1000);
}

/**
 * Helper to get end of day timestamp
 * Uses LOCAL date components to create UTC end-of-day timestamp
 */
export function getEndOfDayTimestamp(date: Date): number {
  // Use Date.UTC with local date components + 23:59:59
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999) / 1000
  );
}

/**
 * Hook to get availability for a specific day
 * @deprecated Use useGetAvailableUnits instead
 */
export function useGetDayAvailability(tokenId: bigint | undefined, date: Date | undefined) {
  return useGetAvailableUnits(tokenId, date);
}

/**
 * Hook to check availability for multiple room types at once
 * Uses multicall for efficient batching
 * @param tokenIds - Array of room type token IDs
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @param enabled - Whether the query should run
 */
export function useCheckMultipleAvailability(
  tokenIds: bigint[],
  checkIn: Date | null | undefined,
  checkOut: Date | null | undefined,
  enabled: boolean = true
) {
  const checkInTimestamp = checkIn ? BigInt(getStartOfDayTimestamp(checkIn)) : undefined;
  const checkOutTimestamp = checkOut ? BigInt(getStartOfDayTimestamp(checkOut)) : undefined;

  const hasValidParams = !!checkInTimestamp && !!checkOutTimestamp && tokenIds.length > 0;

  // Build contract calls for each tokenId
  const contracts = React.useMemo(() => {
    if (!hasValidParams || !checkInTimestamp || !checkOutTimestamp) return [];

    return tokenIds.map((tokenId) => ({
      ...CONTRACTS.availabilityManager,
      functionName: "checkAvailability" as const,
      args: [tokenId, checkInTimestamp, checkOutTimestamp] as const,
    }));
  }, [tokenIds, checkInTimestamp, checkOutTimestamp, hasValidParams]);

  const { data, isLoading, error } = useReadContracts({
    contracts: contracts as any[], // Type assertion needed for wagmi's strict typing
    query: {
      enabled: enabled && hasValidParams && contracts.length > 0,
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  });

  // Build availability map from results
  const availabilityMap = React.useMemo(() => {
    const map = new Map<string, boolean>();

    if (!data) return map;

    tokenIds.forEach((tokenId, index) => {
      const result = data[index];
      // Result is { result: boolean, status: 'success' } or { error, status: 'failure' }
      const isAvailable = result?.status === "success" ? (result.result as boolean) : false;
      map.set(tokenId.toString(), isAvailable);
    });

    return map;
  }, [data, tokenIds]);

  return {
    availabilityMap,
    isLoading,
    error,
    hasValidParams,
  };
}

/**
 * Hook to get calendar availability for multiple room types over a date range
 * Returns a Set of date strings (YYYY-MM-DD) that have at least one available room
 * @param tokenIds - Array of room type token IDs
 * @param startDate - Start date for the calendar range
 * @param daysToCheck - Number of days to check (default 60)
 * @param enabled - Whether the query should run
 */
export function useCalendarAvailability(
  tokenIds: bigint[],
  startDate: Date | undefined,
  daysToCheck: number = 60,
  enabled: boolean = true
) {
  // Generate array of dates to check
  const datesToCheck = React.useMemo(() => {
    if (!startDate) return [];

    const dates: Date[] = [];
    // Create a new date at local midnight for the start date
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    for (let i = 0; i < daysToCheck; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [startDate, daysToCheck]);

  // Build contract calls for each tokenId x date combination
  // We check each day individually: checkAvailability(tokenId, dayStart, dayEnd)
  const contracts = React.useMemo(() => {
    if (!enabled || tokenIds.length === 0 || datesToCheck.length === 0) return [];

    const calls: any[] = [];

    for (const date of datesToCheck) {
      const dayStart = BigInt(getStartOfDayTimestamp(date));
      const dayEnd = dayStart + 86400n; // Next day

      for (const tokenId of tokenIds) {
        calls.push({
          ...CONTRACTS.availabilityManager,
          functionName: "checkAvailability" as const,
          args: [tokenId, dayStart, dayEnd] as const,
        });
      }
    }

    return calls;
  }, [tokenIds, datesToCheck, enabled]);

  const { data, isLoading, error } = useReadContracts({
    contracts: contracts as any[],
    query: {
      enabled: enabled && contracts.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  });

  // Build set of available dates
  const availableDates = React.useMemo(() => {
    const available = new Set<string>();

    if (!data || datesToCheck.length === 0 || tokenIds.length === 0) return available;

    // Results are organized as: [date0_token0, date0_token1, ..., date1_token0, date1_token1, ...]
    const tokenCount = tokenIds.length;

    datesToCheck.forEach((date, dateIndex) => {
      // Check if ANY room type has availability for this date
      for (let tokenIndex = 0; tokenIndex < tokenCount; tokenIndex++) {
        const resultIndex = dateIndex * tokenCount + tokenIndex;
        const result = data[resultIndex];

        if (result?.status === "success" && result.result === true) {
          // At least one room type is available, add date to set
          const dateStr = date.toISOString().split("T")[0];
          available.add(dateStr);
          break; // No need to check other room types for this date
        }
      }
    });

    return available;
  }, [data, datesToCheck, tokenIds]);

  // Also create a map for unavailable dates (for red highlighting)
  const unavailableDates = React.useMemo(() => {
    const unavailable = new Set<string>();

    if (!data || datesToCheck.length === 0 || tokenIds.length === 0) return unavailable;

    const tokenCount = tokenIds.length;

    datesToCheck.forEach((date, dateIndex) => {
      let hasAnyAvailability = false;

      // Check if ANY room type has availability for this date
      for (let tokenIndex = 0; tokenIndex < tokenCount; tokenIndex++) {
        const resultIndex = dateIndex * tokenCount + tokenIndex;
        const result = data[resultIndex];

        if (result?.status === "success" && result.result === true) {
          hasAnyAvailability = true;
          break;
        }
      }

      if (!hasAnyAvailability) {
        const dateStr = date.toISOString().split("T")[0];
        unavailable.add(dateStr);
      }
    });

    return unavailable;
  }, [data, datesToCheck, tokenIds]);

  return {
    availableDates,
    unavailableDates,
    isLoading,
    error,
    datesChecked: datesToCheck.length,
  };
}
