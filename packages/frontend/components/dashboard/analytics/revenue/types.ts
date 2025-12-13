import type { PonderBooking } from "@/hooks/usePonderBookings";

export interface HostRevenueProps {
  bookings: PonderBooking[];
  getPropertyInfo: (booking: PonderBooking) => { name: string; imageUrl?: string };
  getRoomTypeInfo: (booking: PonderBooking) => { name: string; currency: "USD" | "EUR" };
}

export interface EscrowInfo {
  booking: PonderBooking;
  escrowAddress: string;
  status: number | undefined;
  withdrawn: boolean | undefined;
  amount: bigint | undefined;
  platformFee: bigint | undefined;
  balance: bigint | undefined;
  hostPreference: number | undefined;
  checkInTimestamp: bigint | undefined;
}

export interface BatchWithdrawState {
  isActive: boolean;
  escrows: EscrowInfo[];
  currentIndex: number;
  completed: string[];
  failed: string[];
  status: "idle" | "processing" | "waiting" | "done" | "cancelled";
}

export interface RevenueTotals {
  pending: number;
  withdrawn: number;
  total: number;
}
