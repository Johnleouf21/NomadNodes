import { onchainTable, onchainEnum, index } from "ponder";

// ============================================================
// Enums
// ============================================================

export const bookingStatusEnum = onchainEnum("booking_status", [
  "Pending",
  "Confirmed",
  "CheckedIn",
  "Completed",
  "Cancelled",
]);

export const travelerTierEnum = onchainEnum("traveler_tier", [
  "Newcomer",
  "Regular",
  "Trusted",
  "Elite",
]);

export const hostTierEnum = onchainEnum("host_tier", [
  "Newcomer",
  "Experienced",
  "Pro",
  "SuperHost",
]);

// ============================================================
// Property Tables
// ============================================================

export const property = onchainTable(
  "property",
  (t) => ({
    id: t.text().primaryKey(), // propertyId as string
    propertyId: t.bigint().notNull(),
    host: t.hex().notNull(),
    hostSbtTokenId: t.bigint().notNull(),
    ipfsHash: t.text().notNull(),
    propertyType: t.text().notNull(),
    location: t.text().notNull(),
    isActive: t.boolean().notNull(),
    averageRating: t.bigint().notNull(),
    totalRatings: t.bigint().notNull(),
    createdAt: t.bigint().notNull(),
    updatedAt: t.bigint().notNull(),
  }),
  (table) => ({
    hostIdx: index().on(table.host),
    activeIdx: index().on(table.isActive),
    locationIdx: index().on(table.location),
    typeIdx: index().on(table.propertyType),
  })
);

export const roomType = onchainTable(
  "room_type",
  (t) => ({
    id: t.text().primaryKey(), // tokenId as string
    tokenId: t.bigint().notNull(),
    propertyId: t.text().notNull(), // Reference to property.id
    roomTypeId: t.bigint().notNull(), // Local room type ID within property
    name: t.text().notNull(),
    ipfsHash: t.text().notNull(),
    pricePerNight: t.bigint().notNull(),
    cleaningFee: t.bigint().notNull(),
    maxGuests: t.bigint().notNull(),
    totalSupply: t.bigint().notNull(),
    isActive: t.boolean().notNull(),
    isDeleted: t.boolean().notNull(),
    createdAt: t.bigint().notNull(),
    updatedAt: t.bigint().notNull(),
  }),
  (table) => ({
    propertyIdx: index().on(table.propertyId),
    activeIdx: index().on(table.isActive),
    priceIdx: index().on(table.pricePerNight),
  })
);

// ============================================================
// Booking Tables
// ============================================================

export const booking = onchainTable(
  "booking",
  (t) => ({
    id: t.text().primaryKey(), // tokenId-bookingIndex
    tokenId: t.bigint().notNull(),
    bookingIndex: t.bigint().notNull(),
    propertyId: t.text().notNull(), // Reference to property.id
    roomTypeId: t.text().notNull(), // Reference to roomType.id
    traveler: t.hex().notNull(),
    checkInDate: t.bigint().notNull(),
    checkOutDate: t.bigint().notNull(),
    totalPrice: t.bigint().notNull(),
    status: bookingStatusEnum("status").notNull(),
    escrowAddress: t.hex(),
    createdAt: t.bigint().notNull(),
    updatedAt: t.bigint().notNull(),
  }),
  (table) => ({
    propertyIdx: index().on(table.propertyId),
    roomTypeIdx: index().on(table.roomTypeId),
    travelerIdx: index().on(table.traveler),
    statusIdx: index().on(table.status),
    checkInIdx: index().on(table.checkInDate),
  })
);

// ============================================================
// Escrow Tables
// ============================================================

export const escrow = onchainTable(
  "escrow",
  (t) => ({
    id: t.hex().primaryKey(), // escrow contract address
    tokenId: t.bigint().notNull(),
    traveler: t.hex().notNull(),
    host: t.hex().notNull(),
    currency: t.hex().notNull(),
    price: t.bigint().notNull(),
    checkIn: t.bigint().notNull(),
    checkOut: t.bigint().notNull(),
    createdAt: t.bigint().notNull(),
  }),
  (table) => ({
    travelerIdx: index().on(table.traveler),
    hostIdx: index().on(table.host),
    tokenIdx: index().on(table.tokenId),
  })
);

export const batchBooking = onchainTable(
  "batch_booking",
  (t) => ({
    id: t.text().primaryKey(), // batchId as string
    batchId: t.bigint().notNull(),
    traveler: t.hex().notNull(),
    currency: t.hex().notNull(),
    totalPrice: t.bigint().notNull(),
    checkIn: t.bigint().notNull(),
    checkOut: t.bigint().notNull(),
    roomCount: t.bigint().notNull(),
    createdAt: t.bigint().notNull(),
  }),
  (table) => ({
    travelerIdx: index().on(table.traveler),
  })
);

// ============================================================
// Review Tables
// ============================================================

export const review = onchainTable(
  "review",
  (t) => ({
    id: t.text().primaryKey(), // reviewId as string
    reviewId: t.bigint().notNull(),
    propertyId: t.text().notNull(), // Reference to property.id
    reviewer: t.hex().notNull(),
    reviewee: t.hex().notNull(),
    rating: t.integer().notNull(),
    isFlagged: t.boolean().notNull(),
    helpfulVotes: t.bigint().notNull(),
    unhelpfulVotes: t.bigint().notNull(),
    createdAt: t.bigint().notNull(),
  }),
  (table) => ({
    propertyIdx: index().on(table.propertyId),
    reviewerIdx: index().on(table.reviewer),
    revieweeIdx: index().on(table.reviewee),
    ratingIdx: index().on(table.rating),
  })
);

// ============================================================
// User Tables (aggregated stats)
// ============================================================

export const user = onchainTable(
  "user",
  (t) => ({
    id: t.hex().primaryKey(), // wallet address
    totalPropertiesAsHost: t.bigint().notNull(),
    totalBookingsAsTraveler: t.bigint().notNull(),
    totalReviewsGiven: t.bigint().notNull(),
    totalReviewsReceived: t.bigint().notNull(),
    firstSeenAt: t.bigint().notNull(),
    lastActiveAt: t.bigint().notNull(),
  }),
  (table) => ({
    hostIdx: index().on(table.totalPropertiesAsHost),
    travelerIdx: index().on(table.totalBookingsAsTraveler),
  })
);

// ============================================================
// SBT Tables (Soulbound Tokens)
// ============================================================

export const traveler = onchainTable(
  "traveler",
  (t) => ({
    id: t.text().primaryKey(), // tokenId as string
    tokenId: t.bigint().notNull(),
    wallet: t.hex().notNull(),
    tier: travelerTierEnum("tier").notNull(),
    averageRating: t.bigint().notNull(), // 0-500 (5.00 stars = 500)
    totalBookings: t.bigint().notNull(),
    completedStays: t.bigint().notNull(),
    cancelledBookings: t.bigint().notNull(),
    totalReviewsReceived: t.bigint().notNull(),
    isSuspended: t.boolean().notNull(),
    memberSince: t.bigint().notNull(),
    lastActivityAt: t.bigint().notNull(),
    updatedAt: t.bigint().notNull(),
  }),
  (table) => ({
    walletIdx: index().on(table.wallet),
    tierIdx: index().on(table.tier),
    ratingIdx: index().on(table.averageRating),
  })
);

export const host = onchainTable(
  "host",
  (t) => ({
    id: t.text().primaryKey(), // tokenId as string
    tokenId: t.bigint().notNull(),
    wallet: t.hex().notNull(),
    tier: hostTierEnum("tier").notNull(),
    isSuperHost: t.boolean().notNull(),
    averageRating: t.bigint().notNull(), // 0-500 (5.00 stars = 500)
    totalPropertiesListed: t.bigint().notNull(),
    totalBookingsReceived: t.bigint().notNull(),
    completedBookings: t.bigint().notNull(),
    totalReviewsReceived: t.bigint().notNull(),
    isSuspended: t.boolean().notNull(),
    memberSince: t.bigint().notNull(),
    lastActivityAt: t.bigint().notNull(),
    updatedAt: t.bigint().notNull(),
  }),
  (table) => ({
    walletIdx: index().on(table.wallet),
    tierIdx: index().on(table.tier),
    superHostIdx: index().on(table.isSuperHost),
    ratingIdx: index().on(table.averageRating),
  })
);

// ============================================================
// Stats Tables (global aggregates)
// ============================================================

export const globalStats = onchainTable("global_stats", (t) => ({
  id: t.text().primaryKey(), // "global"
  totalProperties: t.bigint().notNull(),
  totalActiveProperties: t.bigint().notNull(),
  totalRoomTypes: t.bigint().notNull(),
  totalBookings: t.bigint().notNull(),
  totalCompletedBookings: t.bigint().notNull(),
  totalReviews: t.bigint().notNull(),
  totalTravelers: t.bigint().notNull(),
  totalHosts: t.bigint().notNull(),
  totalVolume: t.bigint().notNull(), // Total transaction volume in USD (6 decimals)
  lastUpdatedAt: t.bigint().notNull(),
}));
