"use client";

/**
 * Hook for booking data fetching and transformation
 */

import * as React from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { usePonderBookings, type PonderBooking } from "@/hooks/usePonderBookings";
import { usePonderPropertiesWithMetadata } from "@/hooks/usePonderPropertiesWithMetadata";
import { getIPFSUrl } from "@/lib/utils/ipfs";
import { fetchRoomTypesForBookings } from "../../utils/fetchRoomTypesForBookings";
import type { Address } from "viem";
import type { BookingSummary } from "../../types";

/**
 * Fetch and transform booking data
 */
export function useBookingData() {
  const { address } = useAccount();

  // Fetch bookings from Ponder
  const {
    bookings: ponderBookings,
    loading: loadingBookings,
    refetch: refetchBookings,
  } = usePonderBookings({
    travelerAddress: address?.toLowerCase(),
  });

  // Fetch all properties to get metadata
  const { allProperties, loading: loadingProperties } = usePonderPropertiesWithMetadata({
    isActive: true,
    pageSize: 100,
  });

  // Get unique property IDs from bookings
  const propertyIds = React.useMemo(() => {
    if (!ponderBookings) return [];
    return [...new Set(ponderBookings.map((b: PonderBooking) => b.propertyId))];
  }, [ponderBookings]);

  // Fetch room types for booking properties
  const { data: roomTypesMap } = useQuery({
    queryKey: ["roomTypesForBookings", propertyIds],
    queryFn: () => fetchRoomTypesForBookings(propertyIds),
    enabled: propertyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Transform Ponder bookings to BookingSummary format
  const bookings: BookingSummary[] = React.useMemo(() => {
    if (!ponderBookings || ponderBookings.length === 0) return [];

    const now = Date.now();

    return ponderBookings.map((booking: PonderBooking) => {
      const property = allProperties.find((p) => p.propertyId.toString() === booking.propertyId);
      const metadata = property?.metadata;

      const propertyRoomTypes = roomTypesMap?.get(booking.propertyId) || [];
      const roomType = propertyRoomTypes.find((rt) => rt.tokenId === booking.tokenId);
      const roomName = roomType?.name || `Room #${booking.roomTypeId}`;

      const checkIn = new Date(Number(booking.checkInDate) * 1000);
      const checkOut = new Date(Number(booking.checkOutDate) * 1000);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

      let status: "upcoming" | "past" | "cancelled" = "upcoming";
      if (booking.status === "Cancelled") {
        status = "cancelled";
      } else if (booking.status === "Completed" || checkOut.getTime() < now) {
        status = "past";
      }

      let imageUrl = "";
      if (metadata?.images?.[0]) {
        const img = metadata.images[0];
        imageUrl = img.startsWith("http") ? img : getIPFSUrl(img);
      }

      return {
        id: booking.id,
        propertyId: booking.propertyId,
        propertyName: metadata?.name || `Property #${booking.propertyId}`,
        roomTypeId: booking.roomTypeId,
        roomName,
        tokenId: booking.tokenId,
        bookingIndex: booking.bookingIndex,
        location:
          metadata?.city && metadata?.country
            ? `${metadata.city}, ${metadata.country}`
            : metadata?.location || "Location not available",
        checkIn,
        checkOut,
        nights,
        total: Number(booking.totalPrice || 0) / 1e6,
        currency: roomType?.currency || "USD",
        status,
        ponderStatus: booking.status,
        image: imageUrl,
        escrowAddress: booking.escrowAddress,
        hostAddress: (property?.host as Address) || null,
        travelerAddress: booking.traveler as Address,
      };
    });
  }, [ponderBookings, allProperties, roomTypesMap]);

  // Split bookings
  const upcomingBookings = bookings.filter((b) => b.status === "upcoming");
  const pastBookings = bookings.filter((b) => b.status === "past" || b.status === "cancelled");

  return {
    address,
    bookings,
    upcomingBookings,
    pastBookings,
    loadingBookings,
    loadingProperties,
    refetchBookings,
  };
}
