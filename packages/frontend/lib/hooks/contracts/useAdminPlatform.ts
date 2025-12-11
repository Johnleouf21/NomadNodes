/**
 * Admin Platform Management Hooks
 * For platform-wide statistics, user management, and property oversight
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { CONTRACTS } from "@/lib/contracts";
import type { Address } from "viem";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

// ===== Platform Statistics =====

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
export interface GlobalStats {
  totalProperties: string;
  totalActiveProperties: string;
  totalRoomTypes: string;
  totalBookings: string;
  totalCompletedBookings: string;
  totalReviews: string;
  totalTravelers: string;
  totalHosts: string;
  totalVolume: string;
  lastUpdatedAt: string;
}

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
  return useQuery({
    queryKey: ["platformStats"],
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Fetch all stats in parallel - direct queries for reliability
      const [propertiesRes, roomTypesRes, bookingsRes, hostsRes, travelersRes, reviewsRes] =
        await Promise.all([
          // Properties
          fetch(`${PONDER_URL}/graphql`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `query {
              allProperties: propertys(limit: 1000) { items { id isActive } }
            }`,
            }),
          }),
          // Room types
          fetch(`${PONDER_URL}/graphql`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `query {
              roomTypes(limit: 1000) { items { id isActive } }
            }`,
            }),
          }),
          // All bookings (single query is more reliable)
          fetch(`${PONDER_URL}/graphql`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `query {
              bookings(limit: 1000) { items { id status totalPrice } }
            }`,
            }),
          }),
          // Hosts with tier info
          fetch(`${PONDER_URL}/graphql`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `query { hosts(limit: 1000) { items { id isSuspended isSuperHost tier } } }`,
            }),
          }),
          // Travelers with tier info
          fetch(`${PONDER_URL}/graphql`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `query { travelers(limit: 1000) { items { id isSuspended tier } } }`,
            }),
          }),
          // Reviews
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

      // Debug logging
      console.log("[Admin Stats] Data fetched:", {
        ponderUrl: PONDER_URL,
        properties: properties.length,
        roomTypes: roomTypes.length,
        bookings: allBookings.length,
        hosts: hosts.length,
        travelers: travelers.length,
        reviews: reviews.length,
      });

      // Group bookings by status
      const pending = allBookings.filter((b: { status: string }) => b.status === "Pending");
      const confirmed = allBookings.filter((b: { status: string }) => b.status === "Confirmed");
      const checkedIn = allBookings.filter((b: { status: string }) => b.status === "CheckedIn");
      const completed = allBookings.filter((b: { status: string }) => b.status === "Completed");
      const cancelled = allBookings.filter((b: { status: string }) => b.status === "Cancelled");

      console.log("[Admin Stats] Bookings by status:", {
        pending: pending.length,
        confirmed: confirmed.length,
        checkedIn: checkedIn.length,
        completed: completed.length,
        cancelled: cancelled.length,
      });

      // Calculate property stats
      const activeProperties = properties.filter((p: { isActive: boolean }) => p.isActive).length;
      const activeRoomTypes = roomTypes.filter((r: { isActive: boolean }) => r.isActive).length;

      // Calculate total volume from all bookings (not just completed)
      const totalVolume = allBookings.reduce(
        (sum: number, b: { totalPrice: string }) => sum + Number(b.totalPrice || 0) / 1e6,
        0
      );

      // Calculate revenue from completed bookings - price is in 6 decimals (USDC)
      const totalRevenue = completed.reduce(
        (sum: number, b: { totalPrice: string }) => sum + Number(b.totalPrice || 0) / 1e6,
        0
      );

      // Calculate pending value (in escrow)
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

      const result = {
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
          platformFees: totalRevenue * 0.05, // 5% platform fee
        },
        reviews: {
          total: reviews.length,
        },
      };

      console.log("[Admin Stats] Final result:", result);
      return result;
    },
  });
}

// ===== User Management (Hosts) =====

export interface HostProfile {
  totalPropertiesListed: bigint;
  totalBookingsReceived: bigint;
  completedBookings: bigint;
  averageRating: bigint;
  positiveReviews: bigint;
  avgResponseTimeHours: bigint;
  acceptanceRate: bigint;
  cancellations: bigint;
  reputationTier: number;
  isSuperhost: boolean;
  timesReported: bigint;
  isSuspended: boolean;
}

/**
 * Get host profile from contract
 */
export function useHostProfile(hostAddress: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.hostSBT,
    functionName: "getProfile",
    args: hostAddress ? [hostAddress] : undefined,
    query: {
      enabled: !!hostAddress,
    },
  });
}

/**
 * Suspend a host (owner only)
 */
export function useSuspendHost() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const suspendHost = (hostAddress: Address) => {
    writeContract({
      ...CONTRACTS.hostSBT,
      functionName: "suspendHost",
      args: [hostAddress],
    });
  };

  return { suspendHost, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Unsuspend a host (owner only)
 */
export function useUnsuspendHost() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const unsuspendHost = (hostAddress: Address) => {
    writeContract({
      ...CONTRACTS.hostSBT,
      functionName: "unsuspendHost",
      args: [hostAddress],
    });
  };

  return { unsuspendHost, hash, isPending, isConfirming, isSuccess, error, reset };
}

// ===== User Management (Travelers) =====

export interface TravelerProfile {
  totalBookings: bigint;
  completedStays: bigint;
  cancellations: bigint;
  averageRating: bigint;
  reviewsReceived: bigint;
  positiveReviews: bigint;
  reputationTier: number;
  timesReported: bigint;
  isSuspended: boolean;
}

/**
 * Get traveler profile from contract
 */
export function useTravelerProfile(travelerAddress: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.travelerSBT,
    functionName: "getProfile",
    args: travelerAddress ? [travelerAddress] : undefined,
    query: {
      enabled: !!travelerAddress,
    },
  });
}

/**
 * Suspend a traveler (owner only)
 */
export function useSuspendTraveler() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const suspendTraveler = (travelerAddress: Address) => {
    writeContract({
      ...CONTRACTS.travelerSBT,
      functionName: "suspendTraveler",
      args: [travelerAddress],
    });
  };

  return { suspendTraveler, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Unsuspend a traveler (owner only)
 */
export function useUnsuspendTraveler() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const unsuspendTraveler = (travelerAddress: Address) => {
    writeContract({
      ...CONTRACTS.travelerSBT,
      functionName: "unsuspendTraveler",
      args: [travelerAddress],
    });
  };

  return { unsuspendTraveler, hash, isPending, isConfirming, isSuccess, error, reset };
}

// ===== Ponder Queries for Users =====

export interface PonderHost {
  id: string;
  wallet: string;
  tokenId: string;
  tier: string;
  isSuperHost: boolean;
  averageRating: string;
  totalPropertiesListed: string;
  totalBookingsReceived: string;
  completedBookings: string;
  totalReviewsReceived: string;
  isSuspended: boolean;
  memberSince: string;
  lastActivityAt: string;
}

export interface PonderTraveler {
  id: string;
  wallet: string;
  tokenId: string;
  tier: string;
  averageRating: string;
  totalBookings: string;
  completedStays: string;
  cancellations: string;
  totalReviewsReceived: string;
  isSuspended: boolean;
  memberSince: string;
  lastActivityAt: string;
}

/**
 * Fetch all hosts from Ponder
 */
export function usePonderHosts() {
  return useQuery<PonderHost[]>({
    queryKey: ["adminHosts"],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            hosts(limit: 1000, orderBy: "memberSince", orderDirection: "desc") {
              items {
                id
                wallet
                tokenId
                tier
                isSuperHost
                averageRating
                totalPropertiesListed
                totalBookingsReceived
                completedBookings
                totalReviewsReceived
                isSuspended
                memberSince
                lastActivityAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.hosts?.items || [];
    },
  });
}

/**
 * Fetch all travelers from Ponder
 */
export function usePonderTravelers() {
  return useQuery<PonderTraveler[]>({
    queryKey: ["adminTravelers"],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            travelers(limit: 1000, orderBy: "memberSince", orderDirection: "desc") {
              items {
                id
                wallet
                tokenId
                tier
                averageRating
                totalBookings
                completedStays
                cancelledBookings
                totalReviewsReceived
                isSuspended
                memberSince
                lastActivityAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      // Map cancelledBookings to cancellations for backwards compatibility
      const items = result.data?.travelers?.items || [];
      return items.map((t: Record<string, unknown>) => ({
        ...t,
        cancellations: t.cancelledBookings,
      }));
    },
  });
}

// ===== Properties Oversight =====

export interface AdminProperty {
  id: string;
  propertyId: string;
  host: string;
  isActive: boolean;
  averageRating: string;
  totalRatings: string;
  propertyType: string;
  location: string;
  createdAt: string;
  ipfsHash: string;
}

/**
 * Fetch all properties for admin oversight
 */
export function useAdminProperties() {
  return useQuery<AdminProperty[]>({
    queryKey: ["adminProperties"],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            propertys(limit: 1000, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                propertyId
                host
                isActive
                averageRating
                totalRatings
                propertyType
                location
                createdAt
                ipfsHash
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.propertys?.items || [];
    },
  });
}

// ===== Room Types =====

export interface RoomType {
  id: string;
  tokenId: string;
  propertyId: string;
  roomTypeId: string;
  name: string;
  pricePerNight: string;
  cleaningFee: string;
  maxGuests: string;
  totalSupply: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}

/**
 * Fetch room types for a property
 */
export function usePropertyRoomTypes(propertyId: string | undefined) {
  return useQuery<RoomType[]>({
    queryKey: ["propertyRoomTypes", propertyId],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!propertyId,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            roomTypes(where: { propertyId: "${propertyId}" }, limit: 100) {
              items {
                id
                tokenId
                propertyId
                roomTypeId
                name
                pricePerNight
                cleaningFee
                maxGuests
                totalSupply
                isActive
                isDeleted
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.roomTypes?.items || [];
    },
  });
}

/**
 * Fetch all room types
 */
export function useAllRoomTypes() {
  return useQuery<RoomType[]>({
    queryKey: ["allRoomTypes"],
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            roomTypes(limit: 1000, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                tokenId
                propertyId
                roomTypeId
                name
                pricePerNight
                cleaningFee
                maxGuests
                totalSupply
                isActive
                isDeleted
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.roomTypes?.items || [];
    },
  });
}

// ===== Escrow Data =====

export interface EscrowData {
  id: string;
  tokenId: string;
  traveler: string;
  host: string;
  currency: string;
  price: string;
  checkIn: string;
  checkOut: string;
  createdAt: string;
}

/**
 * Fetch all escrows
 */
export function useAllEscrows() {
  return useQuery<EscrowData[]>({
    queryKey: ["allEscrows"],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            escrows(limit: 1000, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                tokenId
                traveler
                host
                currency
                price
                checkIn
                checkOut
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.escrows?.items || [];
    },
  });
}

// ===== Recent Activity =====

export interface RecentBooking {
  id: string;
  propertyId: string;
  roomTypeId: string;
  traveler: string;
  status: string;
  totalPrice: string;
  checkInDate: string;
  checkOutDate: string;
  escrowAddress: string | null;
  createdAt: string;
}

/**
 * Fetch recent bookings for activity feed
 */
export function useRecentBookings(limit: number = 10) {
  return useQuery<RecentBooking[]>({
    queryKey: ["recentBookings", limit],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            bookings(limit: ${limit}, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                propertyId
                roomTypeId
                traveler
                status
                totalPrice
                checkInDate
                checkOutDate
                escrowAddress
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.bookings?.items || [];
    },
  });
}

// ===== Reviews from Ponder =====

export interface PonderReview {
  id: string;
  reviewId: string;
  propertyId: string;
  reviewer: string;
  reviewee: string;
  rating: number;
  isFlagged: boolean;
  helpfulVotes: string;
  unhelpfulVotes: string;
  createdAt: string;
}

/**
 * Fetch all published reviews from Ponder
 */
export function usePonderReviews(limit: number = 100) {
  return useQuery<PonderReview[]>({
    queryKey: ["adminReviews", limit],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            reviews(limit: ${limit}, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                reviewId
                propertyId
                reviewer
                reviewee
                rating
                isFlagged
                helpfulVotes
                unhelpfulVotes
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.reviews?.items || [];
    },
  });
}

/**
 * Fetch reviews for a specific property
 */
export function usePropertyReviews(propertyId: string | undefined) {
  return useQuery<PonderReview[]>({
    queryKey: ["propertyReviews", propertyId],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!propertyId,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            reviews(where: { propertyId: "${propertyId}" }, limit: 100, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                reviewId
                propertyId
                reviewer
                reviewee
                rating
                isFlagged
                helpfulVotes
                unhelpfulVotes
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.reviews?.items || [];
    },
  });
}

/**
 * Fetch flagged reviews (for moderation)
 */
export function useFlaggedReviews() {
  return useQuery<PonderReview[]>({
    queryKey: ["flaggedReviews"],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            reviews(where: { isFlagged: true }, limit: 100, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                reviewId
                propertyId
                reviewer
                reviewee
                rating
                isFlagged
                helpfulVotes
                unhelpfulVotes
                createdAt
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.reviews?.items || [];
    },
  });
}

// ===== Bookings by Status =====

/**
 * Fetch bookings filtered by status
 */
export function useBookingsByStatus(status?: string) {
  return useQuery<RecentBooking[]>({
    queryKey: ["bookingsByStatus", status],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const whereClause = status ? `where: { status: "${status}" }` : "";
      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            bookings(${whereClause}, limit: 1000, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                propertyId
                traveler
                status
                totalPrice
                checkInDate
                checkOutDate
                createdAt
                escrowAddress
              }
            }
          }`,
        }),
      });

      const result = await response.json();
      return result.data?.bookings?.items || [];
    },
  });
}
