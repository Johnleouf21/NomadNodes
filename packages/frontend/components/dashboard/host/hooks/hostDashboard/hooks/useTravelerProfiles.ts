"use client";

/**
 * Hook to manage traveler profiles
 */

import * as React from "react";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { TravelerProfile } from "../../../types";
import { fetchTravelerProfiles } from "../services/travelerProfiles";

interface UseTravelerProfilesReturn {
  travelerProfiles: Map<string, TravelerProfile>;
  getTravelerProfile: (address: string) => TravelerProfile | undefined;
}

/**
 * Fetch and manage traveler profiles
 */
export function useTravelerProfiles(
  bookings: PonderBooking[] | undefined
): UseTravelerProfilesReturn {
  const [travelerProfiles, setTravelerProfiles] = React.useState<Map<string, TravelerProfile>>(
    new Map()
  );

  React.useEffect(() => {
    async function loadProfiles() {
      if (!bookings || bookings.length === 0) return;

      const travelerAddresses = [...new Set(bookings.map((b) => b.traveler.toLowerCase()))];
      if (travelerAddresses.length === 0) return;

      const profiles = await fetchTravelerProfiles(travelerAddresses);
      setTravelerProfiles(profiles);
    }

    loadProfiles();
  }, [bookings]);

  const getTravelerProfile = React.useCallback(
    (travelerAddress: string): TravelerProfile | undefined => {
      return travelerProfiles.get(travelerAddress.toLowerCase());
    },
    [travelerProfiles]
  );

  return { travelerProfiles, getTravelerProfile };
}
