/**
 * Types for GuestsStep
 */

export interface GuestsStepProps {
  onNext: (guests: number, specialRequests: string) => void;
  onBack: () => void;
  maxGuests?: number;
  initialGuests?: number;
  propertyId?: bigint;
  currentRoomTokenId?: bigint;
  currentRoomName?: string;
  currentRoomPrice?: number;
  currentRoomCurrency?: "USD" | "EUR";
  checkIn?: Date | null;
  checkOut?: Date | null;
  totalNights?: number;
}

export interface RoomPriceSummary {
  name: string;
  quantity: number;
  pricePerNight: number;
}

export interface PriceSummary {
  rooms: RoomPriceSummary[];
  perNight: number;
  total: number;
  currencySymbol: string;
}
