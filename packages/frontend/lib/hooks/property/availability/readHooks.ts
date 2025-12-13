/**
 * Read hooks for availability management
 */

import * as React from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { getStartOfDayTimestamp, generateDatesToCheck } from "./utils";

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
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
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
 * Hook to get availability for a specific day
 * @deprecated Use useGetAvailableUnits instead
 */
export function useGetDayAvailability(tokenId: bigint | undefined, date: Date | undefined) {
  return useGetAvailableUnits(tokenId, date);
}

/**
 * Hook to check availability for multiple room types at once
 * Uses multicall for efficient batching
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

  const contracts = React.useMemo(() => {
    if (!hasValidParams || !checkInTimestamp || !checkOutTimestamp) return [];

    return tokenIds.map((tokenId) => ({
      ...CONTRACTS.availabilityManager,
      functionName: "checkAvailability" as const,
      args: [tokenId, checkInTimestamp, checkOutTimestamp] as const,
    }));
  }, [tokenIds, checkInTimestamp, checkOutTimestamp, hasValidParams]);

  const { data, isLoading, error } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: contracts as any[],
    query: {
      enabled: enabled && hasValidParams && contracts.length > 0,
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  });

  const availabilityMap = React.useMemo(() => {
    const map = new Map<string, boolean>();
    if (!data) return map;

    tokenIds.forEach((tokenId, index) => {
      const result = data[index];
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
 * Returns Sets of date strings (YYYY-MM-DD) for available and unavailable dates
 */
export function useCalendarAvailability(
  tokenIds: bigint[],
  startDate: Date | undefined,
  daysToCheck: number = 60,
  enabled: boolean = true
) {
  const datesToCheck = React.useMemo(() => {
    if (!startDate) return [];
    return generateDatesToCheck(startDate, daysToCheck);
  }, [startDate, daysToCheck]);

  const contracts = React.useMemo(() => {
    if (!enabled || tokenIds.length === 0 || datesToCheck.length === 0) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calls: any[] = [];

    for (const date of datesToCheck) {
      const dayStart = BigInt(getStartOfDayTimestamp(date));
      const dayEnd = dayStart + 86400n;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: contracts as any[],
    query: {
      enabled: enabled && contracts.length > 0,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  });

  const { availableDates, unavailableDates } = React.useMemo(() => {
    const available = new Set<string>();
    const unavailable = new Set<string>();

    if (!data || datesToCheck.length === 0 || tokenIds.length === 0) {
      return { availableDates: available, unavailableDates: unavailable };
    }

    const tokenCount = tokenIds.length;

    datesToCheck.forEach((date, dateIndex) => {
      let hasAnyAvailability = false;

      for (let tokenIndex = 0; tokenIndex < tokenCount; tokenIndex++) {
        const resultIndex = dateIndex * tokenCount + tokenIndex;
        const result = data[resultIndex];

        if (result?.status === "success" && result.result === true) {
          hasAnyAvailability = true;
          break;
        }
      }

      const dateStr = date.toISOString().split("T")[0];
      if (hasAnyAvailability) {
        available.add(dateStr);
      } else {
        unavailable.add(dateStr);
      }
    });

    return { availableDates: available, unavailableDates: unavailable };
  }, [data, datesToCheck, tokenIds]);

  return {
    availableDates,
    unavailableDates,
    isLoading,
    error,
    datesChecked: datesToCheck.length,
  };
}
