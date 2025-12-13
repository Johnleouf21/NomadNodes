import { Clock, CheckCircle2, LogIn, XCircle } from "lucide-react";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { StatusConfig } from "./types";

/**
 * Escrow ABI for reading data
 */
export const ESCROW_ABI = [
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
    name: "getRefundPercentage",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Status configuration
 */
export const statusConfig: Record<PonderBooking["status"], StatusConfig> = {
  Pending: {
    label: "Pending Confirmation",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10 border-yellow-500/30",
    icon: Clock,
    description: "Awaiting your confirmation. Please review and confirm this booking.",
    step: 1,
  },
  Confirmed: {
    label: "Confirmed",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/30",
    icon: CheckCircle2,
    description: "Booking confirmed. Guest will check in on the scheduled date.",
    step: 2,
  },
  CheckedIn: {
    label: "Guest Checked In",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/30",
    icon: LogIn,
    description: "Guest has arrived and checked in. Complete after their stay.",
    step: 3,
  },
  Completed: {
    label: "Completed",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-500/10 border-green-500/30",
    icon: CheckCircle2,
    description: "Stay completed. Payment has been released to you.",
    step: 4,
  },
  Cancelled: {
    label: "Cancelled",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-500/10 border-red-500/30",
    icon: XCircle,
    description: "This booking has been cancelled.",
    step: 0,
  },
};

/**
 * Progress steps
 */
export const PROGRESS_STEPS = ["Pending", "Confirmed", "Checked In", "Completed"];
