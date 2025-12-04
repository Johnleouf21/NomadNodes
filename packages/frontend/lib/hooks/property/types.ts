/**
 * Type definitions for Property contracts (PropertyRegistry + RoomTypeNFT)
 */

// Metadata for creating a property (stored on IPFS)
export interface PropertyMetadata {
  name: string;
  description: string;
  propertyType: "hotel" | "villa" | "apartment" | "cabin";
  location: string;
  country: string;
  city: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  images: string[]; // IPFS hashes or URLs
  amenities: string[];
  houseRules: string[];
}

// Smart contract Property structure (from PropertyRegistry)
export interface PropertyData {
  propertyId: bigint;
  hostWallet: string;
  hostSbtTokenId: bigint;
  isActive: boolean;
  totalBookings: bigint;
  averageRating: bigint;
  totalRatings: bigint;
  createdAt: bigint;
  lastBookingTimestamp: bigint;
  propertyType: string;
  location: string;
  ipfsMetadataHash: string;
}

// Room type data for creating rooms
export interface RoomTypeData {
  name: string;
  description: string;
  maxSupply: number;
  pricePerNight: number; // Price in stablecoin units (6 decimals for USDC/EURC)
  cleaningFee: number; // Cleaning fee in stablecoin units
  currency: "USD" | "EUR"; // Fiat currency for pricing
  maxGuests: number;
  amenities: string[];
  images: string[];
  // Deprecated fields (kept for backwards compatibility)
  minStayNights?: number;
  maxStayNights?: number;
}

// Smart contract RoomType structure (from RoomTypeNFT)
export interface RoomTypeContractData {
  tokenId: bigint;
  propertyId: bigint;
  roomTypeId: bigint;
  name: string;
  ipfsHash: string;
  pricePerNight: bigint;
  cleaningFee: bigint;
  maxGuests: bigint;
  maxSupply: bigint;
  currentSupply: bigint;
  isActive: boolean;
  isDeleted: boolean;
}
