// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PropertyTypes
 * @notice Shared types and structs used across PropertyNFT contract and libraries
 */
library PropertyTypes {
    enum BookingStatus {
        Pending,
        Confirmed,
        CheckedIn,
        Completed,
        Cancelled
    }

    struct Property {
        uint256 propertyId;
        address hostWallet;
        uint256 hostSbtTokenId;
        bool isActive;
        uint256 totalBookings;
        uint256 averageRating;
        uint256 totalReviewsReceived;
        uint256 createdAt;
        uint256 lastBookingTimestamp;
        string propertyType;
        string location;
        string ipfsMetadataHash;
    }

    struct RoomType {
        uint256 roomTypeId;
        uint256 propertyId;
        string name;
        string ipfsMetadataHash;
        uint256 pricePerNight;
        uint256 cleaningFee;
        uint256 maxGuests;
        uint256 totalSupply;
        bool isActive;
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
}
