/**
 * SBT (Soulbound Token) Contract Hooks
 * Covers both HostSBT and TravelerSBT
 */

import { useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import type { Address } from "viem";

// ===== HostSBT Hooks =====

/**
 * Check if an address has a HostSBT
 */
export function useHasHostSBT(address: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.hostSBT,
    functionName: "hasSBT",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get the full host profile from HostSBT
 */
export function useHostProfile(address: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.hostSBT,
    functionName: "getProfile",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get the tokenId for a wallet address
 */
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

/**
 * Get host's property IDs
 */
export function useHostProperties(address: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.hostSBT,
    functionName: "getHostProperties",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get host completion rate (completed vs cancelled)
 */
export function useHostCompletionRate(address: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.hostSBT,
    functionName: "getCompletionRate",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get host token URI (metadata)
 */
export function useHostTokenURI(tokenId: bigint | undefined) {
  return useReadContract({
    ...CONTRACTS.hostSBT,
    functionName: "tokenURI",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });
}

// Deprecated - kept for backwards compatibility
export function useHostSBT(address: Address | undefined) {
  return useHostProfile(address);
}

export function useHostTier(address: Address | undefined) {
  // Tier is part of the profile, use useHostProfile instead
  return useHostProfile(address);
}

export function useHostReputationScore(address: Address | undefined) {
  // Rating is part of the profile (averageRating field)
  return useHostProfile(address);
}

export function useHostVerificationLevel(address: Address | undefined) {
  // HostSBT doesn't have verification level, use profile instead
  return useHostProfile(address);
}

// ===== TravelerSBT Hooks =====

/**
 * Check if an address has a TravelerSBT
 */
export function useHasTravelerSBT(address: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.travelerSBT,
    functionName: "hasSBT",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get the full traveler profile from TravelerSBT
 */
export function useTravelerProfile(address: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.travelerSBT,
    functionName: "getProfile",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get the tokenId for a wallet address
 */
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

/**
 * Get traveler success rate (completed vs cancelled)
 */
export function useTravelerSuccessRate(address: Address | undefined) {
  return useReadContract({
    ...CONTRACTS.travelerSBT,
    functionName: "getSuccessRate",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get traveler token URI (metadata)
 */
export function useTravelerTokenURI(tokenId: bigint | undefined) {
  return useReadContract({
    ...CONTRACTS.travelerSBT,
    functionName: "tokenURI",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });
}

// Deprecated - kept for backwards compatibility
export function useTravelerSBT(address: Address | undefined) {
  return useTravelerProfile(address);
}

export function useTravelerTier(address: Address | undefined) {
  // Tier is part of the profile, use useTravelerProfile instead
  return useTravelerProfile(address);
}

export function useTravelerReputationScore(address: Address | undefined) {
  // Rating is part of the profile (averageRating field)
  return useTravelerProfile(address);
}

export function useTravelerVerificationLevel(address: Address | undefined) {
  // TravelerSBT doesn't have verification level, use profile instead
  return useTravelerProfile(address);
}

// Write Hooks
export function useMintHostSBT() {
  return useWriteContract();
}

export function useMintTravelerSBT() {
  return useWriteContract();
}

export function useUpdateHostReputation() {
  return useWriteContract();
}

export function useUpdateTravelerReputation() {
  return useWriteContract();
}

// Event Hooks - HostSBT
export function useWatchHostSBTMinted(
  onLogs: (logs: any[]) => void,
  options?: { enabled?: boolean }
) {
  useWatchContractEvent({
    ...CONTRACTS.hostSBT,
    eventName: "SBTMinted",
    onLogs,
    ...options,
  });
}

export function useWatchHostReputationUpdated(
  onLogs: (logs: any[]) => void,
  options?: { enabled?: boolean }
) {
  useWatchContractEvent({
    ...CONTRACTS.hostSBT,
    eventName: "ReputationUpdated",
    onLogs,
    ...options,
  });
}

// Event Hooks - TravelerSBT
export function useWatchTravelerSBTMinted(
  onLogs: (logs: any[]) => void,
  options?: { enabled?: boolean }
) {
  useWatchContractEvent({
    ...CONTRACTS.travelerSBT,
    eventName: "SBTMinted",
    onLogs,
    ...options,
  });
}

export function useWatchTravelerReputationUpdated(
  onLogs: (logs: any[]) => void,
  options?: { enabled?: boolean }
) {
  useWatchContractEvent({
    ...CONTRACTS.travelerSBT,
    eventName: "ReputationUpdated",
    onLogs,
    ...options,
  });
}
