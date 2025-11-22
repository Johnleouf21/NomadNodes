export enum UserType {
  HOST = "HOST",
  TRAVELER = "TRAVELER",
}

export interface User {
  id: string;
  walletAddress: string;
  sbtTokenId: number | null;
  userType: UserType;
  createdAt: Date;
  updatedAt: Date;
}

export interface HostProfile extends User {
  userType: UserType.HOST;
  properties: string[];
}

export interface TravelerProfile extends User {
  userType: UserType.TRAVELER;
  bookings: string[];
}
