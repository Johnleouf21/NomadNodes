/**
 * Types and ABI for CancelBookingModal
 */

export interface CancelBookingModalProps {
  booking: BookingInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface BookingInfo {
  id: string;
  propertyName: string;
  roomName: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  total: number;
  currency?: "USD" | "EUR";
  escrowAddress: string | null;
}

export interface RefundCalculation {
  refundPercent: number;
  totalAmount: number;
  fee: number;
  refundableAmount: number;
  yourRefund: number;
  hostReceives: number;
}

// TravelEscrow ABI (only the functions we need)
export const ESCROW_ABI = [
  {
    inputs: [],
    name: "getRefundPercentage",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "cancelBooking",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "amount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFee",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "checkIn",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
