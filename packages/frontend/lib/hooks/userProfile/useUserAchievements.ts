import { useFullUserProfile } from "./useFullUserProfile";
import type { UserAchievement } from "./types";

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
