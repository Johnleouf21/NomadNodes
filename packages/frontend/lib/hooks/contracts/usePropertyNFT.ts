/**
 * Property Contract Hooks
 * Updated to use PropertyRegistry, RoomTypeNFT, and BookingManager
 */

import { useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import type { Address } from "viem";

// Read Hooks - RoomTypeNFT (ERC1155)
export function useBalanceOf(account: Address, tokenId: bigint) {
  return useReadContract({
    ...CONTRACTS.roomTypeNFT,
    functionName: "balanceOf",
    args: [account, tokenId],
  });
}

// Read Hooks - PropertyRegistry
export function useGetProperty(propertyId: bigint) {
  return useReadContract({
    ...CONTRACTS.propertyRegistry,
    functionName: "getProperty",
    args: [propertyId],
  });
}

/**
 * @deprecated Use Ponder GraphQL queries instead
 */
export function useGetHostProperties(_host: Address) {
  // This function is no longer available in the new architecture
  // Use Ponder GraphQL to query properties by host
  return {
    data: undefined,
    isLoading: false,
    error: null,
  };
}

/**
 * @deprecated Use BookingManager or Ponder GraphQL instead
 */
export function useGetPropertyBookings(_tokenId: bigint) {
  // Bookings are now managed by BookingManager
  // Use Ponder GraphQL to query bookings
  return {
    data: undefined,
    isLoading: false,
    error: null,
  };
}

// Read Hooks - RoomTypeNFT URI
export function useUri(tokenId: bigint) {
  return useReadContract({
    ...CONTRACTS.roomTypeNFT,
    functionName: "uri",
    args: [tokenId],
  });
}

/**
 * @deprecated Use usePropertyById from usePropertyQueries instead
 */
export function useIsPropertyActive(_tokenId: bigint) {
  // Property active status is now in PropertyRegistry
  return {
    data: undefined,
    isLoading: false,
    error: null,
  };
}

// Write Hooks
export function useCreateProperty() {
  return useWriteContract();
}

export function useUpdateProperty() {
  return useWriteContract();
}

export function useSetPropertyStatus() {
  return useWriteContract();
}

export function useCreateBooking() {
  return useWriteContract();
}

export function useUpdateBookingStatus() {
  return useWriteContract();
}

// Event Hooks - PropertyRegistry
export function useWatchPropertyCreated(
  onLogs: (logs: any[]) => void,
  options?: { enabled?: boolean }
) {
  useWatchContractEvent({
    ...CONTRACTS.propertyRegistry,
    eventName: "PropertyCreated",
    onLogs,
    ...options,
  });
}

// Event Hooks - BookingManager
export function useWatchBookingCreated(
  onLogs: (logs: any[]) => void,
  options?: { enabled?: boolean }
) {
  useWatchContractEvent({
    ...CONTRACTS.bookingManager,
    eventName: "BookingCreated",
    onLogs,
    ...options,
  });
}

export function useWatchBookingStatusUpdated(
  onLogs: (logs: any[]) => void,
  options?: { enabled?: boolean }
) {
  // Note: In new architecture, booking status changes emit different events
  // BookingConfirmed, BookingCheckedIn, BookingCompleted, BookingCancelled
  useWatchContractEvent({
    ...CONTRACTS.bookingManager,
    eventName: "BookingConfirmed",
    onLogs,
    ...options,
  });
}
