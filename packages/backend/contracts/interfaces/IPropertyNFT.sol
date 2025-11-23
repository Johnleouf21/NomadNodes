// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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
        address traveler;
        uint256 checkIn;
        uint256 checkOut;
        uint256 escrowId;
        BookingStatus status;
        uint256 createdAt;
    }

    function bookRoom(
        uint256 tokenId,
        address traveler,
        uint256 checkIn,
        uint256 checkOut,
        uint256 escrowId
    ) external returns (uint256);

    function confirmBooking(uint256 tokenId, uint256 bookingIndex) external;
    function completeBooking(uint256 tokenId, uint256 bookingIndex) external;
    function cancelBooking(uint256 tokenId, uint256 bookingIndex) external;
    function updatePropertyRating(uint256 propertyId, uint8 rating) external;

    function checkAvailability(
        uint256 tokenId,
        uint256 checkIn,
        uint256 checkOut,
        uint256 unitsNeeded
    ) external view returns (bool);

    function getBooking(uint256 tokenId, uint256 bookingIndex) external view returns (Booking memory);

    function propertyOwner(uint256 propertyId) external view returns (address);
    function decodeTokenId(uint256 tokenId) external pure returns (uint256 propertyId, uint256 roomTypeId);
}
