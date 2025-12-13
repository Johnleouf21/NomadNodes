/**
 * Types for Booking Detail Sheet (Traveler View)
 */

import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { PonderReview } from "@/hooks/usePonderReviews";

/**
 * Booking data for the detail sheet
 */
export interface BookingDetailData {
  id: string;
  propertyId: string;
  propertyName: string;
  roomTypeId: string;
  roomName: string;
  tokenId: string;
  bookingIndex?: string;
  location: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  total: number;
  currency?: "USD" | "EUR";
  status: "upcoming" | "past" | "cancelled";
  ponderStatus: PonderBooking["status"];
  image: string;
  escrowAddress: string | null;
  hostAddress?: string | null;
  travelerAddress?: string;
}

/**
 * Props for the main BookingDetailSheet component
 */
export interface BookingDetailSheetProps {
  booking: BookingDetailData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelClick: () => void;
  onReviewClick: () => void;
  onMessage?: () => void;
  /** Existing review for this booking (if any) */
  existingReview?: PonderReview | null;
}

/**
 * Review struct returned by getReview contract call
 */
export interface ReviewStruct {
  reviewId: bigint;
  escrowId: bigint;
  propertyId: bigint;
  bookingIndex: bigint;
  reviewer: string;
  reviewee: string;
  rating: number;
  ipfsCommentHash: string;
  submittedAt: bigint;
  status: number;
  moderationNote: string;
  moderator: string;
  travelerToHost: boolean;
}

/**
 * Status configuration for display
 */
export interface StatusConfig {
  label: string;
  color: string;
  description: string;
}
