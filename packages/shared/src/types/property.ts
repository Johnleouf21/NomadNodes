export enum PropertyType {
  APARTMENT = "APARTMENT",
  HOUSE = "HOUSE",
  VILLA = "VILLA",
  ROOM = "ROOM",
}

export enum PropertyStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
}

export interface Property {
  id: string;
  tokenId: number;
  hostId: string;
  name: string;
  description: string;
  propertyType: PropertyType;
  totalUnits: number;
  availableUnits: number;
  pricePerNightUSDC: string;
  pricePerNightEURC: string;
  location: PropertyLocation;
  amenities: string[];
  images: string[];
  status: PropertyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyLocation {
  country: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
}
