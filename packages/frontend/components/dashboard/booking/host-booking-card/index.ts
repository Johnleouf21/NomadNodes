/**
 * HostBookingCard module
 *
 * Refactored from a 442-line monolithic component into:
 * - Types: HostBookingCardProps, StatusConfig, statusConfig
 * - Utils: formatDate, getDaysUntil, getNightsCount, shortenAddress, copyToClipboard, getBookingActionState
 * - Components: BookingImage, BookingHeader, BookingDetails, BookingActions
 */

export { HostBookingCard } from "./HostBookingCard";
export type { HostBookingCardProps } from "./types";
