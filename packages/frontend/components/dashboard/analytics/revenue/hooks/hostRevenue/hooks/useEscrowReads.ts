"use client";

/**
 * Hook to read escrow contract data
 */

import * as React from "react";
import { useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import { ESCROW_ABI, ERC20_ABI, EscrowStatus, PaymentPreference } from "../../../constants";
import type { EscrowInfo, RevenueTotals } from "../../../types";

interface UseEscrowReadsReturn {
  escrowInfos: EscrowInfo[];
  pendingWithdrawals: EscrowInfo[];
  withdrawnEscrows: EscrowInfo[];
  totals: RevenueTotals;
  batchReadyEscrows: EscrowInfo[];
  loadingEscrows: boolean;
}

/**
 * Read escrow contract data for all bookings with escrow
 */
export function useEscrowReads(bookings: PonderBooking[]): UseEscrowReadsReturn {
  // Filter bookings with escrow addresses
  const bookingsWithEscrow = React.useMemo(() => {
    return bookings.filter(
      (b) => (b.status === "Completed" || b.status === "CheckedIn") && b.escrowAddress
    );
  }, [bookings]);

  // Prepare contract read calls for all escrows
  const escrowContracts = React.useMemo(() => {
    const calls: {
      address: `0x${string}`;
      abi: typeof ESCROW_ABI;
      functionName: string;
    }[] = [];

    bookingsWithEscrow.forEach((booking) => {
      const address = booking.escrowAddress as `0x${string}`;
      calls.push(
        { address, abi: ESCROW_ABI, functionName: "status" },
        { address, abi: ESCROW_ABI, functionName: "withdrawn" },
        { address, abi: ESCROW_ABI, functionName: "amount" },
        { address, abi: ESCROW_ABI, functionName: "platformFee" },
        { address, abi: ESCROW_ABI, functionName: "hostPreference" },
        { address, abi: ESCROW_ABI, functionName: "token" },
        { address, abi: ESCROW_ABI, functionName: "checkIn" }
      );
    });

    return calls;
  }, [bookingsWithEscrow]);

  // Read all escrow data
  const { data: escrowData, isLoading: loadingEscrows } = useReadContracts({
    contracts: escrowContracts,
  });

  // Build balance read calls after we have token addresses
  const balanceContracts = React.useMemo(() => {
    if (!escrowData) return [];

    const calls: {
      address: `0x${string}`;
      abi: typeof ERC20_ABI;
      functionName: "balanceOf";
      args: [`0x${string}`];
    }[] = [];

    bookingsWithEscrow.forEach((booking, index) => {
      const tokenIndex = index * 7 + 5;
      const tokenResult = escrowData[tokenIndex];
      const tokenAddress = tokenResult?.result as `0x${string}` | undefined;

      if (tokenAddress) {
        calls.push({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [booking.escrowAddress as `0x${string}`],
        });
      }
    });

    return calls;
  }, [escrowData, bookingsWithEscrow]);

  // Read balances
  const { data: balanceData } = useReadContracts({
    contracts: balanceContracts,
    query: { enabled: balanceContracts.length > 0 },
  });

  // Process escrow information
  const escrowInfos: EscrowInfo[] = React.useMemo(() => {
    if (!escrowData) return [];

    return bookingsWithEscrow.map((booking, index) => {
      const baseIndex = index * 7;
      return {
        booking,
        escrowAddress: booking.escrowAddress!,
        status: escrowData[baseIndex]?.result as number | undefined,
        withdrawn: escrowData[baseIndex + 1]?.result as boolean | undefined,
        amount: escrowData[baseIndex + 2]?.result as bigint | undefined,
        platformFee: escrowData[baseIndex + 3]?.result as bigint | undefined,
        hostPreference: escrowData[baseIndex + 4]?.result as number | undefined,
        balance: balanceData?.[index]?.result as bigint | undefined,
        checkInTimestamp: escrowData[baseIndex + 6]?.result as bigint | undefined,
      };
    });
  }, [escrowData, balanceData, bookingsWithEscrow]);

  // Filter escrows with pending withdrawals
  const pendingWithdrawals = React.useMemo(() => {
    return escrowInfos.filter((info) => {
      const hasBalance = info.balance && info.balance > BigInt(0);
      const notWithdrawn = !info.withdrawn;
      return hasBalance && notWithdrawn;
    });
  }, [escrowInfos]);

  // Get withdrawn escrows
  const withdrawnEscrows = React.useMemo(() => {
    return escrowInfos.filter((e) => e.withdrawn);
  }, [escrowInfos]);

  // Calculate totals
  const totals: RevenueTotals = React.useMemo(() => {
    let pendingAmount = BigInt(0);
    let withdrawnAmount = BigInt(0);

    escrowInfos.forEach((info) => {
      const hostAmount =
        info.amount && info.platformFee ? info.amount - info.platformFee : BigInt(0);

      if (info.withdrawn) {
        withdrawnAmount += hostAmount;
      } else if (info.balance && info.balance > BigInt(0)) {
        pendingAmount += hostAmount;
      }
    });

    return {
      pending: Number(formatUnits(pendingAmount, 6)),
      withdrawn: Number(formatUnits(withdrawnAmount, 6)),
      total: Number(formatUnits(pendingAmount + withdrawnAmount, 6)),
    };
  }, [escrowInfos]);

  // Get escrows ready for batch withdrawal
  const batchReadyEscrows = React.useMemo(() => {
    return pendingWithdrawals.filter(
      (info) =>
        info.status === EscrowStatus.Completed && info.hostPreference === PaymentPreference.CRYPTO
    );
  }, [pendingWithdrawals]);

  return {
    escrowInfos,
    pendingWithdrawals,
    withdrawnEscrows,
    totals,
    batchReadyEscrows,
    loadingEscrows,
  };
}
