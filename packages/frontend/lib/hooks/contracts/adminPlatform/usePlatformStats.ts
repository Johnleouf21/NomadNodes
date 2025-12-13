/**
 * Platform Statistics Hooks
 */

import { useReadContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { CONTRACTS } from "@/lib/contracts";
import { PONDER_URL } from "./constants";
import type { GlobalStats, PlatformStats } from "./types";

/**
 * Get total number of properties registered
 */
export function useTotalProperties() {
  return useReadContract({
    ...CONTRACTS.propertyRegistry,
    functionName: "totalProperties",
  });
}

/**
 * Get total number of escrows created
 */
export function useEscrowCount() {
  return useReadContract({
    ...CONTRACTS.escrowRegistry,
    functionName: "escrowCount",
  });
}

/**
 * Global stats from Ponder's pre-computed globalStats table
 */
export function useGlobalStats() {
  return useQuery<GlobalStats | null>({
    queryKey: ["globalStats"],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            globalStats(id: "global") {
              totalProperties
              totalActiveProperties
              totalRoomTypes
              totalBookings
              totalCompletedBookings
              totalReviews
              totalTravelers
              totalHosts
              totalVolume
              lastUpdatedAt
            }
          }`,
        }),
      });
      const result = await response.json();
      return result.data?.globalStats || null;
    },
  });
}

/**
 * Platform stats from Ponder - comprehensive overview
 * Computes stats directly from individual queries for reliability
 */
export function usePlatformStats() {
  return useQuery<PlatformStats>({
    queryKey: ["platformStats"],
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Fetch all stats in parallel
      const [propertiesRes, roomTypesRes, bookingsRes, hostsRes, travelersRes, reviewsRes] =
        await Promise.all([
          fetch(`${PONDER_URL}/graphql`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `query { allProperties: propertys(limit: 1000) { items { id isActive } } }`,
            }),
          }),
          fetch(`${PONDER_URL}/graphql`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `query { roomTypes(limit: 1000) { items { id isActive } } }`,
            }),
          }),
          fetch(`${PONDER_URL}/graphql`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `query { bookings(limit: 1000) { items { id status totalPrice } } }`,
            }),
          }),
          fetch(`${PONDER_URL}/graphql`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `query { hosts(limit: 1000) { items { id isSuspended isSuperHost tier } } }`,
            }),
          }),
          fetch(`${PONDER_URL}/graphql`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `query { travelers(limit: 1000) { items { id isSuspended tier } } }`,
            }),
          }),
          fetch(`${PONDER_URL}/graphql`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `query { reviews(limit: 1000) { items { id } } }`,
            }),
          }),
        ]);

      const [propertiesData, roomTypesData, bookingsData, hostsData, travelersData, reviewsData] =
        await Promise.all([
          propertiesRes.json(),
          roomTypesRes.json(),
          bookingsRes.json(),
          hostsRes.json(),
          travelersRes.json(),
          reviewsRes.json(),
        ]);

      // Log errors if any
      if (propertiesData.errors)
        console.error("[Admin] Properties query error:", propertiesData.errors);
      if (roomTypesData.errors)
        console.error("[Admin] RoomTypes query error:", roomTypesData.errors);
      if (bookingsData.errors) console.error("[Admin] Bookings query error:", bookingsData.errors);
      if (hostsData.errors) console.error("[Admin] Hosts query error:", hostsData.errors);
      if (travelersData.errors)
        console.error("[Admin] Travelers query error:", travelersData.errors);
      if (reviewsData.errors) console.error("[Admin] Reviews query error:", reviewsData.errors);

      // Extract data with fallbacks
      const properties = propertiesData.data?.allProperties?.items || [];
      const roomTypes = roomTypesData.data?.roomTypes?.items || [];
      const allBookings = bookingsData.data?.bookings?.items || [];
      const hosts = hostsData.data?.hosts?.items || [];
      const travelers = travelersData.data?.travelers?.items || [];
      const reviews = reviewsData.data?.reviews?.items || [];

      // Group bookings by status
      const pending = allBookings.filter((b: { status: string }) => b.status === "Pending");
      const confirmed = allBookings.filter((b: { status: string }) => b.status === "Confirmed");
      const checkedIn = allBookings.filter((b: { status: string }) => b.status === "CheckedIn");
      const completed = allBookings.filter((b: { status: string }) => b.status === "Completed");
      const cancelled = allBookings.filter((b: { status: string }) => b.status === "Cancelled");

      // Calculate property stats
      const activeProperties = properties.filter((p: { isActive: boolean }) => p.isActive).length;
      const activeRoomTypes = roomTypes.filter((r: { isActive: boolean }) => r.isActive).length;

      // Calculate volumes
      const totalVolume = allBookings.reduce(
        (sum: number, b: { totalPrice: string }) => sum + Number(b.totalPrice || 0) / 1e6,
        0
      );
      const totalRevenue = completed.reduce(
        (sum: number, b: { totalPrice: string }) => sum + Number(b.totalPrice || 0) / 1e6,
        0
      );
      const pendingValue = [...pending, ...confirmed, ...checkedIn].reduce(
        (sum: number, b: { totalPrice: string }) => sum + Number(b.totalPrice || 0) / 1e6,
        0
      );

      // Host tiers breakdown
      const superHosts = hosts.filter((h: { isSuperHost: boolean }) => h.isSuperHost).length;
      const hostsByTier = {
        newcomer: hosts.filter((h: { tier: string }) => h.tier === "Newcomer").length,
        experienced: hosts.filter((h: { tier: string }) => h.tier === "Experienced").length,
        pro: hosts.filter((h: { tier: string }) => h.tier === "Pro").length,
        superHost: hosts.filter((h: { tier: string }) => h.tier === "SuperHost").length,
      };

      // Traveler tiers breakdown
      const travelersByTier = {
        newcomer: travelers.filter((t: { tier: string }) => t.tier === "Newcomer").length,
        regular: travelers.filter((t: { tier: string }) => t.tier === "Regular").length,
        trusted: travelers.filter((t: { tier: string }) => t.tier === "Trusted").length,
        elite: travelers.filter((t: { tier: string }) => t.tier === "Elite").length,
      };

      return {
        properties: {
          total: properties.length,
          active: activeProperties,
          inactive: properties.length - activeProperties,
          roomTypes: roomTypes.length,
          activeRoomTypes,
        },
        bookings: {
          total: allBookings.length,
          pending: pending.length,
          confirmed: confirmed.length,
          checkedIn: checkedIn.length,
          completed: completed.length,
          cancelled: cancelled.length,
        },
        users: {
          totalHosts: hosts.length,
          suspendedHosts: hosts.filter((h: { isSuspended: boolean }) => h.isSuspended).length,
          superHosts,
          hostsByTier,
          totalTravelers: travelers.length,
          suspendedTravelers: travelers.filter((t: { isSuspended: boolean }) => t.isSuspended)
            .length,
          travelersByTier,
        },
        revenue: {
          totalVolume,
          totalCompleted: totalRevenue,
          pendingValue,
          platformFees: totalRevenue * 0.05,
        },
        reviews: {
          total: reviews.length,
        },
      };
    },
  });
}
