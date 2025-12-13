/**
 * Types for Review Submission Form
 */

import type { Address } from "viem";

/**
 * Booking data needed for review submission
 */
export interface ReviewableBooking {
  id: string;
  propertyId: string;
  propertyName: string;
  roomName: string;
  tokenId: string;
  bookingIndex: string;
  checkOut: Date;
  location: string;
  image?: string;
  escrowAddress: string;
  hostAddress: Address;
  travelerAddress: Address;
}

/**
 * Props for the main ReviewSubmissionForm component
 */
export interface ReviewSubmissionFormProps {
  booking: ReviewableBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** true = traveler reviewing host, false = host reviewing traveler */
  isTravelerReview: boolean;
}

/**
 * Review window status information
 */
export interface ReviewWindowInfo {
  isOpen: boolean;
  daysLeft: number;
  isTooEarly: boolean;
  isExpired: boolean;
  isDevMode: boolean;
}

/**
 * Form state for review submission
 */
export interface ReviewFormState {
  rating: number;
  comment: string;
  isUploading: boolean;
}
