"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Hook to invalidate React Query caches after blockchain transactions
 *
 * Usage:
 * const { invalidateBookings, invalidateAll } = useInvalidateQueries();
 *
 * After a successful transaction:
 * await invalidateBookings(); // Invalidates all booking-related caches
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  // Invalidate all booking-related queries
  // This will refetch all usePonderBookings hooks
  const invalidateBookings = useCallback(
    async (delay = 2000) => {
      // Wait for Ponder indexer to process the blockchain event
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Invalidate all queries that start with "bookings"
      await queryClient.invalidateQueries({
        queryKey: ["bookings"],
      });
    },
    [queryClient]
  );

  // Invalidate all property-related queries
  const invalidateProperties = useCallback(
    async (delay = 2000) => {
      await new Promise((resolve) => setTimeout(resolve, delay));

      await queryClient.invalidateQueries({
        queryKey: ["properties"],
      });
    },
    [queryClient]
  );

  // Invalidate all review-related queries
  const invalidateReviews = useCallback(
    async (delay = 2000) => {
      await new Promise((resolve) => setTimeout(resolve, delay));

      await queryClient.invalidateQueries({
        queryKey: ["reviews"],
      });
    },
    [queryClient]
  );

  // Invalidate escrow-related queries (for withdraw status, etc.)
  const invalidateEscrows = useCallback(
    async (delay = 2000) => {
      await new Promise((resolve) => setTimeout(resolve, delay));

      await queryClient.invalidateQueries({
        queryKey: ["escrows"],
      });
      // Also invalidate bookings since escrow status affects booking display
      await queryClient.invalidateQueries({
        queryKey: ["bookings"],
      });
    },
    [queryClient]
  );

  // Invalidate traveler/host profile data
  const invalidateProfiles = useCallback(
    async (delay = 2000) => {
      await new Promise((resolve) => setTimeout(resolve, delay));

      await queryClient.invalidateQueries({
        queryKey: ["traveler"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["host"],
      });
    },
    [queryClient]
  );

  // Invalidate everything (use sparingly)
  const invalidateAll = useCallback(
    async (delay = 2000) => {
      await new Promise((resolve) => setTimeout(resolve, delay));

      await queryClient.invalidateQueries();
    },
    [queryClient]
  );

  // Convenience method for post-booking transaction
  // Invalidates bookings + escrows
  const invalidateAfterBooking = useCallback(
    async (delay = 2000) => {
      await new Promise((resolve) => setTimeout(resolve, delay));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["escrows"] }),
      ]);
    },
    [queryClient]
  );

  // Convenience method for post-review transaction
  // Invalidates reviews + profiles (ratings update)
  const invalidateAfterReview = useCallback(
    async (delay = 2000) => {
      await new Promise((resolve) => setTimeout(resolve, delay));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["traveler"] }),
        queryClient.invalidateQueries({ queryKey: ["host"] }),
      ]);
    },
    [queryClient]
  );

  return {
    invalidateBookings,
    invalidateProperties,
    invalidateReviews,
    invalidateEscrows,
    invalidateProfiles,
    invalidateAll,
    invalidateAfterBooking,
    invalidateAfterReview,
  };
}
