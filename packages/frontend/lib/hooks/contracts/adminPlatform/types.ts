/**
 * Admin Platform Types
 */

// ===== Platform Statistics =====

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

export interface PlatformStats {
  properties: {
    total: number;
    active: number;
    inactive: number;
    roomTypes: number;
    activeRoomTypes: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    checkedIn: number;
    completed: number;
    cancelled: number;
  };
  users: {
    totalHosts: number;
    suspendedHosts: number;
    superHosts: number;
    hostsByTier: {
      newcomer: number;
      experienced: number;
      pro: number;
      superHost: number;
    };
    totalTravelers: number;
    suspendedTravelers: number;
    travelersByTier: {
      newcomer: number;
      regular: number;
      trusted: number;
      elite: number;
    };
  };
  revenue: {
    totalVolume: number;
    totalCompleted: number;
    pendingValue: number;
    platformFees: number;
  };
  reviews: {
    total: number;
  };
}

// ===== User Profiles =====

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

// ===== Ponder Data Types =====

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
