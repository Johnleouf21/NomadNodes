"use client";

/**
 * Hook to manage booking filters and sorting
 */

import * as React from "react";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { PropertyWithMetadata } from "@/hooks/usePonderPropertiesWithMetadata";
import type { BookingStatusFilter, SortOption } from "../../../../booking";
import type { PropertyInfo, BookingCounts, PropertyFilterOption } from "../../../types";
import { getIPFSUrl } from "@/lib/utils/ipfs";

interface UseBookingFiltersProps {
  bookings: PonderBooking[] | undefined;
  allProperties: PropertyWithMetadata[];
  hostProperties: any;
}

interface UseBookingFiltersReturn {
  // Filter state
  statusFilter: BookingStatusFilter;
  setStatusFilter: (filter: BookingStatusFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  propertyFilter: string;
  setPropertyFilter: (filter: string) => void;

  // Computed values
  filteredBookings: PonderBooking[];
  bookingCounts: BookingCounts;
  propertiesForFilter: PropertyFilterOption[];
  propertyMap: Map<string, PropertyWithMetadata>;
  getPropertyInfo: (booking: PonderBooking) => PropertyInfo;
}

/**
 * Manage booking filters and sorting
 */
export function useBookingFilters({
  bookings,
  allProperties,
  hostProperties,
}: UseBookingFiltersProps): UseBookingFiltersReturn {
  // Filter state
  const [statusFilter, setStatusFilter] = React.useState<BookingStatusFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortOption>("date-desc");
  const [propertyFilter, setPropertyFilter] = React.useState("all");

  // Property lookup map
  const propertyMap = React.useMemo(() => {
    const map = new Map<string, PropertyWithMetadata>();
    allProperties.forEach((p: PropertyWithMetadata) => {
      map.set(p.propertyId.toString(), p);
    });
    return map;
  }, [allProperties]);

  // Get property info helper
  const getPropertyInfo = React.useCallback(
    (booking: PonderBooking): PropertyInfo => {
      const property = propertyMap.get(booking.propertyId);
      const name = property?.metadata?.name || `Property #${booking.propertyId}`;
      let imageUrl = "/images/property-placeholder.jpg";
      if (property?.metadata?.images && property.metadata.images.length > 0) {
        imageUrl = getIPFSUrl(property.metadata.images[0]);
      }
      return { name, imageUrl };
    },
    [propertyMap]
  );

  // Properties for filter dropdown
  const propertiesForFilter: PropertyFilterOption[] = React.useMemo(() => {
    if (!hostProperties) return [];
    return hostProperties.map((p: any) => {
      const propertyIdStr = p.propertyId.toString();
      const metadata = propertyMap.get(propertyIdStr);
      return {
        id: propertyIdStr,
        name: metadata?.metadata?.name || `Property #${p.propertyId}`,
      };
    });
  }, [hostProperties, propertyMap]);

  // Booking counts by status
  const bookingCounts: BookingCounts = React.useMemo(() => {
    const counts: BookingCounts = {
      all: 0,
      Pending: 0,
      Confirmed: 0,
      CheckedIn: 0,
      Completed: 0,
      Cancelled: 0,
    };
    if (!bookings) return counts;

    bookings.forEach((b: PonderBooking) => {
      counts.all++;
      counts[b.status]++;
    });
    return counts;
  }, [bookings]);

  // Filtered and sorted bookings
  const filteredBookings = React.useMemo(() => {
    if (!bookings) return [];

    let filtered = [...bookings];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Apply property filter
    if (propertyFilter !== "all") {
      filtered = filtered.filter((b) => b.propertyId === propertyFilter);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((b) => {
        const { name } = getPropertyInfo(b);
        return (
          b.traveler.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query) ||
          b.bookingIndex.toLowerCase().includes(query) ||
          name.toLowerCase().includes(query)
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return Number(b.checkInDate) - Number(a.checkInDate);
        case "date-asc":
          return Number(a.checkInDate) - Number(b.checkInDate);
        case "amount-desc":
          return Number(b.totalPrice) - Number(a.totalPrice);
        case "amount-asc":
          return Number(a.totalPrice) - Number(b.totalPrice);
        case "status": {
          const statusOrder = {
            Pending: 0,
            Confirmed: 1,
            CheckedIn: 2,
            Completed: 3,
            Cancelled: 4,
          };
          return statusOrder[a.status] - statusOrder[b.status];
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [bookings, statusFilter, propertyFilter, searchQuery, sortBy, getPropertyInfo]);

  return {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    propertyFilter,
    setPropertyFilter,
    filteredBookings,
    bookingCounts,
    propertiesForFilter,
    propertyMap,
    getPropertyInfo,
  };
}
