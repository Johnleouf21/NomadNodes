/**
 * TravelEscrow Contract Hooks
 * Note: TravelEscrow is created dynamically per booking
 */

import { useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import type { Address } from "viem";

// Read Hooks
export function useGetBookingDetails(escrowAddress: Address) {
  return useReadContract({
    address: escrowAddress,
    abi: CONTRACTS.travelEscrow.abi,
    functionName: "getBookingDetails",
  });
}

export function useGetBookingId(escrowAddress: Address) {
  return useReadContract({
    address: escrowAddress,
    abi: CONTRACTS.travelEscrow.abi,
    functionName: "bookingId",
  });
}

export function useGetTraveler(escrowAddress: Address) {
  return useReadContract({
    address: escrowAddress,
    abi: CONTRACTS.travelEscrow.abi,
    functionName: "traveler",
  });
}

export function useGetHost(escrowAddress: Address) {
  return useReadContract({
    address: escrowAddress,
    abi: CONTRACTS.travelEscrow.abi,
    functionName: "host",
  });
}

export function useGetTotalAmount(escrowAddress: Address) {
  return useReadContract({
    address: escrowAddress,
    abi: CONTRACTS.travelEscrow.abi,
    functionName: "totalAmount",
  });
}

export function useGetPaymentToken(escrowAddress: Address) {
  return useReadContract({
    address: escrowAddress,
    abi: CONTRACTS.travelEscrow.abi,
    functionName: "paymentToken",
  });
}

export function useGetEscrowStatus(escrowAddress: Address) {
  return useReadContract({
    address: escrowAddress,
    abi: CONTRACTS.travelEscrow.abi,
    functionName: "escrowStatus",
  });
}

export function useCanRefund(escrowAddress: Address) {
  return useReadContract({
    address: escrowAddress,
    abi: CONTRACTS.travelEscrow.abi,
    functionName: "canRefund",
  });
}

// Write Hooks (returns configured hook, use with writeContract)
export function useDepositFunds() {
  return useWriteContract();
}

export function useReleaseFundsToHost() {
  return useWriteContract();
}

export function useRefundToTraveler() {
  return useWriteContract();
}

export function useHandleDispute() {
  return useWriteContract();
}

export function useResolveDispute() {
  return useWriteContract();
}

// Event Hooks
export function useWatchFundsDeposited(
  escrowAddress: Address,
  onLogs: (logs: any[]) => void,
  options?: { enabled?: boolean }
) {
  useWatchContractEvent({
    address: escrowAddress,
    abi: CONTRACTS.travelEscrow.abi,
    eventName: "FundsDeposited",
    onLogs,
    ...options,
  });
}

export function useWatchFundsReleased(
  escrowAddress: Address,
  onLogs: (logs: any[]) => void,
  options?: { enabled?: boolean }
) {
  useWatchContractEvent({
    address: escrowAddress,
    abi: CONTRACTS.travelEscrow.abi,
    eventName: "FundsReleased",
    onLogs,
    ...options,
  });
}

export function useWatchFundsRefunded(
  escrowAddress: Address,
  onLogs: (logs: any[]) => void,
  options?: { enabled?: boolean }
) {
  useWatchContractEvent({
    address: escrowAddress,
    abi: CONTRACTS.travelEscrow.abi,
    eventName: "FundsRefunded",
    onLogs,
    ...options,
  });
}
