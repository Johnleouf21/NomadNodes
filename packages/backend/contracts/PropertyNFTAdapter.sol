// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IPropertyNFT.sol";
import "./interfaces/IPropertyRegistry.sol";
import "./interfaces/IRoomTypeNFT.sol";
import "./interfaces/IAvailabilityManager.sol";
import "./interfaces/IBookingManager.sol";
import "./libraries/PropertyTypes.sol";

/**
 * @title PropertyNFTAdapter
 * @notice Adapter contract that implements IPropertyNFT by delegating to modular contracts
 * @dev This allows EscrowFactory to interact with the modular architecture via a single interface
 */
contract PropertyNFTAdapter is IPropertyNFT {
    IPropertyRegistry public immutable propertyRegistry;
    IRoomTypeNFT public immutable roomTypeNFT;
    IAvailabilityManager public immutable availabilityManager;
    IBookingManager public immutable bookingManager;

    constructor(
        address _propertyRegistry,
        address _roomTypeNFT,
        address _availabilityManager,
        address _bookingManager
    ) {
        propertyRegistry = IPropertyRegistry(_propertyRegistry);
        roomTypeNFT = IRoomTypeNFT(_roomTypeNFT);
        availabilityManager = IAvailabilityManager(_availabilityManager);
        bookingManager = IBookingManager(_bookingManager);
    }

    // ============ Booking Functions (delegate to BookingManager) ============

    function bookRoom(
        uint256 tokenId,
        uint256 checkInDate,
        uint256 checkOutDate,
        uint256 numGuests,
        address escrowAddress,
        address traveler
    ) external override returns (uint256 bookingIndex) {
        return bookingManager.bookRoom(tokenId, checkInDate, checkOutDate, numGuests, escrowAddress, traveler);
    }

    function setEscrowAddress(uint256 tokenId, uint256 bookingIndex, address escrowAddress) external override {
        bookingManager.setEscrowAddress(tokenId, bookingIndex, escrowAddress);
    }

    function confirmBooking(uint256 tokenId, uint256 bookingIndex) external override {
        bookingManager.confirmBooking(tokenId, bookingIndex);
    }

    function completeBooking(uint256 tokenId, uint256 bookingIndex) external override {
        bookingManager.completeBooking(tokenId, bookingIndex);
    }

    function cancelBooking(uint256 tokenId, uint256 bookingIndex) external override {
        bookingManager.cancelBooking(tokenId, bookingIndex);
    }

    function getBooking(uint256 tokenId, uint256 bookingIndex) external view override returns (Booking memory) {
        // BookingManager returns PropertyTypes.Booking - convert to IPropertyNFT.Booking
        PropertyTypes.Booking memory booking = bookingManager.getBooking(tokenId, bookingIndex);

        return
            Booking({
                tokenId: booking.tokenId,
                unitIndex: booking.unitIndex,
                traveler: booking.traveler,
                travelerSbtTokenId: booking.travelerSbtTokenId,
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                numGuests: booking.numGuests,
                totalPrice: booking.totalPrice,
                status: BookingStatus(uint256(booking.status)),
                escrowAddress: booking.escrowAddress,
                createdAt: booking.createdAt
            });
    }

    // ============ Property Functions (delegate to PropertyRegistry) ============

    function propertyOwner(uint256 propertyId) external view override returns (address) {
        return propertyRegistry.propertyOwner(propertyId);
    }

    // ============ Room Type Functions (delegate to RoomTypeNFT) ============

    function decodeTokenId(uint256 tokenId) external pure override returns (uint256 propertyId, uint256 roomTypeId) {
        // This is a pure function, so we can call it statically
        propertyId = tokenId >> 128;
        roomTypeId = tokenId & ((1 << 128) - 1);
    }

    // ============ Availability Functions (delegate to AvailabilityManager) ============

    function checkAvailability(
        uint256 tokenId,
        uint256 startDate,
        uint256 endDate
    ) external view override returns (bool) {
        return availabilityManager.checkAvailability(tokenId, startDate, endDate);
    }

    // ============ Rating Functions (delegate to PropertyRegistry) ============

    function updatePropertyRating(uint256 propertyId, uint8 rating) external override {
        // Note: For compatibility, this accepts propertyId directly (not tokenId)
        // ReviewRegistry calls this with propertyId
        propertyRegistry.updatePropertyRating(propertyId, rating);
    }
}
