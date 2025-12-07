// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../libraries/PropertyTypes.sol";

interface IBookingManager {
    function bookRoom(
        uint256 tokenId,
        uint256 checkInDate,
        uint256 checkOutDate,
        uint256 numGuests,
        address escrowAddress,
        address traveler
    ) external returns (uint256 bookingIndex);

    function setEscrowAddress(uint256 tokenId, uint256 bookingIndex, address escrowAddress) external;

    function confirmBooking(uint256 tokenId, uint256 bookingIndex) external;
    function checkInBooking(uint256 tokenId, uint256 bookingIndex) external;
    function completeBooking(uint256 tokenId, uint256 bookingIndex) external;
    function cancelBooking(uint256 tokenId, uint256 bookingIndex) external;

    function updatePropertyRating(uint256 tokenId, uint8 rating) external;

    function getBooking(uint256 tokenId, uint256 bookingIndex) external view returns (PropertyTypes.Booking memory);
    function getBookings(uint256 tokenId) external view returns (PropertyTypes.Booking[] memory);
    function hasActiveBookings(uint256 tokenId) external view returns (bool);
}
