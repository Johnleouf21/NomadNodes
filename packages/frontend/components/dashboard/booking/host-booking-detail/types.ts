import type { LucideIcon } from "lucide-react";
import type { PonderBooking } from "@/hooks/usePonderBookings";

/**
 * Props for HostBookingDetailSheet
 */
export interface HostBookingDetailSheetProps {
  booking: PonderBooking | null;
  propertyName: string;
  propertyImage?: string;
  roomTypeName?: string;
  currency?: "USD" | "EUR";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  onCheckIn?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  onReviewClick?: () => void;
  onMessage?: () => void;
  isActionPending?: boolean;
}

/**
 * Status configuration type
 */
export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: LucideIcon;
  description: string;
  step: number;
}

/**
 * Days info calculation result
 */
export interface DaysInfo {
  nights: number;
  daysUntilCheckIn: number;
  checkInLabel: string;
  isUrgent: boolean;
}

/**
 * Action availability state
 */
export interface ActionAvailability {
  canConfirm: boolean;
  canCheckIn: boolean;
  canComplete: boolean;
  canCancel: boolean;
  checkInDisabledReason: string | null;
  completeDisabledReason: string | null;
}

/**
 * Payment breakdown
 */
export interface PaymentBreakdown {
  escrowTotal: number;
  fee: number;
  hostReceives: number;
  currentRefundPercent: number;
  currencyLabel: string;
}
