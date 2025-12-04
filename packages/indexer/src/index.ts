import { ponder } from "ponder:registry";
import {
  property,
  roomType,
  booking,
  escrow,
  batchBooking,
  review,
  user,
  globalStats,
  traveler,
  host,
} from "ponder:schema";

// ============================================================
// Helper Functions
// ============================================================

async function getOrCreateUser(
  db: Parameters<Parameters<typeof ponder.on>[1]>[0]["context"]["db"],
  address: `0x${string}`,
  timestamp: bigint
) {
  let existingUser = await db.find(user, { id: address });
  if (!existingUser) {
    existingUser = await db.insert(user).values({
      id: address,
      totalPropertiesAsHost: 0n,
      totalBookingsAsTraveler: 0n,
      totalReviewsGiven: 0n,
      totalReviewsReceived: 0n,
      firstSeenAt: timestamp,
      lastActiveAt: timestamp,
    });
  }
  return existingUser;
}

async function getOrCreateGlobalStats(
  db: Parameters<Parameters<typeof ponder.on>[1]>[0]["context"]["db"],
  timestamp: bigint
) {
  let stats = await db.find(globalStats, { id: "global" });
  if (!stats) {
    stats = await db.insert(globalStats).values({
      id: "global",
      totalProperties: 0n,
      totalActiveProperties: 0n,
      totalRoomTypes: 0n,
      totalBookings: 0n,
      totalCompletedBookings: 0n,
      totalReviews: 0n,
      totalTravelers: 0n,
      totalHosts: 0n,
      totalVolume: 0n,
      lastUpdatedAt: timestamp,
    });
  }
  return stats;
}

// Helper to convert tier number to enum string
function getTravelerTierString(tier: number): "Newcomer" | "Regular" | "Trusted" | "Elite" {
  const tiers = ["Newcomer", "Regular", "Trusted", "Elite"] as const;
  return tiers[tier] ?? "Newcomer";
}

function getHostTierString(tier: number): "Newcomer" | "Experienced" | "Pro" | "SuperHost" {
  const tiers = ["Newcomer", "Experienced", "Pro", "SuperHost"] as const;
  return tiers[tier] ?? "Newcomer";
}

// Decode tokenId to get propertyId and roomTypeId
function decodeTokenId(tokenId: bigint): { propertyId: bigint; roomTypeId: bigint } {
  const propertyId = tokenId >> 128n;
  const roomTypeId = tokenId & ((1n << 128n) - 1n);
  return { propertyId, roomTypeId };
}

// ============================================================
// PropertyRegistry Event Handlers
// ============================================================

ponder.on("PropertyRegistry:PropertyCreated", async ({ event, context }) => {
  const { db } = context;
  const { propertyId, host, hostSbtTokenId, ipfsHash } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  // Create property
  await db.insert(property).values({
    id: propertyId.toString(),
    propertyId,
    host,
    hostSbtTokenId,
    ipfsHash,
    propertyType: "", // Will be updated from IPFS metadata
    location: "", // Will be updated from IPFS metadata
    isActive: true,
    averageRating: 0n,
    totalRatings: 0n,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // Update user stats
  await getOrCreateUser(db, host, timestamp);
  await db.update(user, { id: host }).set((row) => ({
    totalPropertiesAsHost: row.totalPropertiesAsHost + 1n,
    lastActiveAt: timestamp,
  }));

  // Update global stats
  await getOrCreateGlobalStats(db, timestamp);
  await db.update(globalStats, { id: "global" }).set((row) => ({
    totalProperties: row.totalProperties + 1n,
    totalActiveProperties: row.totalActiveProperties + 1n,
    lastUpdatedAt: timestamp,
  }));
});

ponder.on("PropertyRegistry:PropertyActivated", async ({ event, context }) => {
  const { db } = context;
  const { propertyId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db
    .update(property, { id: propertyId.toString() })
    .set({ isActive: true, updatedAt: timestamp });

  // Update global stats
  await db.update(globalStats, { id: "global" }).set((row) => ({
    totalActiveProperties: row.totalActiveProperties + 1n,
    lastUpdatedAt: timestamp,
  }));
});

ponder.on("PropertyRegistry:PropertyDeactivated", async ({ event, context }) => {
  const { db } = context;
  const { propertyId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db
    .update(property, { id: propertyId.toString() })
    .set({ isActive: false, updatedAt: timestamp });

  // Update global stats
  await db.update(globalStats, { id: "global" }).set((row) => ({
    totalActiveProperties: row.totalActiveProperties - 1n,
    lastUpdatedAt: timestamp,
  }));
});

ponder.on("PropertyRegistry:PropertyOwnershipTransferred", async ({ event, context }) => {
  const { db } = context;
  const { propertyId, oldOwner, newOwner } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db
    .update(property, { id: propertyId.toString() })
    .set({ host: newOwner, updatedAt: timestamp });

  // Update user stats for old owner
  await db.update(user, { id: oldOwner }).set((row) => ({
    totalPropertiesAsHost: row.totalPropertiesAsHost - 1n,
    lastActiveAt: timestamp,
  }));

  // Update user stats for new owner
  await getOrCreateUser(db, newOwner, timestamp);
  await db.update(user, { id: newOwner }).set((row) => ({
    totalPropertiesAsHost: row.totalPropertiesAsHost + 1n,
    lastActiveAt: timestamp,
  }));
});

ponder.on("PropertyRegistry:PropertyRated", async ({ event, context }) => {
  const { db } = context;
  const { propertyId, newAverageRating } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.update(property, { id: propertyId.toString() }).set((row) => ({
    averageRating: newAverageRating,
    totalRatings: row.totalRatings + 1n,
    updatedAt: timestamp,
  }));
});

// ============================================================
// RoomTypeNFT Event Handlers
// ============================================================

ponder.on("RoomTypeNFT:RoomTypeAdded", async ({ event, context }) => {
  const { db } = context;
  const { propertyId, roomTypeId, tokenId, name, ipfsHash, pricePerNight, maxSupply } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.insert(roomType).values({
    id: tokenId.toString(),
    tokenId,
    propertyId: propertyId.toString(),
    roomTypeId,
    name,
    ipfsHash: ipfsHash || "",
    pricePerNight,
    cleaningFee: 0n,
    maxGuests: 0n,
    totalSupply: maxSupply,
    isActive: true,
    isDeleted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // Update global stats
  await db.update(globalStats, { id: "global" }).set((row) => ({
    totalRoomTypes: row.totalRoomTypes + 1n,
    lastUpdatedAt: timestamp,
  }));
});

ponder.on("RoomTypeNFT:RoomTypeUpdated", async ({ event, context }) => {
  const { db } = context;
  const { tokenId, pricePerNight, cleaningFee } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db
    .update(roomType, { id: tokenId.toString() })
    .set({ pricePerNight, cleaningFee, updatedAt: timestamp });
});

ponder.on("RoomTypeNFT:RoomTypeMetadataUpdated", async ({ event, context }) => {
  const { db } = context;
  const { tokenId, ipfsHash } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.update(roomType, { id: tokenId.toString() }).set({ ipfsHash, updatedAt: timestamp });
});

ponder.on("RoomTypeNFT:RoomTypeSupplyIncreased", async ({ event, context }) => {
  const { db } = context;
  const { tokenId, newSupply } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db
    .update(roomType, { id: tokenId.toString() })
    .set({ totalSupply: newSupply, updatedAt: timestamp });
});

ponder.on("RoomTypeNFT:RoomTypeDeleted", async ({ event, context }) => {
  const { db } = context;
  const { tokenId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db
    .update(roomType, { id: tokenId.toString() })
    .set({ isDeleted: true, isActive: false, updatedAt: timestamp });

  // Update global stats
  await db.update(globalStats, { id: "global" }).set((row) => ({
    totalRoomTypes: row.totalRoomTypes - 1n,
    lastUpdatedAt: timestamp,
  }));
});

ponder.on("RoomTypeNFT:RoomTypeActivated", async ({ event, context }) => {
  const { db } = context;
  const { tokenId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db
    .update(roomType, { id: tokenId.toString() })
    .set({ isActive: true, updatedAt: timestamp });
});

ponder.on("RoomTypeNFT:RoomTypeDeactivated", async ({ event, context }) => {
  const { db } = context;
  const { tokenId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db
    .update(roomType, { id: tokenId.toString() })
    .set({ isActive: false, updatedAt: timestamp });
});

// ============================================================
// BookingManager Event Handlers
// ============================================================

ponder.on("BookingManager:BookingCreated", async ({ event, context }) => {
  const { db } = context;
  const { tokenId, bookingIndex, traveler, checkInDate, checkOutDate, totalPrice } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  const { propertyId } = decodeTokenId(tokenId);
  const bookingId = `${tokenId.toString()}-${bookingIndex.toString()}`;

  await db.insert(booking).values({
    id: bookingId,
    tokenId,
    bookingIndex,
    propertyId: propertyId.toString(),
    roomTypeId: tokenId.toString(),
    traveler,
    checkInDate,
    checkOutDate,
    totalPrice,
    status: "Pending",
    escrowAddress: undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // Update user stats
  await getOrCreateUser(db, traveler, timestamp);
  await db.update(user, { id: traveler }).set((row) => ({
    totalBookingsAsTraveler: row.totalBookingsAsTraveler + 1n,
    lastActiveAt: timestamp,
  }));

  // Update global stats
  await db.update(globalStats, { id: "global" }).set((row) => ({
    totalBookings: row.totalBookings + 1n,
    totalVolume: row.totalVolume + totalPrice,
    lastUpdatedAt: timestamp,
  }));
});

ponder.on("BookingManager:BookingConfirmed", async ({ event, context }) => {
  const { db } = context;
  const { tokenId, bookingIndex } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  const bookingId = `${tokenId.toString()}-${bookingIndex.toString()}`;
  await db.update(booking, { id: bookingId }).set({ status: "Confirmed", updatedAt: timestamp });
});

ponder.on("BookingManager:BookingCheckedIn", async ({ event, context }) => {
  const { db } = context;
  const { tokenId, bookingIndex } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  const bookingId = `${tokenId.toString()}-${bookingIndex.toString()}`;
  await db.update(booking, { id: bookingId }).set({ status: "CheckedIn", updatedAt: timestamp });
});

ponder.on("BookingManager:BookingCompleted", async ({ event, context }) => {
  const { db } = context;
  const { tokenId, bookingIndex } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  const bookingId = `${tokenId.toString()}-${bookingIndex.toString()}`;
  await db.update(booking, { id: bookingId }).set({ status: "Completed", updatedAt: timestamp });

  // Update global stats
  await db.update(globalStats, { id: "global" }).set((row) => ({
    totalCompletedBookings: row.totalCompletedBookings + 1n,
    lastUpdatedAt: timestamp,
  }));
});

ponder.on("BookingManager:BookingCancelled", async ({ event, context }) => {
  const { db } = context;
  const { tokenId, bookingIndex } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  const bookingId = `${tokenId.toString()}-${bookingIndex.toString()}`;
  await db.update(booking, { id: bookingId }).set({ status: "Cancelled", updatedAt: timestamp });
});

// ============================================================
// EscrowFactory Event Handlers
// ============================================================

ponder.on("EscrowFactory:TravelEscrowCreated", async ({ event, context }) => {
  const { db, client } = context;
  const { escrowAddress, tokenId, traveler, currency, price, checkIn, checkOut } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  // Get the property to find the host
  const { propertyId } = decodeTokenId(tokenId);
  const propertyRecord = await db.find(property, { id: propertyId.toString() });

  await db.insert(escrow).values({
    id: escrowAddress,
    tokenId,
    traveler,
    host: propertyRecord?.host ?? ("0x0000000000000000000000000000000000000000" as `0x${string}`),
    currency,
    price,
    checkIn,
    checkOut,
    createdAt: timestamp,
  });

  // Read bookingIndex from the escrow contract
  try {
    const escrowAbi = [
      {
        inputs: [],
        name: "bookingIndex",
        outputs: [{ type: "uint256", name: "" }],
        stateMutability: "view",
        type: "function",
      },
    ] as const;

    const bookingIndexResult = await client.readContract({
      address: escrowAddress,
      abi: escrowAbi,
      functionName: "bookingIndex",
    });

    // Update the booking with the escrow address and correct totalPrice from escrow
    const bookingId = `${tokenId.toString()}-${bookingIndexResult.toString()}`;
    await db
      .update(booking, { id: bookingId })
      .set({ escrowAddress, totalPrice: price, updatedAt: timestamp });
  } catch (error) {
    // If we can't read bookingIndex, try to find by matching fields
    console.warn("Could not read bookingIndex from escrow, trying fallback match:", error);
  }
});

ponder.on("EscrowFactory:BatchBookingCreated", async ({ event, context }) => {
  const { db } = context;
  const { batchId, traveler, currency, totalPrice, checkIn, checkOut, roomCount } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.insert(batchBooking).values({
    id: batchId.toString(),
    batchId,
    traveler,
    currency,
    totalPrice,
    checkIn,
    checkOut,
    roomCount,
    createdAt: timestamp,
  });
});

// ============================================================
// ReviewRegistry Event Handlers
// ============================================================

ponder.on("ReviewRegistry:ReviewPublished", async ({ event, context }) => {
  const { db } = context;
  const { reviewId, propertyId, reviewer, reviewee, rating } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.insert(review).values({
    id: reviewId.toString(),
    reviewId,
    propertyId: propertyId.toString(),
    reviewer,
    reviewee,
    rating,
    isFlagged: false,
    helpfulVotes: 0n,
    unhelpfulVotes: 0n,
    createdAt: timestamp,
  });

  // Update user stats for reviewer
  await getOrCreateUser(db, reviewer, timestamp);
  await db.update(user, { id: reviewer }).set((row) => ({
    totalReviewsGiven: row.totalReviewsGiven + 1n,
    lastActiveAt: timestamp,
  }));

  // Update user stats for reviewee
  await getOrCreateUser(db, reviewee, timestamp);
  await db.update(user, { id: reviewee }).set((row) => ({
    totalReviewsReceived: row.totalReviewsReceived + 1n,
    lastActiveAt: timestamp,
  }));

  // Update global stats
  await db.update(globalStats, { id: "global" }).set((row) => ({
    totalReviews: row.totalReviews + 1n,
    lastUpdatedAt: timestamp,
  }));
});

ponder.on("ReviewRegistry:ReviewFlagged", async ({ event, context }) => {
  const { db } = context;
  const { reviewId } = event.args;

  await db.update(review, { id: reviewId.toString() }).set({ isFlagged: true });
});

ponder.on("ReviewRegistry:ReviewUnflagged", async ({ event, context }) => {
  const { db } = context;
  const { reviewId } = event.args;

  await db.update(review, { id: reviewId.toString() }).set({ isFlagged: false });
});

ponder.on("ReviewRegistry:ReviewVoted", async ({ event, context }) => {
  const { db } = context;
  const { reviewId, helpful } = event.args;

  if (helpful) {
    await db
      .update(review, { id: reviewId.toString() })
      .set((row) => ({ helpfulVotes: row.helpfulVotes + 1n }));
  } else {
    await db
      .update(review, { id: reviewId.toString() })
      .set((row) => ({ unhelpfulVotes: row.unhelpfulVotes + 1n }));
  }
});

// ============================================================
// TravelerSBT Event Handlers
// ============================================================

ponder.on("TravelerSBT:TravelerMinted", async ({ event, context }) => {
  const { db } = context;
  const { traveler: travelerAddress, tokenId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  // Create traveler record
  await db.insert(traveler).values({
    id: tokenId.toString(),
    tokenId,
    wallet: travelerAddress,
    tier: "Newcomer",
    averageRating: 0n,
    totalBookings: 0n,
    completedStays: 0n,
    cancelledBookings: 0n,
    totalReviewsReceived: 0n,
    isSuspended: false,
    memberSince: timestamp,
    lastActivityAt: timestamp,
    updatedAt: timestamp,
  });

  // Update global stats
  await getOrCreateGlobalStats(db, timestamp);
  await db.update(globalStats, { id: "global" }).set((row) => ({
    totalTravelers: row.totalTravelers + 1n,
    lastUpdatedAt: timestamp,
  }));
});

ponder.on("TravelerSBT:ReputationUpdated", async ({ event, context }) => {
  const { db } = context;
  const { tokenId, newRating, newTier } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.update(traveler, { id: tokenId.toString() }).set({
    averageRating: newRating,
    tier: getTravelerTierString(newTier),
    lastActivityAt: timestamp,
    updatedAt: timestamp,
  });
});

ponder.on("TravelerSBT:TierUpgraded", async ({ event, context }) => {
  const { db } = context;
  const { tokenId, newTier } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.update(traveler, { id: tokenId.toString() }).set({
    tier: getTravelerTierString(newTier),
    lastActivityAt: timestamp,
    updatedAt: timestamp,
  });
});

ponder.on("TravelerSBT:TravelerSuspended", async ({ event, context }) => {
  const { db } = context;
  const { tokenId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.update(traveler, { id: tokenId.toString() }).set({
    isSuspended: true,
    updatedAt: timestamp,
  });
});

ponder.on("TravelerSBT:TravelerUnsuspended", async ({ event, context }) => {
  const { db } = context;
  const { tokenId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.update(traveler, { id: tokenId.toString() }).set({
    isSuspended: false,
    updatedAt: timestamp,
  });
});

// ============================================================
// HostSBT Event Handlers
// ============================================================

ponder.on("HostSBT:HostMinted", async ({ event, context }) => {
  const { db } = context;
  const { host: hostAddress, tokenId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  // Create host record
  await db.insert(host).values({
    id: tokenId.toString(),
    tokenId,
    wallet: hostAddress,
    tier: "Newcomer",
    isSuperHost: false,
    averageRating: 0n,
    totalPropertiesListed: 0n,
    totalBookingsReceived: 0n,
    completedBookings: 0n,
    totalReviewsReceived: 0n,
    isSuspended: false,
    memberSince: timestamp,
    lastActivityAt: timestamp,
    updatedAt: timestamp,
  });

  // Update global stats
  await getOrCreateGlobalStats(db, timestamp);
  await db.update(globalStats, { id: "global" }).set((row) => ({
    totalHosts: row.totalHosts + 1n,
    lastUpdatedAt: timestamp,
  }));
});

ponder.on("HostSBT:ReputationUpdated", async ({ event, context }) => {
  const { db } = context;
  const { tokenId, newRating, newTier } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.update(host, { id: tokenId.toString() }).set({
    averageRating: newRating,
    tier: getHostTierString(newTier),
    lastActivityAt: timestamp,
    updatedAt: timestamp,
  });
});

ponder.on("HostSBT:TierUpgraded", async ({ event, context }) => {
  const { db } = context;
  const { tokenId, newTier } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.update(host, { id: tokenId.toString() }).set({
    tier: getHostTierString(newTier),
    lastActivityAt: timestamp,
    updatedAt: timestamp,
  });
});

ponder.on("HostSBT:SuperHostAwarded", async ({ event, context }) => {
  const { db } = context;
  const { tokenId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.update(host, { id: tokenId.toString() }).set({
    isSuperHost: true,
    lastActivityAt: timestamp,
    updatedAt: timestamp,
  });
});

ponder.on("HostSBT:SuperHostRevoked", async ({ event, context }) => {
  const { db } = context;
  const { tokenId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.update(host, { id: tokenId.toString() }).set({
    isSuperHost: false,
    lastActivityAt: timestamp,
    updatedAt: timestamp,
  });
});

ponder.on("HostSBT:HostSuspended", async ({ event, context }) => {
  const { db } = context;
  const { tokenId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.update(host, { id: tokenId.toString() }).set({
    isSuspended: true,
    updatedAt: timestamp,
  });
});

ponder.on("HostSBT:HostUnsuspended", async ({ event, context }) => {
  const { db } = context;
  const { tokenId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  await db.update(host, { id: tokenId.toString() }).set({
    isSuspended: false,
    updatedAt: timestamp,
  });
});

ponder.on("HostSBT:PropertyLinked", async ({ event, context }) => {
  const { db } = context;
  const { tokenId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  // Increment the host's property count
  await db.update(host, { id: tokenId.toString() }).set((row) => ({
    totalPropertiesListed: row.totalPropertiesListed + 1n,
    lastActivityAt: timestamp,
    updatedAt: timestamp,
  }));
});

ponder.on("HostSBT:PropertyUnlinked", async ({ event, context }) => {
  const { db } = context;
  const { tokenId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  // Decrement the host's property count
  await db.update(host, { id: tokenId.toString() }).set((row) => ({
    totalPropertiesListed: row.totalPropertiesListed - 1n,
    lastActivityAt: timestamp,
    updatedAt: timestamp,
  }));
});

ponder.on("TravelerSBT:BookingLinked", async ({ event, context }) => {
  const { db } = context;
  const { sbtTokenId } = event.args;
  const timestamp = BigInt(event.block.timestamp);

  // Increment the traveler's booking count
  await db.update(traveler, { id: sbtTokenId.toString() }).set((row) => ({
    totalBookings: row.totalBookings + 1n,
    lastActivityAt: timestamp,
    updatedAt: timestamp,
  }));
});
