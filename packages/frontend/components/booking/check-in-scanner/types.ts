/**
 * Types for CheckInScanner
 */

export interface ScannedData {
  type: string;
  propertyId: string;
  hostAddress: string;
  version: string;
}

export interface MatchedBooking {
  id: string;
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
  escrowAddress?: string;
  roomName?: string;
  tokenId: string;
  bookingIndex: string;
}

export interface PendingCheckIn {
  tokenId: string;
  bookingIndex: string;
}

export const ESCROW_ABI = [
  {
    inputs: [],
    name: "confirmStay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
