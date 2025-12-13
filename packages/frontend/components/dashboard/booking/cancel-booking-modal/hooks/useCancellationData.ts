"use client";

/**
 * Hook for fetching cancellation data from escrow
 */

import { useReadContract } from "wagmi";
import { ESCROW_ABI } from "../types";

interface UseCancellationDataProps {
  escrowAddress: string | null;
  enabled: boolean;
}

export function useCancellationData({ escrowAddress, enabled }: UseCancellationDataProps) {
  // Read refund percentage from escrow
  const { data: refundPercentage, isLoading: loadingPercentage } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "getRefundPercentage",
    query: {
      enabled: !!escrowAddress && enabled,
    },
  });

  // Read escrow amount
  const { data: escrowAmount } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "amount",
    query: {
      enabled: !!escrowAddress && enabled,
    },
  });

  // Read platform fee
  const { data: platformFee } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "platformFee",
    query: {
      enabled: !!escrowAddress && enabled,
    },
  });

  return {
    refundPercentage,
    escrowAmount,
    platformFee,
    loadingPercentage,
  };
}
