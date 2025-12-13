/**
 * Hook for confirming bookings with the EscrowFactory contract
 *
 * Handles:
 * 1. Getting a signed quote from the backend
 * 2. Approving the ERC20 token spend
 * 3. Creating the escrow contract(s)
 *
 * Supports:
 * - Single room type bookings (createTravelEscrowWithQuote)
 * - Multi room type bookings (createBatchTravelEscrow) - creates separate escrow per room type
 *
 * Note: In development mode (NEXT_PUBLIC_DEV_MODE=true), this hook will
 * simulate the booking flow without actually creating an escrow on-chain.
 */

import { useState, useCallback } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import { CONTRACTS, CONTRACT_ADDRESSES } from "@/lib/contracts";

import type {
  BookingStatus,
  BookingConfirmationParams,
  UseBookingConfirmationResult,
} from "./types";
import { IS_DEV_MODE, erc20Abi } from "./constants";
import { getSingleRoomQuote, getBatchQuote } from "./quoteService";
import { handleEscrowError } from "./errorHandling";

export function useBookingConfirmation(): UseBookingConfirmationResult {
  const [status, setStatus] = useState<BookingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [escrowAddresses, setEscrowAddresses] = useState<`0x${string}`[]>([]);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [batchId, setBatchId] = useState<bigint | null>(null);

  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setEscrowAddresses([]);
    setTxHash(null);
    setBatchId(null);
  }, []);

  const confirmBooking = useCallback(
    async (params: BookingConfirmationParams): Promise<`0x${string}` | null> => {
      try {
        setError(null);
        setStatus("fetching-quote");

        // Development mode - simulate the booking flow
        if (IS_DEV_MODE) {
          return await simulateDevModeBooking(
            params,
            setStatus,
            setTxHash,
            setEscrowAddresses,
            setBatchId
          );
        }

        // Determine if this is a single or batch booking
        const hasMultipleUnits = params.rooms.some((room) => (room.quantity || 1) > 1);
        const isBatchBooking = params.rooms.length > 1 || hasMultipleUnits;

        const tokenAddress =
          params.paymentToken === "USDC" ? CONTRACT_ADDRESSES.usdc : CONTRACT_ADDRESSES.eurc;

        if (!publicClient) {
          throw new Error("Wallet not connected. Please connect your wallet and try again.");
        }

        // Approve token spend if needed
        const totalPriceInTokenUnits = parseUnits(params.totalAmount.toFixed(6), 6);
        await approveTokenIfNeeded(
          publicClient,
          writeContractAsync,
          tokenAddress,
          params.userAddress,
          totalPriceInTokenUnits,
          setStatus
        );

        // Create escrow
        setStatus("creating-escrow");
        let escrowTxHash: `0x${string}`;

        if (isBatchBooking) {
          escrowTxHash = await createBatchEscrow(
            params,
            publicClient,
            writeContractAsync,
            setTxHash,
            setStatus,
            setBatchId,
            setEscrowAddresses
          );
        } else {
          escrowTxHash = await createSingleEscrow(
            params,
            publicClient,
            writeContractAsync,
            setTxHash,
            setStatus,
            setEscrowAddresses
          );
        }

        setStatus("success");
        return escrowTxHash;
      } catch (err) {
        console.error("Booking confirmation error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to confirm booking. Please try again.";
        setError(errorMessage);
        setStatus("error");
        return null;
      }
    },
    [publicClient, writeContractAsync]
  );

  return {
    status,
    error,
    escrowAddresses,
    txHash,
    batchId,
    confirmBooking,
    reset,
  };
}

/**
 * Simulate booking flow in development mode
 */
async function simulateDevModeBooking(
  params: BookingConfirmationParams,
  setStatus: (status: BookingStatus) => void,
  setTxHash: (hash: `0x${string}` | null) => void,
  setEscrowAddresses: (addresses: `0x${string}`[]) => void,
  setBatchId: (id: bigint | null) => void
): Promise<`0x${string}`> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  setStatus("approving");
  await new Promise((resolve) => setTimeout(resolve, 500));
  setStatus("creating-escrow");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const mockTxHash = `0x${"0".repeat(62)}01` as `0x${string}`;
  const totalRoomUnits = params.rooms.reduce((sum, room) => sum + (room.quantity || 1), 0);
  const mockEscrowAddresses = Array.from(
    { length: totalRoomUnits },
    (_, i) => `0x${"0".repeat(38)}${String(i + 1).padStart(2, "0")}` as `0x${string}`
  );

  setTxHash(mockTxHash);
  setEscrowAddresses(mockEscrowAddresses);
  setBatchId(0n);
  setStatus("dev-mode-success");

  return mockTxHash;
}

/**
 * Approve token spend if current allowance is insufficient
 */
async function approveTokenIfNeeded(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  writeContractAsync: ReturnType<typeof useWriteContract>["writeContractAsync"],
  tokenAddress: `0x${string}`,
  userAddress: `0x${string}`,
  amount: bigint,
  setStatus: (status: BookingStatus) => void
): Promise<void> {
  setStatus("approving");

  const currentAllowance = (await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [userAddress, CONTRACT_ADDRESSES.escrowFactory],
  })) as bigint;

  if (currentAllowance >= amount) {
    return;
  }

  try {
    const approveTxHash = await writeContractAsync({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [CONTRACT_ADDRESSES.escrowFactory, amount],
    });

    setStatus("waiting-approval");
    const approvalReceipt = await publicClient.waitForTransactionReceipt({
      hash: approveTxHash,
    });

    if (approvalReceipt.status !== "success") {
      throw new Error("Token approval transaction failed. Please try again.");
    }
  } catch (approveError: unknown) {
    const err = approveError as { message?: string; code?: number };
    if (err?.message?.includes("User rejected") || err?.code === 4001) {
      throw new Error("Token approval was rejected. Please approve the transaction to continue.");
    }
    throw new Error(`Failed to approve token spend: ${err?.message || "Unknown error"}`);
  }
}

/**
 * Create batch escrow for multiple room types
 */
async function createBatchEscrow(
  params: BookingConfirmationParams,
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  writeContractAsync: ReturnType<typeof useWriteContract>["writeContractAsync"],
  setTxHash: (hash: `0x${string}` | null) => void,
  setStatus: (status: BookingStatus) => void,
  setBatchId: (id: bigint | null) => void,
  setEscrowAddresses: (addresses: `0x${string}`[]) => void
): Promise<`0x${string}`> {
  const batchQuote = await getBatchQuote(params);

  let escrowTxHash: `0x${string}`;
  try {
    escrowTxHash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.escrowFactory,
      abi: CONTRACTS.escrowFactory.abi,
      functionName: "createBatchTravelEscrow",
      args: [
        {
          rooms: batchQuote.rooms.map((r) => ({
            tokenId: r.tokenId,
            quantity: BigInt(r.quantity),
            price: r.price,
          })),
          checkIn: BigInt(batchQuote.checkIn),
          checkOut: BigInt(batchQuote.checkOut),
          totalPrice: batchQuote.totalPrice,
          currency: batchQuote.currency,
          validUntil: BigInt(batchQuote.validUntil),
          signature: batchQuote.signature,
        },
      ],
    });
  } catch (escrowError: unknown) {
    handleEscrowError(escrowError, params);
  }

  setTxHash(escrowTxHash);
  setStatus("waiting-escrow");

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: escrowTxHash,
  });

  if (receipt.status !== "success") {
    throw new Error("Booking transaction failed on-chain. Please check your wallet for details.");
  }

  // Get batch ID and escrow addresses
  try {
    const newBatchCount = (await publicClient.readContract({
      address: CONTRACT_ADDRESSES.escrowFactory,
      abi: CONTRACTS.escrowFactory.abi,
      functionName: "batchCount",
    })) as bigint;

    const currentBatchId = newBatchCount - 1n;
    setBatchId(currentBatchId);

    const addresses = (await publicClient.readContract({
      address: CONTRACT_ADDRESSES.escrowFactory,
      abi: CONTRACTS.escrowFactory.abi,
      functionName: "getBatchEscrowAddresses",
      args: [currentBatchId],
    })) as `0x${string}`[];

    setEscrowAddresses(addresses);
  } catch (addressError) {
    console.warn("Could not retrieve batch escrow addresses:", addressError);
  }

  return escrowTxHash;
}

/**
 * Create single escrow for one room type
 */
async function createSingleEscrow(
  params: BookingConfirmationParams,
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  writeContractAsync: ReturnType<typeof useWriteContract>["writeContractAsync"],
  setTxHash: (hash: `0x${string}` | null) => void,
  setStatus: (status: BookingStatus) => void,
  setEscrowAddresses: (addresses: `0x${string}`[]) => void
): Promise<`0x${string}`> {
  const quote = await getSingleRoomQuote(params);

  let escrowTxHash: `0x${string}`;
  try {
    escrowTxHash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.escrowFactory,
      abi: CONTRACTS.escrowFactory.abi,
      functionName: "createTravelEscrowWithQuote",
      args: [
        {
          tokenId: quote.tokenId,
          checkIn: BigInt(quote.checkIn),
          checkOut: BigInt(quote.checkOut),
          price: quote.price,
          currency: quote.currency,
          validUntil: BigInt(quote.validUntil),
          quantity: BigInt(quote.quantity),
          signature: quote.signature,
        },
      ],
    });
  } catch (escrowError: unknown) {
    handleEscrowError(escrowError, params);
  }

  setTxHash(escrowTxHash);
  setStatus("waiting-escrow");

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: escrowTxHash,
  });

  if (receipt.status !== "success") {
    throw new Error("Booking transaction failed on-chain. Please check your wallet for details.");
  }

  // Get escrow address
  try {
    const escrowCount = (await publicClient.readContract({
      address: CONTRACT_ADDRESSES.escrowFactory,
      abi: CONTRACTS.escrowFactory.abi,
      functionName: "escrowCount",
    })) as bigint;

    if (escrowCount > 0n) {
      const latestEscrowAddress = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.escrowFactory,
        abi: CONTRACTS.escrowFactory.abi,
        functionName: "escrows",
        args: [escrowCount - 1n],
      })) as `0x${string}`;

      setEscrowAddresses([latestEscrowAddress]);
    }
  } catch (addressError) {
    console.warn("Could not retrieve escrow address:", addressError);
  }

  return escrowTxHash;
}
