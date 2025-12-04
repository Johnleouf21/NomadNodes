/**
 * Booking hooks for BookingManager contract
 * Handles booking creation, retrieval, and management
 */

import * as React from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import type { Address } from "viem";
import { getStartOfDayTimestamp } from "./useAvailability";

/*//////////////////////////////////////////////////////////////
                              TYPES
//////////////////////////////////////////////////////////////*/

export enum BookingStatus {
  Pending = 0,
  Confirmed = 1,
  CheckedIn = 2,
  Completed = 3,
  Cancelled = 4,
}

export interface BookingData {
  bookingId: bigint;
  tokenId: bigint;
  propertyId: bigint;
  traveler: Address;
  checkIn: bigint;
  checkOut: bigint;
  escrowAddress: Address;
  status: BookingStatus;
  createdAt: bigint;
}

/*//////////////////////////////////////////////////////////////
                          READ HOOKS
//////////////////////////////////////////////////////////////*/

/**
 * Get a specific booking by ID from BookingManager
 */
export function useGetBooking(bookingId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    ...CONTRACTS.bookingManager,
    functionName: "getBooking",
    args: bookingId !== undefined ? [bookingId] : undefined,
    query: {
      enabled: bookingId !== undefined,
    },
  });

  const booking = React.useMemo(() => {
    if (!data) return null;

    const bookingData = data as any;
    return {
      bookingId: bookingData.bookingId as bigint,
      tokenId: bookingData.tokenId as bigint,
      propertyId: bookingData.propertyId as bigint,
      traveler: bookingData.traveler as Address,
      checkIn: bookingData.checkIn as bigint,
      checkOut: bookingData.checkOut as bigint,
      escrowAddress: bookingData.escrowAddress as Address,
      status: bookingData.status as BookingStatus,
      createdAt: bookingData.createdAt as bigint,
    };
  }, [data]);

  return {
    booking,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get all bookings for a specific room type (token ID)
 */
export function useGetBookings(tokenId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    ...CONTRACTS.bookingManager,
    functionName: "getBookingsForRoom",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });

  const bookings = React.useMemo(() => {
    if (!data) return [];

    return (data as any[]).map((booking) => ({
      bookingId: booking.bookingId as bigint,
      tokenId: booking.tokenId as bigint,
      propertyId: booking.propertyId as bigint,
      traveler: booking.traveler as Address,
      checkIn: booking.checkIn as bigint,
      checkOut: booking.checkOut as bigint,
      escrowAddress: booking.escrowAddress as Address,
      status: booking.status as BookingStatus,
      createdAt: booking.createdAt as bigint,
    }));
  }, [data]);

  return {
    bookings,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Check if a token has active bookings
 */
export function useHasActiveBookings(tokenId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    ...CONTRACTS.bookingManager,
    functionName: "hasActiveBookings",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });

  return {
    hasActiveBookings: data as boolean,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get total number of bookings
 */
export function useTotalBookings() {
  return useReadContract({
    ...CONTRACTS.bookingManager,
    functionName: "totalBookings",
  });
}

/*//////////////////////////////////////////////////////////////
                        WRITE HOOKS
//////////////////////////////////////////////////////////////*/

/**
 * Create a new booking via BookingManager
 * Note: In production, bookings are typically created through the escrow system
 */
export function useCreateBooking() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const createBooking = React.useCallback(
    (tokenId: bigint, traveler: Address, checkIn: Date, checkOut: Date, escrowAddress: Address) => {
      const checkInTimestamp = BigInt(getStartOfDayTimestamp(checkIn));
      const checkOutTimestamp = BigInt(getStartOfDayTimestamp(checkOut));

      writeContract({
        ...CONTRACTS.bookingManager,
        functionName: "createBooking",
        args: [tokenId, traveler, checkInTimestamp, checkOutTimestamp, escrowAddress],
      });
    },
    [writeContract]
  );

  return {
    createBooking,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
    txHash,
  };
}

/**
 * Confirm a booking (host or escrow)
 */
export function useConfirmBooking() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const confirmBooking = React.useCallback(
    (bookingId: bigint) => {
      writeContract({
        ...CONTRACTS.bookingManager,
        functionName: "confirmBooking",
        args: [bookingId],
      });
    },
    [writeContract]
  );

  return {
    confirmBooking,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
    txHash,
  };
}

/**
 * Check in a booking (guest arrives)
 */
export function useCheckIn() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const checkIn = React.useCallback(
    (bookingId: bigint) => {
      writeContract({
        ...CONTRACTS.bookingManager,
        functionName: "checkIn",
        args: [bookingId],
      });
    },
    [writeContract]
  );

  return {
    checkIn,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
    txHash,
  };
}

/**
 * Complete a booking (escrow or review registry)
 */
export function useCompleteBooking() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const completeBooking = React.useCallback(
    (bookingId: bigint) => {
      writeContract({
        ...CONTRACTS.bookingManager,
        functionName: "completeBooking",
        args: [bookingId],
      });
    },
    [writeContract]
  );

  return {
    completeBooking,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
    txHash,
  };
}

/**
 * Cancel a booking (traveler, host, or escrow)
 */
export function useCancelBooking() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const cancelBooking = React.useCallback(
    (bookingId: bigint) => {
      writeContract({
        ...CONTRACTS.bookingManager,
        functionName: "cancelBooking",
        args: [bookingId],
      });
    },
    [writeContract]
  );

  return {
    cancelBooking,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
    txHash,
  };
}

/*//////////////////////////////////////////////////////////////
                        HELPER HOOKS
//////////////////////////////////////////////////////////////*/

/**
 * @deprecated Use useBookRoom instead - renamed for clarity
 */
export function useBookRoom() {
  return useCreateBooking();
}

/**
 * Get booking status label
 */
export function getBookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.Pending:
      return "Pending";
    case BookingStatus.Confirmed:
      return "Confirmed";
    case BookingStatus.CheckedIn:
      return "Checked In";
    case BookingStatus.Completed:
      return "Completed";
    case BookingStatus.Cancelled:
      return "Cancelled";
    default:
      return "Unknown";
  }
}

/**
 * Get booking status color
 */
export function getBookingStatusColor(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.Pending:
      return "yellow";
    case BookingStatus.Confirmed:
      return "blue";
    case BookingStatus.CheckedIn:
      return "purple";
    case BookingStatus.Completed:
      return "green";
    case BookingStatus.Cancelled:
      return "red";
    default:
      return "gray";
  }
}

/**
 * Get all bookings for a traveler (across all properties)
 * Note: This requires filtering through all bookings
 * In production, use Ponder GraphQL queries for better performance
 * @deprecated Use Ponder GraphQL queries instead
 */
export function useGetTravelerBookings(_travelerAddress: Address | undefined, _tokenIds: bigint[]) {
  // This function is deprecated - use Ponder queries instead
  return {
    bookings: [] as Array<BookingData & { bookingIndex: number }>,
    isLoading: false,
  };
}
