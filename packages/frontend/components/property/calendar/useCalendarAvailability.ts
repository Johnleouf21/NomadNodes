/**
 * Custom hook for managing calendar availability data
 * Optimized with batching and caching to reduce RPC calls
 */

import * as React from "react";
import { usePublicClient } from "wagmi";
import { getStartOfDayTimestamp } from "@/lib/hooks/property/availability";
import { CONTRACTS } from "@/lib/contracts";

// Simple in-memory cache for availability data
const availabilityCache = new Map<string, { data: number; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

function getCacheKey(tokenId: bigint, dateKey: string): string {
  return `${tokenId.toString()}-${dateKey}`;
}

export function useCalendarAvailability(
  tokenId: bigint | undefined,
  currentMonth: Date,
  maxSupply: number
) {
  const [availabilityData, setAvailabilityData] = React.useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = React.useState(false);
  const publicClient = usePublicClient();

  // Memoize month key to prevent unnecessary re-fetches
  const monthKey = React.useMemo(() => {
    return `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
  }, [currentMonth.getFullYear(), currentMonth.getMonth()]);

  // Load availability data from blockchain for current month with batching
  React.useEffect(() => {
    let isCancelled = false;

    const loadAvailabilityData = async () => {
      if (!publicClient || !tokenId) return;

      setIsLoading(true);
      const newData = new Map<string, number>();
      const now = Date.now();

      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Collect dates that need to be fetched (not in cache or expired)
        const datesToFetch: { date: Date; daySlot: bigint; dateKey: string }[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          const dateKey = date.toISOString().split("T")[0];
          const cacheKey = getCacheKey(tokenId, dateKey);
          const cached = availabilityCache.get(cacheKey);

          if (cached && now - cached.timestamp < CACHE_TTL) {
            // Use cached data
            if (cached.data !== maxSupply) {
              newData.set(dateKey, cached.data);
            }
          } else {
            // Need to fetch
            const daySlot = BigInt(Math.floor(getStartOfDayTimestamp(date) / 86400));
            datesToFetch.push({ date, daySlot, dateKey });
          }
        }

        // If all data is cached, we're done
        if (datesToFetch.length === 0) {
          if (!isCancelled) {
            setAvailabilityData(newData);
            setIsLoading(false);
          }
          return;
        }

        // Batch fetch with multicall (fetch up to 10 at a time to avoid rate limits)
        const BATCH_SIZE = 10;
        for (let i = 0; i < datesToFetch.length; i += BATCH_SIZE) {
          if (isCancelled) break;

          const batch = datesToFetch.slice(i, i + BATCH_SIZE);

          // Use Promise.allSettled to handle partial failures gracefully
          const results = await Promise.allSettled(
            batch.map(({ date }) => {
              const startTimestamp = BigInt(getStartOfDayTimestamp(date));
              // endDate is end of the same day (start + 86400 seconds = next day start)
              const endTimestamp = startTimestamp + 86400n;
              return publicClient.readContract({
                ...CONTRACTS.availabilityManager,
                functionName: "getAvailableUnits",
                args: [tokenId, startTimestamp, endTimestamp],
              });
            })
          );

          // Process results
          results.forEach((result, idx) => {
            const { dateKey } = batch[idx];
            const cacheKey = getCacheKey(tokenId, dateKey);

            if (result.status === "fulfilled") {
              const available = result.value as bigint;
              const availableUnits = Number(available || 0n);

              // Cache the result
              availabilityCache.set(cacheKey, { data: availableUnits, timestamp: now });

              if (availableUnits !== maxSupply) {
                newData.set(dateKey, availableUnits);
              }
            } else {
              console.error(`Failed to load availability for ${dateKey}:`, result.reason);
            }
          });

          // Small delay between batches to avoid rate limiting
          if (i + BATCH_SIZE < datesToFetch.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        if (!isCancelled) {
          setAvailabilityData(newData);
        }
      } catch (error) {
        console.error("Failed to load availability data:", error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAvailabilityData();

    return () => {
      isCancelled = true;
    };
  }, [monthKey, tokenId, maxSupply, publicClient]);

  const getAvailability = React.useCallback(
    (date: Date) => {
      const dateKey = date.toISOString().split("T")[0];
      return availabilityData.get(dateKey) ?? maxSupply;
    },
    [availabilityData, maxSupply]
  );

  // Invalidate cache for a specific date (call after booking)
  const invalidateDate = React.useCallback(
    (date: Date) => {
      if (!tokenId) return;
      const dateKey = date.toISOString().split("T")[0];
      const cacheKey = getCacheKey(tokenId, dateKey);
      availabilityCache.delete(cacheKey);
    },
    [tokenId]
  );

  return {
    availabilityData,
    isLoading,
    getAvailability,
    setAvailabilityData,
    invalidateDate,
  };
}
