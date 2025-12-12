/**
 * User Profile Hooks - Fetches user activity data from Ponder
 * Used for profile page to display real activity history, achievements, etc.
 */

import { useQuery } from "@tanstack/react-query";

const PONDER_URL =
  process.env.NEXT_PUBLIC_PONDER_URL || "https://nomadnodes-production.up.railway.app";

// ===== Types =====

export interface UserBooking {
  id: string;
  propertyId: string;
  roomTypeId: string;
  traveler: string;
  status: string;
  totalPrice: string;
  checkInDate: string;
  checkOutDate: string;
  createdAt: string;
  escrowAddress?: string;
}

export interface UserReview {
  id: string;
  reviewId: string;
  propertyId: string;
  reviewer: string;
  reviewee: string;
  rating: number;
  helpfulVotes: string | number;
  unhelpfulVotes: string | number;
  createdAt: string;
  isFlagged: boolean;
}

export interface UserProperty {
  id: string;
  propertyId: string;
  host: string;
  location: string;
  propertyType: string;
  isActive: boolean;
  averageRating: string;
  totalRatings: string;
  createdAt: string;
}

export interface HostProfileData {
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

export interface TravelerProfileData {
  id: string;
  wallet: string;
  tokenId: string;
  tier: string;
  averageRating: string;
  totalBookings: string;
  completedStays: string;
  cancelledBookings: string;
  totalReviewsReceived: string;
  isSuspended: boolean;
  memberSince: string;
  lastActivityAt: string;
}

export interface UserActivity {
  id: string;
  type: "booking" | "review" | "listing" | "review_received" | "mint";
  title: string;
  description: string;
  date: Date;
  status?: "completed" | "upcoming" | "active" | "cancelled";
  propertyId?: string;
  rating?: number;
}

// Date filter options for activity timeline
export type DateFilterOption = "7d" | "30d" | "90d" | "1y" | "all";

export function getDateFilterTimestamp(filter: DateFilterOption): number | null {
  if (filter === "all") return null;

  const now = new Date();
  switch (filter) {
    case "7d":
      return Math.floor((now.getTime() - 7 * 24 * 60 * 60 * 1000) / 1000);
    case "30d":
      return Math.floor((now.getTime() - 30 * 24 * 60 * 60 * 1000) / 1000);
    case "90d":
      return Math.floor((now.getTime() - 90 * 24 * 60 * 60 * 1000) / 1000);
    case "1y":
      return Math.floor((now.getTime() - 365 * 24 * 60 * 60 * 1000) / 1000);
    default:
      return null;
  }
}

export type AchievementCategory = "traveler" | "host" | "community";
export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  unlockHint: string; // How to unlock this achievement
  icon: string;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
  color: string;
  bgColor: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  earnedAt?: Date;
}

// ===== Hooks =====

/**
 * Fetch user's bookings (as traveler)
 */
export function useUserBookings(address: string | undefined, dateFilter?: DateFilterOption) {
  const minTimestamp = dateFilter ? getDateFilterTimestamp(dateFilter) : null;

  return useQuery<UserBooking[]>({
    queryKey: ["userBookings", address, dateFilter],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!address,
    queryFn: async () => {
      if (!address) return [];

      // Build where clause with optional date filter
      const whereConditions = [`traveler: "${address.toLowerCase()}"`];
      if (minTimestamp) {
        whereConditions.push(`createdAt_gte: "${minTimestamp}"`);
      }
      const whereClause = `{ ${whereConditions.join(", ")} }`;

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            bookings(where: ${whereClause}, limit: 100, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                propertyId
                roomTypeId
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

/**
 * Fetch reviews submitted by user
 */
export function useUserReviewsSubmitted(
  address: string | undefined,
  dateFilter?: DateFilterOption
) {
  const minTimestamp = dateFilter ? getDateFilterTimestamp(dateFilter) : null;

  return useQuery<UserReview[]>({
    queryKey: ["userReviewsSubmitted", address, dateFilter],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!address,
    queryFn: async () => {
      if (!address) return [];

      // Build where clause with optional date filter
      const whereConditions = [`reviewer: "${address.toLowerCase()}"`];
      if (minTimestamp) {
        whereConditions.push(`createdAt_gte: "${minTimestamp}"`);
      }
      const whereClause = `{ ${whereConditions.join(", ")} }`;

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            reviews(where: ${whereClause}, limit: 100, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                reviewId
                propertyId
                reviewer
                reviewee
                rating
                helpfulVotes
                unhelpfulVotes
                createdAt
                isFlagged
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
 * Fetch reviews received by user
 */
export function useUserReviewsReceived(address: string | undefined) {
  return useQuery<UserReview[]>({
    queryKey: ["userReviewsReceived", address],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!address,
    queryFn: async () => {
      if (!address) return [];

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            reviews(where: { reviewee: "${address.toLowerCase()}" }, limit: 100, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                reviewId
                propertyId
                reviewer
                reviewee
                rating
                helpfulVotes
                unhelpfulVotes
                createdAt
                isFlagged
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
 * Fetch user's properties (as host)
 */
export function useUserProperties(address: string | undefined, dateFilter?: DateFilterOption) {
  const minTimestamp = dateFilter ? getDateFilterTimestamp(dateFilter) : null;

  return useQuery<UserProperty[]>({
    queryKey: ["userProperties", address, dateFilter],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!address,
    queryFn: async () => {
      if (!address) return [];

      // Build where clause with optional date filter
      const whereConditions = [`host: "${address.toLowerCase()}"`];
      if (minTimestamp) {
        whereConditions.push(`createdAt_gte: "${minTimestamp}"`);
      }
      const whereClause = `{ ${whereConditions.join(", ")} }`;

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            propertys(where: ${whereClause}, limit: 100, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                propertyId
                host
                location
                propertyType
                isActive
                averageRating
                totalRatings
                createdAt
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

/**
 * Fetch host profile from Ponder
 */
export function useHostProfile(address: string | undefined) {
  return useQuery<HostProfileData | null>({
    queryKey: ["hostProfile", address],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!address,
    queryFn: async () => {
      if (!address) return null;

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            hosts(where: { wallet: "${address.toLowerCase()}" }, limit: 1) {
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
      return result.data?.hosts?.items?.[0] || null;
    },
  });
}

/**
 * Fetch traveler profile from Ponder
 */
export function useTravelerProfile(address: string | undefined) {
  return useQuery<TravelerProfileData | null>({
    queryKey: ["travelerProfile", address],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!address,
    queryFn: async () => {
      if (!address) return null;

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            travelers(where: { wallet: "${address.toLowerCase()}" }, limit: 1) {
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
      return result.data?.travelers?.items?.[0] || null;
    },
  });
}

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

/**
 * Transform raw data into activity timeline with optional date filter
 */
export function useUserActivityTimeline(
  address: string | undefined,
  dateFilter: DateFilterOption = "30d"
) {
  // Use filtered hooks for activity timeline
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

/**
 * Calculate user achievements based on real data
 */
export function useUserAchievements(address: string | undefined) {
  const {
    bookings,
    reviewsSubmitted,
    reviewsReceived,
    properties,
    hostProfile,
    travelerProfile,
    isLoading,
  } = useFullUserProfile(address);

  const achievements: UserAchievement[] = [];

  // Calculate stats
  const completedBookings = bookings.filter((b) => b.status === "Completed").length;
  const totalSpent = bookings
    .filter((b) => b.status === "Completed")
    .reduce((sum, b) => sum + Number(b.totalPrice) / 1e6, 0);
  const uniqueProperties = new Set(bookings.map((b) => b.propertyId)).size;
  const hasAnySBT = !!hostProfile || !!travelerProfile;
  const isSuperHost = hostProfile?.isSuperHost || false;
  const hostBookingsReceived = hostProfile ? Number(hostProfile.totalBookingsReceived) : 0;
  const avgRating = travelerProfile
    ? Number(travelerProfile.averageRating) / 100
    : hostProfile
      ? Number(hostProfile.averageRating) / 100
      : 0;
  const hasPerfectRating =
    reviewsReceived.length > 0 && reviewsReceived.every((r) => r.rating === 5);
  const isEliteTier = travelerProfile?.tier === "Elite" || hostProfile?.tier === "SuperHost";

  // Get earliest dates for earnedAt
  const getEarliestDate = (items: { createdAt: string }[]) => {
    if (items.length === 0) return undefined;
    const timestamps = items.map((i) => Number(i.createdAt)).filter((t) => t > 0);
    if (timestamps.length === 0) return undefined;
    return new Date(Math.min(...timestamps) * 1000);
  };

  // ===== COMMUNITY BADGES =====

  // Early Adopter - Has any SBT (LEGENDARY - first users)
  achievements.push({
    id: "early-adopter",
    name: "Early Adopter",
    description: "One of the first to join NomadNodes",
    unlockHint: "Mint a Traveler or Host SBT to join the platform",
    icon: "Award",
    earned: hasAnySBT,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10",
    category: "community",
    rarity: "legendary",
    earnedAt:
      travelerProfile?.memberSince || hostProfile?.memberSince
        ? new Date(
            Math.min(
              Number(travelerProfile?.memberSince || Infinity),
              Number(hostProfile?.memberSince || Infinity)
            ) * 1000
          )
        : undefined,
  });

  // First Review Given (COMMON)
  achievements.push({
    id: "first-review",
    name: "Voice Heard",
    description: "Your opinion helps others make decisions",
    unlockHint: "Leave a review after completing a stay",
    icon: "MessageSquare",
    earned: reviewsSubmitted.length >= 1,
    progress: Math.min(reviewsSubmitted.length, 1),
    maxProgress: 1,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
    category: "community",
    rarity: "common",
    earnedAt: getEarliestDate(reviewsSubmitted),
  });

  // Review Contributor - Left 5+ reviews (RARE)
  achievements.push({
    id: "review-contributor",
    name: "Review Contributor",
    description: "Helping the community with valuable feedback",
    unlockHint: "Submit 5 reviews to unlock",
    icon: "MessageSquare",
    earned: reviewsSubmitted.length >= 5,
    progress: Math.min(reviewsSubmitted.length, 5),
    maxProgress: 5,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
    category: "community",
    rarity: "rare",
  });

  // Top Reviewer - Left 15+ reviews (EPIC)
  achievements.push({
    id: "top-reviewer",
    name: "Top Reviewer",
    description: "Your reviews are shaping the community",
    unlockHint: "Submit 15 reviews to become a top reviewer",
    icon: "Star",
    earned: reviewsSubmitted.length >= 15,
    progress: Math.min(reviewsSubmitted.length, 15),
    maxProgress: 15,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    category: "community",
    rarity: "epic",
  });

  // Highly Rated - Average rating 4.5+ (RARE)
  const hasEnoughReviews = reviewsReceived.length >= 3;
  achievements.push({
    id: "highly-rated",
    name: "Highly Rated",
    description: "Consistently excellent experience",
    unlockHint: "Maintain 4.5+ stars with at least 3 reviews",
    icon: "ThumbsUp",
    earned: hasEnoughReviews && avgRating >= 4.5,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    category: "community",
    rarity: "rare",
  });

  // Perfect Score - All 5 stars (EPIC)
  achievements.push({
    id: "perfect-score",
    name: "Perfect Score",
    description: "Flawless reputation on the platform",
    unlockHint: "Receive only 5-star reviews (min 3 reviews)",
    icon: "Star",
    earned: hasPerfectRating && reviewsReceived.length >= 3,
    color: "text-yellow-500 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10",
    category: "community",
    rarity: "epic",
  });

  // Trusted Member - Elite tier (LEGENDARY)
  achievements.push({
    id: "trusted-member",
    name: "Trusted Member",
    description: "Reached the highest trust tier",
    unlockHint: "Achieve Elite (traveler) or SuperHost (host) tier",
    icon: "Shield",
    earned: isEliteTier,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-500/10",
    category: "community",
    rarity: "legendary",
  });

  // ===== TRAVELER BADGES =====

  // First Booking (COMMON)
  achievements.push({
    id: "first-booking",
    name: "First Adventure",
    description: "Your journey on NomadNodes has begun",
    unlockHint: "Book and complete your first stay",
    icon: "Plane",
    earned: completedBookings >= 1,
    progress: Math.min(completedBookings, 1),
    maxProgress: 1,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    category: "traveler",
    rarity: "common",
    earnedAt: getEarliestDate(bookings.filter((b) => b.status === "Completed")),
  });

  // Frequent Traveler - 5+ bookings (RARE)
  achievements.push({
    id: "frequent-traveler",
    name: "Frequent Traveler",
    description: "Building a track record of adventures",
    unlockHint: "Complete 5 stays to unlock",
    icon: "Map",
    earned: completedBookings >= 5,
    progress: Math.min(completedBookings, 5),
    maxProgress: 5,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
    category: "traveler",
    rarity: "rare",
  });

  // Globe Trotter - 15+ bookings (EPIC)
  achievements.push({
    id: "globe-trotter",
    name: "Globe Trotter",
    description: "A seasoned traveler with many stories",
    unlockHint: "Complete 15 stays to unlock",
    icon: "Globe",
    earned: completedBookings >= 15,
    progress: Math.min(completedBookings, 15),
    maxProgress: 15,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    category: "traveler",
    rarity: "epic",
  });

  // World Explorer - 30+ bookings (LEGENDARY)
  achievements.push({
    id: "world-explorer",
    name: "World Explorer",
    description: "A true digital nomad legend",
    unlockHint: "Complete 30 stays - for the dedicated nomads",
    icon: "Globe",
    earned: completedBookings >= 30,
    progress: Math.min(completedBookings, 30),
    maxProgress: 30,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-500/10",
    category: "traveler",
    rarity: "legendary",
  });

  // Explorer - Visited 3+ different properties (COMMON)
  achievements.push({
    id: "explorer",
    name: "Explorer",
    description: "Variety is the spice of travel",
    unlockHint: "Book 3 different properties",
    icon: "Map",
    earned: uniqueProperties >= 3,
    progress: Math.min(uniqueProperties, 3),
    maxProgress: 3,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-500/10",
    category: "traveler",
    rarity: "common",
  });

  // Big Spender - Spent $500+ (RARE)
  achievements.push({
    id: "big-spender",
    name: "Big Spender",
    description: "Investing in quality experiences",
    unlockHint: "Spend $500+ total on bookings",
    icon: "DollarSign",
    earned: totalSpent >= 500,
    progress: Math.min(Math.round(totalSpent), 500),
    maxProgress: 500,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
    category: "traveler",
    rarity: "rare",
  });

  // Whale - Spent $2000+ (EPIC)
  achievements.push({
    id: "whale",
    name: "Whale",
    description: "Premium traveler status achieved",
    unlockHint: "Spend $2,000+ total on bookings",
    icon: "DollarSign",
    earned: totalSpent >= 2000,
    progress: Math.min(Math.round(totalSpent), 2000),
    maxProgress: 2000,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    category: "traveler",
    rarity: "epic",
  });

  // ===== HOST BADGES =====

  // First Listing (COMMON)
  achievements.push({
    id: "first-listing",
    name: "First Listing",
    description: "Your hosting journey begins here",
    unlockHint: "List your first property on NomadNodes",
    icon: "Home",
    earned: properties.length >= 1,
    progress: Math.min(properties.length, 1),
    maxProgress: 1,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10",
    category: "host",
    rarity: "common",
    earnedAt: getEarliestDate(properties),
  });

  // Property Pro - Listed 3+ properties (RARE)
  achievements.push({
    id: "property-pro",
    name: "Property Pro",
    description: "Building a hosting portfolio",
    unlockHint: "List 3 properties to unlock",
    icon: "Home",
    earned: properties.length >= 3,
    progress: Math.min(properties.length, 3),
    maxProgress: 3,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10",
    category: "host",
    rarity: "rare",
  });

  // Real Estate Mogul - Listed 10+ properties (LEGENDARY)
  achievements.push({
    id: "real-estate-mogul",
    name: "Real Estate Mogul",
    description: "A true property empire builder",
    unlockHint: "List 10 properties - for serious hosts",
    icon: "Home",
    earned: properties.length >= 10,
    progress: Math.min(properties.length, 10),
    maxProgress: 10,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    category: "host",
    rarity: "legendary",
  });

  // First Guest - Received first booking (COMMON)
  achievements.push({
    id: "first-guest",
    name: "First Guest",
    description: "Welcome to the hosting community",
    unlockHint: "Receive your first booking as a host",
    icon: "Users",
    earned: hostBookingsReceived >= 1,
    progress: Math.min(hostBookingsReceived, 1),
    maxProgress: 1,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    category: "host",
    rarity: "common",
  });

  // Popular Host - 10+ bookings received (RARE)
  achievements.push({
    id: "popular-host",
    name: "Popular Host",
    description: "Travelers love your properties",
    unlockHint: "Receive 10 bookings across your properties",
    icon: "Users",
    earned: hostBookingsReceived >= 10,
    progress: Math.min(hostBookingsReceived, 10),
    maxProgress: 10,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-500/10",
    category: "host",
    rarity: "rare",
  });

  // Hospitality Star - 50+ bookings received (EPIC)
  achievements.push({
    id: "hospitality-star",
    name: "Hospitality Star",
    description: "A renowned host in the community",
    unlockHint: "Receive 50 bookings as a host",
    icon: "Star",
    earned: hostBookingsReceived >= 50,
    progress: Math.min(hostBookingsReceived, 50),
    maxProgress: 50,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    category: "host",
    rarity: "epic",
  });

  // Superhost (LEGENDARY)
  achievements.push({
    id: "superhost",
    name: "Superhost",
    description: "The pinnacle of hosting excellence",
    unlockHint: "Maintain high ratings & complete many stays",
    icon: "Crown",
    earned: isSuperHost,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-500/10",
    category: "host",
    rarity: "legendary",
  });

  return { achievements, isLoading };
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

/**
 * Fetch reviews for all host's properties (with React Query caching)
 * Used by profile components to show aggregated property reviews for hosts
 */
export function useHostPropertyReviews(propertyIds: string[] | undefined) {
  return useQuery<UserReview[]>({
    queryKey: ["hostPropertyReviews", propertyIds],
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!propertyIds && propertyIds.length > 0,
    queryFn: async () => {
      if (!propertyIds || propertyIds.length === 0) return [];

      const propIdsList = propertyIds.map((id) => `"${id}"`).join(", ");

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            reviews(where: { propertyId_in: [${propIdsList}] }, limit: 1000, orderBy: "createdAt", orderDirection: "desc") {
              items {
                id
                reviewId
                propertyId
                reviewer
                reviewee
                rating
                helpfulVotes
                unhelpfulVotes
                createdAt
                isFlagged
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
