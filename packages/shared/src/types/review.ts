export enum ReviewType {
  HOST_TO_TRAVELER = "HOST_TO_TRAVELER",
  TRAVELER_TO_HOST = "TRAVELER_TO_HOST",
  TRAVELER_TO_PROPERTY = "TRAVELER_TO_PROPERTY",
}

export interface Review {
  id: string;
  bookingId: string;
  reviewType: ReviewType;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment: string;
  contentHash: string;
  createdAt: Date;
}
