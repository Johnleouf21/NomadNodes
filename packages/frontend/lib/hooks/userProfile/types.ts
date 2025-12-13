/**
 * User Profile Types
 */

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

export type DateFilterOption = "7d" | "30d" | "90d" | "1y" | "all";

export type AchievementCategory = "traveler" | "host" | "community";
export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  unlockHint: string;
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
