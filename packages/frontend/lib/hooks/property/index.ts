/**
 * Property hooks - Centralized exports
 * Updated for new contract architecture:
 * - PropertyRegistry (property management)
 * - RoomTypeNFT (ERC1155 room types)
 * - AvailabilityManager (availability)
 * - BookingManager (bookings)
 */

// Types
export * from "./types";

// Read hooks (queries) - PropertyRegistry, RoomTypeNFT, and HostSBT
export {
  usePropertyById,
  usePropertyRoomTypes,
  useRoomTypeById,
  useTotalProperties,
  useIsPropertyOwner,
  usePropertyOwner,
  useRoomTypeURI,
  useRoomTypeBalance,
  useEncodeTokenId,
  useDecodeTokenId,
  usePropertiesByHost, // uses HostSBT.getHostProperties
  useHostProperties, // uses HostSBT.getHostProperties
} from "./usePropertyQueries";

// Write hooks (mutations) - PropertyRegistry and RoomTypeNFT
export {
  useSetPropertyActive,
  useUpdateProperty, // deprecated
  useSetRoomTypeActive,
  useUpdateRoomTypeSettings,
  useUpdateRoomTypeSupply,
  useDeleteRoomType,
  useUpdateRoomTypeMetadata,
  useUpdateRoomType, // deprecated, use useUpdateRoomTypeMetadata
} from "./usePropertyMutations";

// Property creation hook
export { useCreateProperty } from "./useCreateProperty";

// Room type management hooks - additional functions
export {
  useAddRoomType,
  useUpdateRoomTypeName, // deprecated
} from "./useRoomTypeManagement";

// Availability hooks - AvailabilityManager
export {
  useSetAvailability,
  useSetBulkAvailability,
  useCheckAvailability,
  useCheckMultipleAvailability,
  useCalendarAvailability,
  useIsRoomAvailable,
  useGetAvailableUnits,
  useGetDayAvailability, // deprecated, use useGetAvailableUnits
  getStartOfDayTimestamp,
  getEndOfDayTimestamp,
} from "./availability";

// IPFS metadata hooks
export * from "./useIPFSMetadata";

// Booking hooks - BookingManager
export {
  BookingStatus,
  type BookingData,
  useGetBooking,
  useGetBookings,
  useHasActiveBookings,
  useTotalBookings,
  useCreateBooking,
  useConfirmBooking,
  useCheckIn,
  useCompleteBooking,
  useCancelBooking,
  useBookRoom, // deprecated, use useCreateBooking
  getBookingStatusLabel,
  getBookingStatusColor,
  useGetTravelerBookings, // deprecated
} from "./useBooking";

// Search hooks - PropertyRegistry and AvailabilityManager
export {
  useTotalProperties as usePropertyCount,
  useAllActiveProperties, // deprecated
  useSearchAvailableRooms,
  useIsRoomAvailable as useSearchIsRoomAvailable,
  useAvailableUnits,
  useRoomHasAvailability,
  useMultipleRoomsAvailability, // deprecated
  usePropertySearchWithFilters,
} from "./usePropertySearch";
