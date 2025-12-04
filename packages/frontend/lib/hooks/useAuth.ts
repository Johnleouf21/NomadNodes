/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Authentication Hook
 * Manages wallet connection and SBT verification
 */

import { useAccount, useReadContract } from "wagmi";
import { useUserStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { CONTRACTS } from "@/lib/contracts";

// Contract addresses from environment
const TRAVELER_SBT_ADDRESS = (process.env.NEXT_PUBLIC_TRAVELER_SBT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;
const _HOST_SBT_ADDRESS = (process.env.NEXT_PUBLIC_HOST_SBT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export function useAuth() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  // Track if wagmi has had time to restore session after client mount
  const [isReady, setIsReady] = useState(false);

  // Wait for client mount + give wagmi time to restore session
  useEffect(() => {
    // If already connected, we're ready immediately
    if (isConnected) {
      setIsReady(true);
      return;
    }
    // Otherwise wait a bit for wagmi to reconnect
    const timer = setTimeout(() => setIsReady(true), 1500);
    return () => clearTimeout(timer);
  }, [isConnected]);
  const { profile, setProfile } = useUserStore();

  // Check if user has Traveler SBT using the contract's hasSBT function
  const shouldCheckContracts =
    TRAVELER_SBT_ADDRESS !== "0x0000000000000000000000000000000000000000";

  const { data: hasTravelerSBT, isLoading: isLoadingTravelerSBT } = useReadContract({
    ...CONTRACTS.travelerSBT,
    functionName: "hasSBT",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected && shouldCheckContracts,
      staleTime: 5 * 60 * 1000, // SBT ownership rarely changes - cache for 5 min
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });

  // Check if user has Host SBT using the contract's hasSBT function
  const { data: hasHostSBT, isLoading: isLoadingHostSBT } = useReadContract({
    ...CONTRACTS.hostSBT,
    functionName: "hasSBT",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected && shouldCheckContracts,
      staleTime: 5 * 60 * 1000, // SBT ownership rarely changes - cache for 5 min
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });

  // Update user profile when SBT status changes
  useEffect(() => {
    if (!address || !isConnected) {
      setProfile({
        address: null,
        hasHostSBT: false,
        hasTravelerSBT: false,
        role: "traveler",
      });
      return;
    }

    // If contracts are not configured, default to having both SBTs for development
    // hasSBT returns a boolean directly
    const hasTraveler = shouldCheckContracts ? hasTravelerSBT === true : true;
    const hasHost = shouldCheckContracts ? hasHostSBT === true : true;

    let role: "traveler" | "host" | "both" = "traveler";
    if (hasTraveler && hasHost) {
      role = "both";
    } else if (hasHost) {
      role = "host";
    }

    setProfile({
      address,
      hasHostSBT: hasHost,
      hasTravelerSBT: hasTraveler,
      role,
    });
  }, [address, isConnected, hasTravelerSBT, hasHostSBT, setProfile, shouldCheckContracts]);

  return {
    address,
    isConnected,
    // Show as connecting until wagmi is ready (prevents redirect during session restore)
    isConnecting: !isReady || isConnecting || isReconnecting,
    isLoadingSBTs: isLoadingTravelerSBT || isLoadingHostSBT,
    hasTravelerSBT: profile.hasTravelerSBT,
    hasHostSBT: profile.hasHostSBT,
    role: profile.role,
  };
}
