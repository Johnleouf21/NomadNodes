/**
 * Quote Service for Booking Confirmation
 * Handles fetching signed quotes from the backend API
 */

import { parseUnits } from "viem";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import type { BookingQuote, BatchBookingQuote, BookingConfirmationParams } from "./types";

/**
 * Normalize a date to UTC midnight timestamp
 * Uses LOCAL date components to preserve user's selected date regardless of timezone
 */
function normalizeToUTCMidnight(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 1000);
}

/**
 * Ensure checkIn timestamp is in the future
 * CRITICAL: TravelEscrow requires checkIn > block.timestamp
 */
function ensureFutureCheckIn(checkIn: number): number {
  const now = Math.floor(Date.now() / 1000);
  if (checkIn <= now) {
    // Set checkIn to now + 1 hour to ensure it's in the future when tx is mined
    return now + 3600;
  }
  return checkIn;
}

/**
 * Get a signed quote from the backend API for single room type
 */
export async function getSingleRoomQuote(params: BookingConfirmationParams): Promise<BookingQuote> {
  const tokenAddress =
    params.paymentToken === "USDC" ? CONTRACT_ADDRESSES.usdc : CONTRACT_ADDRESSES.eurc;

  const primaryRoom = params.rooms[0];
  if (!primaryRoom) {
    throw new Error("No rooms selected");
  }

  const priceInTokenUnits = parseUnits(params.totalAmount.toFixed(6), 6);

  // Normalize dates to UTC midnight
  let checkIn = normalizeToUTCMidnight(params.checkIn);
  checkIn = ensureFutureCheckIn(checkIn);
  const checkOut = normalizeToUTCMidnight(params.checkOut);

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
export async function getBatchQuote(params: BookingConfirmationParams): Promise<BatchBookingQuote> {
  const tokenAddress =
    params.paymentToken === "USDC" ? CONTRACT_ADDRESSES.usdc : CONTRACT_ADDRESSES.eurc;

  // Normalize dates to UTC midnight
  let checkIn = normalizeToUTCMidnight(params.checkIn);
  checkIn = ensureFutureCheckIn(checkIn);
  const checkOut = normalizeToUTCMidnight(params.checkOut);

  // Calculate nights from check-in/check-out
  const nights = Math.ceil((checkOut - checkIn) / 86400);

  // Calculate subtotal (without platform fee) to determine each room's proportion
  const subtotal = params.rooms.reduce((sum, room) => {
    const quantity = room.quantity || 1;
    return sum + room.pricePerNight * quantity * nights;
  }, 0);

  // IMPORTANT: Expand rooms with quantity > 1 into separate entries
  // Each room unit needs its own booking and escrow in the contract
  const expandedRooms = expandRoomsForBatch(params.rooms, params.totalAmount, subtotal, nights);

  const totalPrice = parseUnits(params.totalAmount.toFixed(6), 6);

  const response = await fetch("/api/booking/batch-quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rooms: expandedRooms,
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

/**
 * Expand rooms with quantity > 1 into separate entries
 * Each room unit needs its own booking and escrow in the contract
 */
function expandRoomsForBatch(
  rooms: BookingConfirmationParams["rooms"],
  totalAmount: number,
  subtotal: number,
  nights: number
): { tokenId: string; quantity: number; price: string }[] {
  const expandedRooms: { tokenId: string; quantity: number; price: string }[] = [];

  // Calculate the total number of room units for proportion calculation
  const totalUnits = rooms.reduce((sum, room) => sum + (room.quantity || 1), 0);

  for (const room of rooms) {
    const quantity = room.quantity || 1;
    // Room's base price per unit (without fee)
    const roomSubtotalPerUnit = room.pricePerNight * nights;
    // Room's proportion of the total (per unit)
    const roomProportionPerUnit = subtotal > 0 ? roomSubtotalPerUnit / subtotal : 1 / totalUnits;
    // Room's total price per unit including its share of the platform fee
    const roomTotalPricePerUnit = totalAmount * roomProportionPerUnit;
    const roomPricePerUnit = parseUnits(roomTotalPricePerUnit.toFixed(6), 6);

    // Create separate entry for each unit of this room type
    for (let i = 0; i < quantity; i++) {
      expandedRooms.push({
        tokenId: room.tokenId.toString(),
        quantity: 1, // Each entry represents 1 room unit
        price: roomPricePerUnit.toString(),
      });
    }
  }

  return expandedRooms;
}
