// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPropertyNFT
 * @notice Interface for interacting with the modular property management system
 * @dev This interface is used by EscrowFactory and points to BookingManager as the main entry point
 */
interface IPropertyNFT {
    enum BookingStatus {
        Pending,
        Confirmed,
        CheckedIn,
        Completed,
        Cancelled
    }

    struct Booking {
        uint256 tokenId;
        uint256 unitIndex;
        address traveler;
        uint256 travelerSbtTokenId;
        uint256 checkInDate;
        uint256 checkOutDate;
        uint256 numGuests;
        uint256 totalPrice;
        BookingStatus status;
        address escrowAddress;
        uint256 createdAt;
    }

    // Booking functions (delegated to BookingManager)
    function bookRoom(
        uint256 tokenId,
        uint256 checkInDate,
        uint256 checkOutDate,
        uint256 numGuests,
        address escrowAddress
    ) external returns (uint256 bookingIndex);

    function setEscrowAddress(uint256 tokenId, uint256 bookingIndex, address escrowAddress) external;

    function confirmBooking(uint256 tokenId, uint256 bookingIndex) external;
    function completeBooking(uint256 tokenId, uint256 bookingIndex) external;
    function cancelBooking(uint256 tokenId, uint256 bookingIndex) external;

    function getBooking(uint256 tokenId, uint256 bookingIndex) external view returns (Booking memory);

    // Property functions (delegated to PropertyRegistry)
    function propertyOwner(uint256 propertyId) external view returns (address);

    // Room type functions (delegated to RoomTypeNFT)
    function decodeTokenId(uint256 tokenId) external pure returns (uint256 propertyId, uint256 roomTypeId);

    // Availability functions (delegated to AvailabilityManager)
    function checkAvailability(uint256 tokenId, uint256 startDate, uint256 endDate) external view returns (bool);

    // Rating functions (delegated to BookingManager)
    function updatePropertyRating(uint256 tokenId, uint8 rating) external;
}
