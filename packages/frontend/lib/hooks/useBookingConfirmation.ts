/**
 * Hook for confirming bookings with the EscrowFactory contract
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
import type { BookingRoom } from "@/lib/store/useBookingStore";

// Check if we're in development mode (no backend signature service)
const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

// ERC20 ABI for approve
const erc20Abi = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Single room quote (for backward compatibility)
export interface BookingQuote {
  tokenId: bigint;
  checkIn: number; // Unix timestamp
  checkOut: number; // Unix timestamp
  price: bigint; // In token decimals (6 for USDC/EURC)
  currency: `0x${string}`; // Token address
  validUntil: number;
  quantity: number; // Number of room units to book
  signature: `0x${string}`;
}

// Batch booking quote (for multi room type bookings)
export interface BatchBookingQuote {
  rooms: {
    tokenId: bigint;
    quantity: number;
    price: bigint;
  }[];
  checkIn: number;
  checkOut: number;
  totalPrice: bigint;
  currency: `0x${string}`;
  validUntil: number;
  signature: `0x${string}`;
}

export interface BookingConfirmationParams {
  rooms: BookingRoom[];
  checkIn: Date;
  checkOut: Date;
  totalAmount: number; // In USD/EUR
  paymentToken: "USDC" | "EURC";
  userAddress: `0x${string}`;
}

export type BookingStatus =
  | "idle"
  | "fetching-quote"
  | "approving"
  | "waiting-approval"
  | "creating-escrow"
  | "waiting-escrow"
  | "success"
  | "error"
  | "dev-mode-success"; // Development mode - simulated success

export interface UseBookingConfirmationResult {
  status: BookingStatus;
  error: string | null;
  escrowAddresses: `0x${string}`[]; // Array for batch bookings
  txHash: `0x${string}` | null;
  batchId: bigint | null; // For batch bookings
  confirmBooking: (params: BookingConfirmationParams) => Promise<`0x${string}` | null>;
  reset: () => void;
}

/**
 * Get a signed quote from the backend API for single room type
 */
async function getSingleRoomQuote(params: BookingConfirmationParams): Promise<BookingQuote> {
  const tokenAddress =
    params.paymentToken === "USDC" ? CONTRACT_ADDRESSES.usdc : CONTRACT_ADDRESSES.eurc;

  const primaryRoom = params.rooms[0];
  if (!primaryRoom) {
    throw new Error("No rooms selected");
  }

  const priceInTokenUnits = parseUnits(params.totalAmount.toFixed(6), 6);
  const checkIn = Math.floor(params.checkIn.getTime() / 1000);
  const checkOut = Math.floor(params.checkOut.getTime() / 1000);
  const quantity = primaryRoom.quantity || 1;

  const response = await fetch("/api/booking/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tokenId: primaryRoom.tokenId.toString(),
      checkIn,
      checkOut,
      price: priceInTokenUnits.toString(),
      currency: tokenAddress,
      quantity,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to get booking quote: ${response.statusText}`);
  }

  const { signature, validUntil, quantity: returnedQuantity } = await response.json();

  return {
    tokenId: primaryRoom.tokenId,
    checkIn,
    checkOut,
    price: priceInTokenUnits,
    currency: tokenAddress,
    validUntil,
    quantity: returnedQuantity || quantity,
    signature,
  };
}

/**
 * Get a signed batch quote from the backend API for multi room type bookings
 */
async function getBatchQuote(params: BookingConfirmationParams): Promise<BatchBookingQuote> {
  const tokenAddress =
    params.paymentToken === "USDC" ? CONTRACT_ADDRESSES.usdc : CONTRACT_ADDRESSES.eurc;

  const checkIn = Math.floor(params.checkIn.getTime() / 1000);
  const checkOut = Math.floor(params.checkOut.getTime() / 1000);

  // Calculate price per room type based on proportion of total
  // In a real implementation, you'd want prices from the room types themselves
  const totalQuantity = params.rooms.reduce((sum, r) => sum + (r.quantity || 1), 0);
  const pricePerUnit = params.totalAmount / totalQuantity;

  const rooms = params.rooms.map((room) => {
    const quantity = room.quantity || 1;
    const roomPrice = parseUnits((pricePerUnit * quantity).toFixed(6), 6);
    return {
      tokenId: room.tokenId.toString(),
      quantity,
      price: roomPrice.toString(),
    };
  });

  const totalPrice = parseUnits(params.totalAmount.toFixed(6), 6);

  const response = await fetch("/api/booking/batch-quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rooms,
      checkIn,
      checkOut,
      totalPrice: totalPrice.toString(),
      currency: tokenAddress,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to get batch quote: ${response.statusText}`);
  }

  const { signature, validUntil, rooms: returnedRooms } = await response.json();

  return {
    rooms: returnedRooms.map((r: { tokenId: string; quantity: number; price: string }) => ({
      tokenId: BigInt(r.tokenId),
      quantity: r.quantity,
      price: BigInt(r.price),
    })),
    checkIn,
    checkOut,
    totalPrice,
    currency: tokenAddress,
    validUntil,
    signature,
  };
}

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
          console.log("[DEV MODE] Simulating booking flow...");
          console.log("[DEV MODE] Booking params:", {
            rooms: params.rooms.map((r) => ({
              tokenId: r.tokenId.toString(),
              quantity: r.quantity,
            })),
            checkIn: params.checkIn.toISOString(),
            checkOut: params.checkOut.toISOString(),
            totalAmount: params.totalAmount,
            paymentToken: params.paymentToken,
          });

          await new Promise((resolve) => setTimeout(resolve, 500));
          setStatus("approving");
          await new Promise((resolve) => setTimeout(resolve, 500));
          setStatus("creating-escrow");
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const mockTxHash = `0x${"0".repeat(62)}01` as `0x${string}`;
          const mockEscrowAddresses = params.rooms.map(
            (_, i) => `0x${"0".repeat(38)}${String(i + 1).padStart(2, "0")}` as `0x${string}`
          );

          setTxHash(mockTxHash);
          setEscrowAddresses(mockEscrowAddresses);
          setBatchId(0n);
          setStatus("dev-mode-success");

          console.log("[DEV MODE] Booking simulation complete!");
          console.log("[DEV MODE] Mock escrow addresses:", mockEscrowAddresses);

          return mockTxHash;
        }

        // Determine if this is a single or batch booking
        const isBatchBooking = params.rooms.length > 1;

        const tokenAddress =
          params.paymentToken === "USDC" ? CONTRACT_ADDRESSES.usdc : CONTRACT_ADDRESSES.eurc;

        if (!publicClient) {
          throw new Error("Wallet not connected. Please connect your wallet and try again.");
        }

        // Calculate total price for approval
        const totalPriceInTokenUnits = parseUnits(params.totalAmount.toFixed(6), 6);

        // Check current allowance
        setStatus("approving");
        const currentAllowance = (await publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "allowance",
          args: [params.userAddress, CONTRACT_ADDRESSES.escrowFactory],
        })) as bigint;

        // Approve if needed
        if (currentAllowance < totalPriceInTokenUnits) {
          try {
            const approveTxHash = await writeContractAsync({
              address: tokenAddress,
              abi: erc20Abi,
              functionName: "approve",
              args: [CONTRACT_ADDRESSES.escrowFactory, totalPriceInTokenUnits],
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
              throw new Error(
                "Token approval was rejected. Please approve the transaction to continue."
              );
            }
            throw new Error(`Failed to approve token spend: ${err?.message || "Unknown error"}`);
          }
        }

        setStatus("creating-escrow");
        let escrowTxHash: `0x${string}`;

        if (isBatchBooking) {
          // BATCH BOOKING: Multiple room types
          const batchQuote = await getBatchQuote(params);

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
            return null; // This won't be reached due to throw
          }

          setTxHash(escrowTxHash);
          setStatus("waiting-escrow");

          const receipt = await publicClient.waitForTransactionReceipt({
            hash: escrowTxHash,
          });

          if (receipt.status !== "success") {
            throw new Error(
              "Booking transaction failed on-chain. Please check your wallet for details."
            );
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
        } else {
          // SINGLE ROOM TYPE BOOKING
          const quote = await getSingleRoomQuote(params);

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
            return null;
          }

          setTxHash(escrowTxHash);
          setStatus("waiting-escrow");

          const receipt = await publicClient.waitForTransactionReceipt({
            hash: escrowTxHash,
          });

          if (receipt.status !== "success") {
            throw new Error(
              "Booking transaction failed on-chain. Please check your wallet for details."
            );
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
 * Handle escrow creation errors
 */
function handleEscrowError(escrowError: unknown, params: BookingConfirmationParams): never {
  const err = escrowError as { message?: string; code?: number };

  if (err?.message?.includes("User rejected") || err?.code === 4001) {
    throw new Error(
      "Booking transaction was rejected. Please confirm the transaction to create your booking."
    );
  }

  if (err?.message?.includes("AA23") || err?.message?.includes("reverted")) {
    throw new Error(
      "Booking signature validation failed. This usually means the backend signing service " +
        "is not configured correctly. Please contact support or try again later."
    );
  }

  if (err?.message?.includes("insufficient") || err?.message?.includes("balance")) {
    throw new Error(
      `Insufficient ${params.paymentToken} balance. ` +
        `Please ensure you have at least ${params.totalAmount} ${params.paymentToken} in your wallet.`
    );
  }

  throw new Error(`Failed to create booking: ${err?.message || "Unknown error"}`);
}

/**
 * Get human-readable status message
 */
export function getStatusMessage(status: BookingStatus): string {
  switch (status) {
    case "idle":
      return "Ready to book";
    case "fetching-quote":
      return "Getting price quote...";
    case "approving":
      return "Approving token spend...";
    case "waiting-approval":
      return "Waiting for approval confirmation...";
    case "creating-escrow":
      return "Creating booking escrow...";
    case "waiting-escrow":
      return "Waiting for transaction confirmation...";
    case "success":
      return "Booking confirmed!";
    case "dev-mode-success":
      return "Booking simulated (Dev Mode)";
    case "error":
      return "Booking failed";
    default:
      return "";
  }
}

/**
 * Check if development mode is enabled
 */
export function isDevMode(): boolean {
  return IS_DEV_MODE;
}
