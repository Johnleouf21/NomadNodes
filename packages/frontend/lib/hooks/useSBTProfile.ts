/**
 * Hook for fetching complete SBT profile data
 * Includes token ID, profile stats, and tokenURI with SVG image
 */

import * as React from "react";
import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import type { Address } from "viem";

// Type definitions matching contract structs
export interface TravelerProfile {
  totalBookings: bigint;
  completedStays: bigint;
  cancelledBookings: bigint;
  averageRating: bigint; // 0-500 (5.00 stars = 500)
  totalReviewsReceived: bigint;
  positiveReviews: bigint;
  memberSince: bigint;
  lastActivityTimestamp: bigint;
  tier: number; // 0=Newcomer, 1=Regular, 2=Trusted, 3=Elite
  timesReportedByHosts: bigint;
  suspended: boolean;
}

export interface HostProfile {
  totalPropertiesListed: bigint;
  totalBookingsReceived: bigint;
  completedBookings: bigint;
  averageRating: bigint; // 0-500 (5.00 stars = 500)
  totalReviewsReceived: bigint;
  positiveReviews: bigint;
  averageResponseTime: bigint; // in minutes
  acceptanceRate: bigint; // 0-10000 basis points (100% = 10000)
  cancellationsByHost: bigint;
  memberSince: bigint;
  lastActivityTimestamp: bigint;
  tier: number; // 0=Newcomer, 1=Experienced, 2=Pro, 3=SuperHost
  superHost: boolean;
  timesReportedByTravelers: bigint;
  suspended: boolean;
}

export interface SBTTokenData {
  tokenId: bigint;
  tokenURI: string;
  imageData: string | null; // Extracted base64 SVG from tokenURI
}

// Helper to parse tokenURI and extract image
function parseTokenURI(tokenURI: string): string | null {
  try {
    // tokenURI format: "data:application/json;base64,..."
    if (!tokenURI.startsWith("data:application/json;base64,")) {
      return null;
    }

    const base64Data = tokenURI.replace("data:application/json;base64,", "");
    const jsonString = atob(base64Data);
    const metadata = JSON.parse(jsonString);

    // Extract image data (format: "data:image/svg+xml;base64,...")
    return metadata.image || null;
  } catch (error) {
    console.error("Failed to parse tokenURI:", error);
    return null;
  }
}

// ===== Traveler SBT Hooks =====

export function useTravelerTokenId(address: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.travelerSBT,
    functionName: "walletToTokenId",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useTravelerProfile(address: Address | undefined) {
  const { data: tokenId } = useTravelerTokenId(address);

  return useReadContract({
    ...CONTRACTS.travelerSBT,
    functionName: "profiles",
    args: tokenId && typeof tokenId === "bigint" ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId && typeof tokenId === "bigint" && tokenId > 0n,
    },
  });
}

export function useTravelerTokenURI(address: Address | undefined) {
  const { data: tokenId } = useTravelerTokenId(address);

  return useReadContract({
    ...CONTRACTS.travelerSBT,
    functionName: "tokenURI",
    args: tokenId && typeof tokenId === "bigint" ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId && typeof tokenId === "bigint" && tokenId > 0n,
    },
  });
}

export function useTravelerSBTData(address: Address | undefined) {
  const { data: tokenId, isLoading: isLoadingTokenId } = useTravelerTokenId(address);
  const { data: profile, isLoading: isLoadingProfile } = useTravelerProfile(address);
  const { data: tokenURI, isLoading: isLoadingURI } = useTravelerTokenURI(address);

  const imageData = React.useMemo(() => {
    if (!tokenURI) return null;
    return parseTokenURI(tokenURI as string);
  }, [tokenURI]);

  return {
    tokenId: tokenId as bigint | undefined,
    profile: profile as TravelerProfile | undefined,
    tokenURI: tokenURI as string | undefined,
    imageData,
    isLoading: isLoadingTokenId || isLoadingProfile || isLoadingURI,
    hasToken: !!tokenId && typeof tokenId === "bigint" && tokenId > 0n,
  };
}

// ===== Host SBT Hooks =====

export function useHostTokenId(address: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.hostSBT,
    functionName: "walletToTokenId",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useHostProfile(address: Address | undefined) {
  const { data: tokenId } = useHostTokenId(address);

  return useReadContract({
    ...CONTRACTS.hostSBT,
    functionName: "profiles",
    args: tokenId && typeof tokenId === "bigint" ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId && typeof tokenId === "bigint" && tokenId > 0n,
    },
  });
}

export function useHostTokenURI(address: Address | undefined) {
  const { data: tokenId } = useHostTokenId(address);

  return useReadContract({
    ...CONTRACTS.hostSBT,
    functionName: "tokenURI",
    args: tokenId && typeof tokenId === "bigint" ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId && typeof tokenId === "bigint" && tokenId > 0n,
    },
  });
}

export function useHostSBTData(address: Address | undefined) {
  const { data: tokenId, isLoading: isLoadingTokenId } = useHostTokenId(address);
  const { data: profile, isLoading: isLoadingProfile } = useHostProfile(address);
  const { data: tokenURI, isLoading: isLoadingURI } = useHostTokenURI(address);

  const imageData = React.useMemo(() => {
    if (!tokenURI) return null;
    return parseTokenURI(tokenURI as string);
  }, [tokenURI]);

  return {
    tokenId: tokenId as bigint | undefined,
    profile: profile as HostProfile | undefined,
    tokenURI: tokenURI as string | undefined,
    imageData,
    isLoading: isLoadingTokenId || isLoadingProfile || isLoadingURI,
    hasToken: !!tokenId && typeof tokenId === "bigint" && tokenId > 0n,
  };
}

// Helper functions to format data
export function formatRating(rating: bigint): string {
  if (rating === 0n) return "N/A";
  const ratingNum = Number(rating);
  const whole = Math.floor(ratingNum / 100);
  const decimal = ratingNum % 100;
  return `${whole}.${decimal.toString().padStart(2, "0")}`;
}

export function getTierName(tier: number, isTraveler: boolean): string {
  if (isTraveler) {
    return ["Newcomer", "Regular", "Trusted", "Elite"][tier] || "Unknown";
  } else {
    return ["Newcomer", "Experienced", "Pro", "SuperHost"][tier] || "Unknown";
  }
}

export function formatAcceptanceRate(rate: bigint): string {
  const rateNum = Number(rate) / 100; // Convert from basis points to percentage
  return `${rateNum.toFixed(1)}%`;
}
