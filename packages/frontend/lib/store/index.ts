/**
 * Zustand Stores Index
 * Centralized export for all state management stores
 */

export { useSearchStore, type SearchFilters } from "./useSearchStore";
export { useBookingStore, BookingStep, type BookingData } from "./useBookingStore";
export { useUIStore, type ModalType } from "./useUIStore";
export { useUserStore, type UserRole, type UserProfile } from "./useUserStore";
