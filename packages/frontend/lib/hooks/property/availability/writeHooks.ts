/**
 * Write hooks for availability management
 */

import * as React from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { getAvailabilityTimestamps, estimateAvailabilityGas } from "./utils";

/**
 * Hook to set availability for a room type via AvailabilityManager
 * @param tokenId - The room type token ID
 * @param unitIndex - The specific unit (0 to totalSupply-1)
 * @param startDate - Start date
 * @param endDate - End date
 * @param available - True to mark as available, false to mark as booked
 */
export function useSetAvailability() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const setAvailability = React.useCallback(
    (tokenId: bigint, unitIndex: number, startDate: Date, endDate: Date, available: boolean) => {
      const { startTimestamp, endTimestamp, daysDiff } = getAvailabilityTimestamps(
        startDate,
        endDate
      );
      const gas = estimateAvailabilityGas(daysDiff);

      writeContract({
        ...CONTRACTS.availabilityManager,
        functionName: "setAvailability",
        args: [tokenId, BigInt(unitIndex), startTimestamp, endTimestamp, available],
        gas,
      });
    },
    [writeContract]
  );

  return {
    setAvailability,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
  };
}

/**
 * Hook to set bulk availability for multiple units over a date range
 * Sets units 0 to numUnitsAvailable-1 as available, rest as unavailable
 * @param tokenId - The room type token ID
 * @param numUnitsAvailable - Number of units to mark as available (0 to totalSupply)
 * @param startDate - Start date
 * @param endDate - End date
 */
export function useSetBulkAvailability() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const setBulkAvailability = React.useCallback(
    (tokenId: bigint, numUnitsAvailable: number, startDate: Date, endDate: Date) => {
      const { startTimestamp, endTimestamp, daysDiff } = getAvailabilityTimestamps(
        startDate,
        endDate
      );
      const gas = estimateAvailabilityGas(daysDiff, numUnitsAvailable);

      writeContract({
        ...CONTRACTS.availabilityManager,
        functionName: "setBulkAvailability",
        args: [tokenId, BigInt(numUnitsAvailable), startTimestamp, endTimestamp],
        gas,
      });
    },
    [writeContract]
  );

  return {
    setBulkAvailability,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
  };
}
