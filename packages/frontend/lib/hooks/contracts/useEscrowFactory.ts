/**
 * EscrowFactory Contract Hooks
 */

import { useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import type { Address } from "viem";

// Read Hooks
export function usePropertyNFTAddress() {
  return useReadContract({
    ...CONTRACTS.escrowFactory,
    functionName: "propertyNFT",
  });
}

export function usePlatformWallet() {
  return useReadContract({
    ...CONTRACTS.escrowFactory,
    functionName: "platformWallet",
  });
}

export function useBackendSigner() {
  return useReadContract({
    ...CONTRACTS.escrowFactory,
    functionName: "backendSigner",
  });
}

export function useGetEscrow(bookingId: bigint) {
  return useReadContract({
    ...CONTRACTS.escrowFactory,
    functionName: "getEscrow",
    args: [bookingId],
  });
}

export function useGetAllEscrows() {
  return useReadContract({
    ...CONTRACTS.escrowFactory,
    functionName: "getAllEscrows",
  });
}

export function useGetHostEscrows(host: Address) {
  return useReadContract({
    ...CONTRACTS.escrowFactory,
    functionName: "getHostEscrows",
    args: [host],
  });
}

export function useGetTravelerEscrows(traveler: Address) {
  return useReadContract({
    ...CONTRACTS.escrowFactory,
    functionName: "getTravelerEscrows",
    args: [traveler],
  });
}

// Write Hooks
export function useCreateEscrow() {
  return useWriteContract();
}

export function useSetPropertyNFT() {
  return useWriteContract();
}

// Event Hooks
export function useWatchEscrowCreated(
  onLogs: (logs: any[]) => void,
  options?: { enabled?: boolean }
) {
  useWatchContractEvent({
    ...CONTRACTS.escrowFactory,
    eventName: "EscrowCreated",
    onLogs,
    ...options,
  });
}
