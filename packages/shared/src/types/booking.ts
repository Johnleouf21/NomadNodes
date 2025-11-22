export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CHECKED_IN = "CHECKED_IN",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  DISPUTED = "DISPUTED",
}

export enum PaymentCurrency {
  USDC = "USDC",
  EURC = "EURC",
}

export interface Booking {
  id: string;
  escrowAddress: string;
  propertyId: string;
  travelerId: string;
  hostId: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalPrice: string;
  currency: PaymentCurrency;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}
