/**
 * Hook for finding escrow ID from escrow address
 */

import * as React from "react";
import { useReadContracts } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import type { ReviewableBooking } from "../types";
import { ESCROW_SEARCH_TIMEOUT_MS } from "../constants";

interface UseEscrowLookupResult {
  foundEscrowId: bigint | null;
  isSearching: boolean;
  searchComplete: boolean;
}

export function useEscrowLookup(booking: ReviewableBooking | null): UseEscrowLookupResult {
  const [foundEscrowId, setFoundEscrowId] = React.useState<bigint | null>(null);
  const [searchComplete, setSearchComplete] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const bookingManagerAddress = CONTRACTS.bookingManager.address;
  const queryEnabled = !!booking?.escrowAddress;

  // If escrow address is missing, mark search as complete immediately
  React.useEffect(() => {
    if (booking && !booking.escrowAddress) {
      setSearchComplete(true);
    }
  }, [booking]);

  // Timeout to prevent infinite loading
  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!searchComplete && !foundEscrowId && booking?.escrowAddress) {
      timeoutRef.current = setTimeout(() => {
        setSearchComplete(true);
        timeoutRef.current = null;
      }, ESCROW_SEARCH_TIMEOUT_MS);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [searchComplete, foundEscrowId, booking?.escrowAddress]);

  // Build contracts array for querying escrows from both BookingManager and traveler
  const escrowQueryContracts = React.useMemo(() => {
    if (!booking?.escrowAddress) return [];
    const contracts: {
      address: `0x${string}`;
      abi: typeof CONTRACTS.escrowRegistry.abi;
      functionName: "getUserEscrows";
      args: [`0x${string}`];
    }[] = [
      {
        address: CONTRACTS.escrowRegistry.address,
        abi: CONTRACTS.escrowRegistry.abi,
        functionName: "getUserEscrows",
        args: [bookingManagerAddress],
      },
    ];
    if (booking?.travelerAddress) {
      contracts.push({
        address: CONTRACTS.escrowRegistry.address,
        abi: CONTRACTS.escrowRegistry.abi,
        functionName: "getUserEscrows",
        args: [booking.travelerAddress],
      });
    }
    return contracts;
  }, [booking?.escrowAddress, booking?.travelerAddress, bookingManagerAddress]);

  // Query escrows from both BookingManager (primary) and traveler (fallback)
  const {
    data: escrowOwnerData,
    isLoading: isLoadingEscrowIds,
    error: escrowQueryError,
  } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: escrowQueryContracts as any,
    query: {
      enabled: queryEnabled && escrowQueryContracts.length > 0,
    },
  });

  // Debug query error
  React.useEffect(() => {
    if (escrowQueryError) {
      console.error("ReviewSubmissionForm - Escrow query error:", escrowQueryError);
    }
  }, [escrowQueryError]);

  // Combine escrow IDs from both sources
  const userEscrowIds = React.useMemo(() => {
    if (!escrowOwnerData) return undefined;
    const bookingManagerEscrows = escrowOwnerData[0]?.result as bigint[] | undefined;
    const travelerEscrows = escrowOwnerData[1]?.result as bigint[] | undefined;
    const combined = [...(bookingManagerEscrows || []), ...(travelerEscrows || [])];
    const unique = [...new Set(combined.map((id) => id.toString()))].map((id) => BigInt(id));
    return unique.length > 0 ? unique : undefined;
  }, [escrowOwnerData]);

  const firstQueryComplete =
    !isLoadingEscrowIds && (escrowOwnerData !== undefined || !queryEnabled);

  // Resolve escrowId from escrowAddress using multicall
  const escrowAddressQueries = React.useMemo(() => {
    if (!userEscrowIds) return [];
    return userEscrowIds.map((escrowId) => ({
      address: CONTRACTS.escrowRegistry.address,
      abi: CONTRACTS.escrowRegistry.abi,
      functionName: "escrows",
      args: [escrowId],
    }));
  }, [userEscrowIds]);

  const { data: escrowAddressesData } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: escrowAddressQueries as any,
    query: {
      enabled: escrowAddressQueries.length > 0 && !!booking?.escrowAddress,
    },
  });

  // Handle case when user has no escrows
  React.useEffect(() => {
    if (firstQueryComplete && booking?.escrowAddress) {
      if (!userEscrowIds || userEscrowIds.length === 0) {
        setSearchComplete(true);
      }
    }
  }, [firstQueryComplete, userEscrowIds, booking?.escrowAddress]);

  // Find matching escrowId from escrow addresses
  React.useEffect(() => {
    if (
      !escrowAddressesData ||
      !userEscrowIds ||
      userEscrowIds.length === 0 ||
      !booking?.escrowAddress
    )
      return;

    for (let i = 0; i < escrowAddressesData.length; i++) {
      const result = escrowAddressesData[i];
      if (
        result?.result &&
        (result.result as string).toLowerCase() === booking.escrowAddress.toLowerCase()
      ) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setFoundEscrowId(userEscrowIds[i]);
        setSearchComplete(true);
        return;
      }
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setSearchComplete(true);
  }, [escrowAddressesData, userEscrowIds, booking?.escrowAddress]);

  // Reset when booking changes
  React.useEffect(() => {
    if (booking) {
      setFoundEscrowId(null);
      setSearchComplete(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [booking?.id]);

  return {
    foundEscrowId,
    isSearching: !searchComplete && !foundEscrowId,
    searchComplete,
  };
}
