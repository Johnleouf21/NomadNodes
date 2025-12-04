/**
 * Booking Store
 * Manages booking flow and temporary booking data
 * Supports multi-room bookings
 */

import { create } from "zustand";
import type { Address } from "viem";

export enum BookingStep {
  DATES = "dates",
  GUESTS = "guests",
  PAYMENT = "payment",
  REVIEW = "review",
  CONFIRM = "confirm",
}

// Represents a single room in the booking
export interface BookingRoom {
  tokenId: bigint;
  roomName: string;
  pricePerNight: number;
  maxGuests: number;
  quantity: number; // How many of this room type
  currency: "USD" | "EUR";
}

export interface BookingData {
  propertyId: bigint | null;
  propertyName: string;
  hostAddress: Address | null;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number;
  totalNights: number;
  // Legacy single room (for backward compatibility)
  pricePerNight: number;
  // Multi-room support
  rooms: BookingRoom[];
  // Totals
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  paymentToken: "USDC" | "EURC";
  specialRequests: string;
}

interface BookingState {
  // Current booking flow
  currentStep: BookingStep;
  bookingData: BookingData;

  // UI state
  isProcessing: boolean;
  error: string | null;

  // Actions
  setCurrentStep: (step: BookingStep) => void;
  setBookingData: (data: Partial<BookingData>) => void;
  // Room management
  addRoom: (room: BookingRoom) => void;
  removeRoom: (tokenId: bigint) => void;
  updateRoomQuantity: (tokenId: bigint, quantity: number) => void;
  // Calculations
  calculateTotal: () => void;
  getTotalCapacity: () => number;
  // Reset
  resetBooking: () => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultBookingData: BookingData = {
  propertyId: null,
  propertyName: "",
  hostAddress: null,
  checkIn: null,
  checkOut: null,
  guests: 1,
  totalNights: 0,
  pricePerNight: 0,
  rooms: [],
  subtotal: 0,
  platformFee: 0,
  totalAmount: 0,
  paymentToken: "USDC",
  specialRequests: "",
};

export const useBookingStore = create<BookingState>((set, get) => ({
  // Initial state
  currentStep: BookingStep.DATES,
  bookingData: defaultBookingData,
  isProcessing: false,
  error: null,

  // Actions
  setCurrentStep: (step) => set({ currentStep: step }),

  setBookingData: (data) =>
    set((state) => ({
      bookingData: { ...state.bookingData, ...data },
    })),

  // Add a room to the booking
  addRoom: (room) =>
    set((state) => {
      // Compare using string conversion to handle bigint comparison issues
      const roomTokenIdStr = room.tokenId.toString();
      const existingRoomIndex = state.bookingData.rooms.findIndex(
        (r) => r.tokenId.toString() === roomTokenIdStr
      );

      let updatedRooms: BookingRoom[];
      if (existingRoomIndex >= 0) {
        // Increment quantity if room already exists
        updatedRooms = state.bookingData.rooms.map((r, i) =>
          i === existingRoomIndex ? { ...r, quantity: r.quantity + 1 } : r
        );
      } else {
        // Add new room with quantity 1
        updatedRooms = [...state.bookingData.rooms, { ...room, quantity: 1 }];
      }

      return {
        bookingData: { ...state.bookingData, rooms: updatedRooms },
      };
    }),

  // Remove a room from the booking
  removeRoom: (tokenId) =>
    set((state) => {
      const tokenIdStr = tokenId.toString();
      return {
        bookingData: {
          ...state.bookingData,
          rooms: state.bookingData.rooms.filter((r) => r.tokenId.toString() !== tokenIdStr),
        },
      };
    }),

  // Update room quantity
  updateRoomQuantity: (tokenId, quantity) =>
    set((state) => {
      const tokenIdStr = tokenId.toString();
      if (quantity <= 0) {
        // Remove room if quantity is 0 or less
        return {
          bookingData: {
            ...state.bookingData,
            rooms: state.bookingData.rooms.filter((r) => r.tokenId.toString() !== tokenIdStr),
          },
        };
      }

      return {
        bookingData: {
          ...state.bookingData,
          rooms: state.bookingData.rooms.map((r) =>
            r.tokenId.toString() === tokenIdStr ? { ...r, quantity } : r
          ),
        },
      };
    }),

  // Calculate total capacity of all rooms
  getTotalCapacity: () => {
    const { bookingData } = get();
    return bookingData.rooms.reduce((total, room) => total + room.maxGuests * room.quantity, 0);
  },

  // Calculate totals
  calculateTotal: () => {
    const { bookingData } = get();
    const { totalNights, rooms, pricePerNight } = bookingData;

    let subtotal: number;

    if (rooms.length > 0) {
      // Multi-room calculation
      subtotal = rooms.reduce(
        (total, room) => total + room.pricePerNight * room.quantity * totalNights,
        0
      );
    } else {
      // Single room calculation (backward compatible)
      subtotal = totalNights * pricePerNight;
    }

    const platformFee = subtotal * 0.05; // 5% platform fee
    const totalAmount = subtotal + platformFee;

    set((state) => ({
      bookingData: {
        ...state.bookingData,
        subtotal,
        platformFee,
        totalAmount,
      },
    }));
  },

  resetBooking: () =>
    set({
      currentStep: BookingStep.DATES,
      bookingData: defaultBookingData,
      isProcessing: false,
      error: null,
    }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),

  setError: (error) => set({ error }),
}));
