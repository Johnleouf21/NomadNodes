/**
 * CheckInScanner module
 *
 * Refactored from a 472-line monolithic component into:
 * - Types: ScannedData, MatchedBooking, PendingCheckIn
 * - Utils: getEligibleBookings, findMatchingBookings
 * - Hooks: useCheckInState, useCheckInTransactions
 * - Components: BookingCard, ManualCheckInTab, QRCheckInTab
 */

export { CheckInScanner } from "./CheckInScanner";
