// Re-export ABIs with proper typing for Ponder
// These are extracted from the contract artifacts

export const PropertyRegistryAbi = [
  {
    inputs: [
      { name: "_hostSBT", type: "address" },
      { name: "_platform", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "InvalidAddress", type: "error" },
  { inputs: [], name: "InvalidRating", type: "error" },
  { inputs: [], name: "MustHaveHostSBT", type: "error" },
  { inputs: [], name: "NotAuthorized", type: "error" },
  { inputs: [], name: "NotPlatform", type: "error" },
  { inputs: [], name: "NotPropertyOwner", type: "error" },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "propertyId", type: "uint256" }],
    name: "PropertyActivated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "propertyId", type: "uint256" },
      { indexed: true, name: "host", type: "address" },
      { indexed: true, name: "hostSbtTokenId", type: "uint256" },
      { indexed: false, name: "ipfsHash", type: "string" },
    ],
    name: "PropertyCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "propertyId", type: "uint256" }],
    name: "PropertyDeactivated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "propertyId", type: "uint256" },
      { indexed: true, name: "oldOwner", type: "address" },
      { indexed: true, name: "newOwner", type: "address" },
    ],
    name: "PropertyOwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "propertyId", type: "uint256" },
      { indexed: false, name: "rating", type: "uint8" },
      { indexed: false, name: "newAverageRating", type: "uint256" },
    ],
    name: "PropertyRated",
    type: "event",
  },
] as const;

export const RoomTypeNFTAbi = [
  {
    inputs: [{ name: "_propertyRegistry", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "HasActiveBookings", type: "error" },
  { inputs: [], name: "InvalidAddress", type: "error" },
  { inputs: [], name: "InvalidTokenId", type: "error" },
  { inputs: [], name: "NotPropertyOwner", type: "error" },
  { inputs: [], name: "RoomTypeNotFound", type: "error" },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "tokenId", type: "uint256" }],
    name: "RoomTypeActivated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "propertyId", type: "uint256" },
      { indexed: true, name: "roomTypeId", type: "uint256" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "name", type: "string" },
      { indexed: false, name: "ipfsHash", type: "string" },
      { indexed: false, name: "pricePerNight", type: "uint256" },
      { indexed: false, name: "maxSupply", type: "uint256" },
    ],
    name: "RoomTypeAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "tokenId", type: "uint256" }],
    name: "RoomTypeDeactivated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "tokenId", type: "uint256" }],
    name: "RoomTypeDeleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "oldSupply", type: "uint256" },
      { indexed: false, name: "newSupply", type: "uint256" },
    ],
    name: "RoomTypeSupplyIncreased",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "pricePerNight", type: "uint256" },
      { indexed: false, name: "cleaningFee", type: "uint256" },
    ],
    name: "RoomTypeUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "ipfsHash", type: "string" },
    ],
    name: "RoomTypeMetadataUpdated",
    type: "event",
  },
] as const;

export const BookingManagerAbi = [
  {
    inputs: [
      { name: "_propertyRegistry", type: "address" },
      { name: "_roomTypeNFT", type: "address" },
      { name: "_availabilityManager", type: "address" },
      { name: "_travelerSBT", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "InvalidAddress", type: "error" },
  { inputs: [], name: "InvalidBookingIndex", type: "error" },
  { inputs: [], name: "InvalidBookingStatus", type: "error" },
  { inputs: [], name: "InvalidDateRange", type: "error" },
  { inputs: [], name: "InvalidTokenId", type: "error" },
  { inputs: [], name: "MustHaveTravelerSBT", type: "error" },
  { inputs: [], name: "NoAvailableUnits", type: "error" },
  { inputs: [], name: "NotAuthorized", type: "error" },
  { inputs: [], name: "RoomTypeNotActive", type: "error" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "bookingIndex", type: "uint256" },
    ],
    name: "BookingCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "bookingIndex", type: "uint256" },
    ],
    name: "BookingCheckedIn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "bookingIndex", type: "uint256" },
    ],
    name: "BookingCompleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "bookingIndex", type: "uint256" },
    ],
    name: "BookingConfirmed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "bookingIndex", type: "uint256" },
      { indexed: true, name: "traveler", type: "address" },
      { indexed: false, name: "checkInDate", type: "uint256" },
      { indexed: false, name: "checkOutDate", type: "uint256" },
      { indexed: false, name: "totalPrice", type: "uint256" },
    ],
    name: "BookingCreated",
    type: "event",
  },
] as const;

export const EscrowFactoryAbi = [
  {
    inputs: [
      { name: "_platformWallet", type: "address" },
      { name: "_admin", type: "address" },
      { name: "_backendSigner", type: "address" },
      { name: "_usdc", type: "address" },
      { name: "_eurc", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "InvalidAddress", type: "error" },
  { inputs: [], name: "InvalidFee", type: "error" },
  { inputs: [], name: "InvalidQuantity", type: "error" },
  { inputs: [], name: "InvalidQuote", type: "error" },
  { inputs: [], name: "NoAvailability", type: "error" },
  { inputs: [], name: "QuoteExpired", type: "error" },
  { inputs: [], name: "UnsupportedCurrency", type: "error" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "batchId", type: "uint256" },
      { indexed: true, name: "traveler", type: "address" },
      { indexed: false, name: "currency", type: "address" },
      { indexed: false, name: "totalPrice", type: "uint256" },
      { indexed: false, name: "checkIn", type: "uint256" },
      { indexed: false, name: "checkOut", type: "uint256" },
      { indexed: false, name: "roomCount", type: "uint256" },
      { indexed: false, name: "escrowIds", type: "uint256[]" },
    ],
    name: "BatchBookingCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "escrowAddress", type: "address" },
      { indexed: true, name: "buyer", type: "address" },
      { indexed: true, name: "seller", type: "address" },
      { indexed: false, name: "token", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "EscrowCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "escrowAddress", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "traveler", type: "address" },
      { indexed: false, name: "currency", type: "address" },
      { indexed: false, name: "price", type: "uint256" },
      { indexed: false, name: "checkIn", type: "uint256" },
      { indexed: false, name: "checkOut", type: "uint256" },
    ],
    name: "TravelEscrowCreated",
    type: "event",
  },
] as const;

export const ReviewRegistryAbi = [
  {
    inputs: [
      { name: "_travelerSBT", type: "address" },
      { name: "_hostSBT", type: "address" },
      { name: "_propertyNFT", type: "address" },
      { name: "_propertyRegistry", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "AlreadyReviewed", type: "error" },
  { inputs: [], name: "AlreadyVoted", type: "error" },
  { inputs: [], name: "InvalidAddress", type: "error" },
  { inputs: [], name: "InvalidPropertyId", type: "error" },
  { inputs: [], name: "InvalidRating", type: "error" },
  { inputs: [], name: "InvalidReviewId", type: "error" },
  { inputs: [], name: "MustHaveSBT", type: "error" },
  { inputs: [], name: "NotAuthorized", type: "error" },
  { inputs: [], name: "ReviewNotFlagged", type: "error" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "moderator", type: "address" },
      { indexed: false, name: "status", type: "bool" },
    ],
    name: "ModeratorSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "reviewId", type: "uint256" },
      { indexed: false, name: "reason", type: "string" },
      { indexed: true, name: "flaggedBy", type: "address" },
    ],
    name: "ReviewFlagged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "reviewId", type: "uint256" },
      { indexed: true, name: "propertyId", type: "uint256" },
      { indexed: true, name: "reviewer", type: "address" },
      { indexed: false, name: "reviewee", type: "address" },
      { indexed: false, name: "rating", type: "uint8" },
    ],
    name: "ReviewPublished",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "reviewId", type: "uint256" },
      { indexed: true, name: "unflaggedBy", type: "address" },
    ],
    name: "ReviewUnflagged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "reviewId", type: "uint256" },
      { indexed: true, name: "voter", type: "address" },
      { indexed: false, name: "helpful", type: "bool" },
    ],
    name: "ReviewVoted",
    type: "event",
  },
] as const;

export const TravelerSBTAbi = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  { inputs: [], name: "AlreadyHasSBT", type: "error" },
  { inputs: [], name: "NoSBT", type: "error" },
  { inputs: [], name: "SoulboundToken", type: "error" },
  { inputs: [], name: "NotAuthorized", type: "error" },
  { inputs: [], name: "InvalidRating", type: "error" },
  { inputs: [], name: "TravelerIsSuspended", type: "error" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "traveler", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "TravelerMinted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "traveler", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "newRating", type: "uint256" },
      { indexed: false, name: "newTier", type: "uint8" },
    ],
    name: "ReputationUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "traveler", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "oldTier", type: "uint8" },
      { indexed: false, name: "newTier", type: "uint8" },
    ],
    name: "TierUpgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "traveler", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "TravelerSuspended",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "traveler", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "TravelerUnsuspended",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "updater", type: "address" },
      { indexed: false, name: "authorized", type: "bool" },
    ],
    name: "AuthorizedUpdaterSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "traveler", type: "address" },
      { indexed: true, name: "sbtTokenId", type: "uint256" },
      { indexed: false, name: "roomTokenId", type: "uint256" },
      { indexed: false, name: "bookingIndex", type: "uint256" },
    ],
    name: "BookingLinked",
    type: "event",
  },
] as const;

export const HostSBTAbi = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  { inputs: [], name: "AlreadyHasSBT", type: "error" },
  { inputs: [], name: "NoSBT", type: "error" },
  { inputs: [], name: "SoulboundToken", type: "error" },
  { inputs: [], name: "NotAuthorized", type: "error" },
  { inputs: [], name: "InvalidRating", type: "error" },
  { inputs: [], name: "HostIsSuspended", type: "error" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "host", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "HostMinted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "host", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "newRating", type: "uint256" },
      { indexed: false, name: "newTier", type: "uint8" },
    ],
    name: "ReputationUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "host", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "oldTier", type: "uint8" },
      { indexed: false, name: "newTier", type: "uint8" },
    ],
    name: "TierUpgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "host", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "SuperHostAwarded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "host", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "SuperHostRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "propertyId", type: "uint256" },
    ],
    name: "PropertyLinked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "propertyId", type: "uint256" },
    ],
    name: "PropertyUnlinked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "host", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "HostSuspended",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "host", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "HostUnsuspended",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "updater", type: "address" },
      { indexed: false, name: "authorized", type: "bool" },
    ],
    name: "AuthorizedUpdaterSet",
    type: "event",
  },
] as const;
