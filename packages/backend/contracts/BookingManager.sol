// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPropertyRegistry.sol";
import "./interfaces/IRoomTypeNFT.sol";
import "./interfaces/IAvailabilityManager.sol";
import "./interfaces/ITravelerSBT.sol";
import "./libraries/PropertyTypes.sol";

/**
 * @title BookingManager
 * @notice Manages all booking operations - create, confirm, checkin, complete, cancel
 * @dev Central coordinator for bookings, integrates with all other contracts
 */
contract BookingManager is Ownable {
    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    IPropertyRegistry public propertyRegistry;
    IRoomTypeNFT public roomTypeNFT;
    IAvailabilityManager public availabilityManager;
    ITravelerSBT public travelerSBT;
    address public escrowFactory;
    address public reviewRegistry;
    address public propertyNFTAdapter;

    // tokenId => array of bookings
    mapping(uint256 => PropertyTypes.Booking[]) public bookings;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event BookingCreated(
        uint256 indexed tokenId,
        uint256 indexed bookingIndex,
        address indexed traveler,
        uint256 checkInDate,
        uint256 checkOutDate,
        uint256 totalPrice
    );
    event BookingConfirmed(uint256 indexed tokenId, uint256 indexed bookingIndex);
    event BookingCheckedIn(uint256 indexed tokenId, uint256 indexed bookingIndex);
    event BookingCompleted(uint256 indexed tokenId, uint256 indexed bookingIndex);
    event BookingCancelled(uint256 indexed tokenId, uint256 indexed bookingIndex);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error MustHaveTravelerSBT();
    error InvalidTokenId();
    error RoomTypeNotActive();
    error NoAvailableUnits();
    error InvalidBookingIndex();
    error InvalidBookingStatus();
    error NotTraveler();
    error NotPropertyOwner();
    error NotEscrowFactory();
    error InvalidAddress();
    error InvalidDateRange();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(
        address _propertyRegistry,
        address _roomTypeNFT,
        address _availabilityManager,
        address _travelerSBT
    ) Ownable(msg.sender) {
        propertyRegistry = IPropertyRegistry(_propertyRegistry);
        roomTypeNFT = IRoomTypeNFT(_roomTypeNFT);
        availabilityManager = IAvailabilityManager(_availabilityManager);
        travelerSBT = ITravelerSBT(_travelerSBT);
    }

    /*//////////////////////////////////////////////////////////////
                        BOOKING OPERATIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new booking
     * @param tokenId The room type token ID
     * @param checkInDate Unix timestamp for check-in
     * @param checkOutDate Unix timestamp for check-out
     * @param numGuests Number of guests
     * @param escrowAddress Address of the escrow contract (can be address(0) if not known yet)
     * @param _traveler Address of the traveler (used when called via PropertyNFTAdapter for AA wallets)
     * @return bookingIndex Index of the created booking
     */
    function bookRoom(
        uint256 tokenId,
        uint256 checkInDate,
        uint256 checkOutDate,
        uint256 numGuests,
        address escrowAddress,
        address _traveler
    ) external returns (uint256 bookingIndex) {
        address traveler = msg.sender;

        // If called by PropertyNFTAdapter, use the explicit traveler address
        // This supports Account Abstraction wallets where tx.origin doesn't work
        if (msg.sender == propertyNFTAdapter) {
            if (_traveler == address(0)) revert InvalidAddress();
            traveler = _traveler;
        }

        if (!travelerSBT.hasSBT(traveler)) revert MustHaveTravelerSBT();

        PropertyTypes.RoomType memory roomType = roomTypeNFT.getRoomType(tokenId);
        if (roomType.roomTypeId == 0) revert InvalidTokenId();
        if (!roomType.isActive) revert RoomTypeNotActive();
        if (checkInDate >= checkOutDate) revert InvalidDateRange();

        // Check availability
        uint256 availableUnits = availabilityManager.getAvailableUnits(tokenId, checkInDate, checkOutDate);
        if (availableUnits == 0) revert NoAvailableUnits();

        // Find first available unit
        uint256 unitIndex = _findAvailableUnit(tokenId, checkInDate, checkOutDate, roomType.totalSupply);

        // Calculate total price
        uint256 numNights = (checkOutDate - checkInDate) / 1 days;
        uint256 totalPrice = (roomType.pricePerNight * numNights) + roomType.cleaningFee;

        // Get traveler SBT token ID
        uint256 travelerTokenId = travelerSBT.walletToTokenId(traveler);

        // Create booking
        bookingIndex = bookings[tokenId].length;
        bookings[tokenId].push(
            PropertyTypes.Booking({
                tokenId: tokenId,
                unitIndex: unitIndex,
                traveler: traveler,
                travelerSbtTokenId: travelerTokenId,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
                numGuests: numGuests,
                totalPrice: totalPrice,
                status: PropertyTypes.BookingStatus.Pending,
                escrowAddress: escrowAddress,
                createdAt: block.timestamp
            })
        );

        // Mark unit as unavailable
        availabilityManager.setAvailability(tokenId, unitIndex, checkInDate, checkOutDate, false);

        // Increment property booking count
        (uint256 propertyId, ) = roomTypeNFT.decodeTokenId(tokenId);
        propertyRegistry.incrementBookingCount(propertyId);

        // Link booking to traveler SBT
        travelerSBT.linkBooking(traveler, tokenId, bookingIndex);

        emit BookingCreated(tokenId, bookingIndex, traveler, checkInDate, checkOutDate, totalPrice);
    }

    /**
     * @notice Confirm a booking (called by escrow after payment)
     * @param tokenId The room type token ID
     * @param bookingIndex Index of the booking
     * @dev Allows both direct escrowFactory calls and calls via PropertyNFTAdapter
     */
    function confirmBooking(uint256 tokenId, uint256 bookingIndex) external {
        // Allow both escrowFactory (direct) and propertyNFTAdapter (delegated)
        if (msg.sender != escrowFactory && msg.sender != propertyNFTAdapter) revert NotEscrowFactory();
        if (bookingIndex >= bookings[tokenId].length) revert InvalidBookingIndex();

        PropertyTypes.Booking storage booking = bookings[tokenId][bookingIndex];
        if (booking.status != PropertyTypes.BookingStatus.Pending) revert InvalidBookingStatus();

        booking.status = PropertyTypes.BookingStatus.Confirmed;

        emit BookingConfirmed(tokenId, bookingIndex);
    }

    /**
     * @notice Check in a booking
     * @param tokenId The room type token ID
     * @param bookingIndex Index of the booking
     */
    function checkInBooking(uint256 tokenId, uint256 bookingIndex) external {
        if (bookingIndex >= bookings[tokenId].length) revert InvalidBookingIndex();

        PropertyTypes.Booking storage booking = bookings[tokenId][bookingIndex];

        // Only property owner or traveler can check in
        (uint256 propertyId, ) = roomTypeNFT.decodeTokenId(tokenId);
        bool isOwner = propertyRegistry.isPropertyOwner(propertyId, msg.sender);
        bool isTraveler = booking.traveler == msg.sender;

        if (!isOwner && !isTraveler) revert NotPropertyOwner();
        if (booking.status != PropertyTypes.BookingStatus.Confirmed) revert InvalidBookingStatus();

        booking.status = PropertyTypes.BookingStatus.CheckedIn;

        emit BookingCheckedIn(tokenId, bookingIndex);
    }

    /**
     * @notice Complete a booking
     * @param tokenId The room type token ID
     * @param bookingIndex Index of the booking
     */
    function completeBooking(uint256 tokenId, uint256 bookingIndex) external {
        if (bookingIndex >= bookings[tokenId].length) revert InvalidBookingIndex();

        PropertyTypes.Booking storage booking = bookings[tokenId][bookingIndex];

        // Only property owner or escrow can complete
        (uint256 propertyId, ) = roomTypeNFT.decodeTokenId(tokenId);
        bool isOwner = propertyRegistry.isPropertyOwner(propertyId, msg.sender);
        bool isEscrow = msg.sender == escrowFactory;

        if (!isOwner && !isEscrow) revert NotPropertyOwner();
        if (booking.status != PropertyTypes.BookingStatus.CheckedIn) revert InvalidBookingStatus();

        booking.status = PropertyTypes.BookingStatus.Completed;

        emit BookingCompleted(tokenId, bookingIndex);
    }

    /**
     * @notice Cancel a booking
     * @param tokenId The room type token ID
     * @param bookingIndex Index of the booking
     */
    function cancelBooking(uint256 tokenId, uint256 bookingIndex) external {
        if (bookingIndex >= bookings[tokenId].length) revert InvalidBookingIndex();

        PropertyTypes.Booking storage booking = bookings[tokenId][bookingIndex];

        // Determine actual caller - handle PropertyNFTAdapter delegation
        address directCaller = msg.sender;
        address actualCaller = msg.sender;

        // For cancellation via PropertyNFTAdapter, we use the stored traveler address
        // instead of tx.origin to support Account Abstraction wallets
        if (msg.sender == propertyNFTAdapter) {
            // The escrow contract or traveler's smart wallet is calling via adapter
            // We'll check authorization against the booking's traveler below
            actualCaller = booking.traveler;
        }

        // Only traveler, property owner, escrow contract (via adapter), or escrow factory can cancel
        (uint256 propertyId, ) = roomTypeNFT.decodeTokenId(tokenId);
        bool isOwner = propertyRegistry.isPropertyOwner(propertyId, actualCaller);
        bool isTraveler = booking.traveler == actualCaller;
        bool isEscrowViaAdapter = (directCaller == propertyNFTAdapter && booking.escrowAddress != address(0));
        bool isEscrowFactory = actualCaller == escrowFactory;

        if (!isOwner && !isTraveler && !isEscrowViaAdapter && !isEscrowFactory) revert NotTraveler();

        // Can only cancel if not completed
        if (booking.status == PropertyTypes.BookingStatus.Completed) revert InvalidBookingStatus();

        PropertyTypes.BookingStatus oldStatus = booking.status;
        booking.status = PropertyTypes.BookingStatus.Cancelled;

        // Release availability - always restore since availability was taken at booking creation
        // regardless of status (Pending, Confirmed, or CheckedIn)
        if (
            oldStatus == PropertyTypes.BookingStatus.Pending ||
            oldStatus == PropertyTypes.BookingStatus.Confirmed ||
            oldStatus == PropertyTypes.BookingStatus.CheckedIn
        ) {
            availabilityManager.setAvailability(
                tokenId,
                booking.unitIndex,
                booking.checkInDate,
                booking.checkOutDate,
                true
            );
        }

        emit BookingCancelled(tokenId, bookingIndex);
    }

    /**
     * @notice Update property rating after a completed booking
     * @param tokenId The room type token ID
     * @param rating Rating from 1-5
     */
    function updatePropertyRating(uint256 tokenId, uint8 rating) external {
        // Called by ReviewRegistry after review is submitted
        if (msg.sender != reviewRegistry) revert NotPropertyOwner();

        (uint256 propertyId, ) = roomTypeNFT.decodeTokenId(tokenId);
        propertyRegistry.updatePropertyRating(propertyId, rating);
    }

    /**
     * @notice Update escrow address for a booking (called by EscrowFactory after escrow creation)
     * @param tokenId The room type token ID
     * @param bookingIndex Index of the booking
     * @param escrowAddress Address of the escrow contract
     * @dev Allows both direct escrowFactory calls and calls via PropertyNFTAdapter
     */
    function setEscrowAddress(uint256 tokenId, uint256 bookingIndex, address escrowAddress) external {
        // Allow both escrowFactory (direct) and propertyNFTAdapter (delegated)
        if (msg.sender != escrowFactory && msg.sender != propertyNFTAdapter) revert NotEscrowFactory();
        if (bookingIndex >= bookings[tokenId].length) revert InvalidBookingIndex();
        if (escrowAddress == address(0)) revert InvalidAddress();

        bookings[tokenId][bookingIndex].escrowAddress = escrowAddress;
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get all bookings for a token ID
     * @param tokenId The room type token ID
     * @return Array of bookings
     */
    function getBookings(uint256 tokenId) external view returns (PropertyTypes.Booking[] memory) {
        return bookings[tokenId];
    }

    /**
     * @notice Get a specific booking
     * @param tokenId The room type token ID
     * @param bookingIndex Index of the booking
     * @return Booking struct
     */
    function getBooking(uint256 tokenId, uint256 bookingIndex) external view returns (PropertyTypes.Booking memory) {
        if (bookingIndex >= bookings[tokenId].length) revert InvalidBookingIndex();
        return bookings[tokenId][bookingIndex];
    }

    /**
     * @notice Check if a token has active bookings
     * @param tokenId The room type token ID
     * @return bool True if there are active (non-cancelled, non-completed) bookings
     */
    function hasActiveBookings(uint256 tokenId) external view returns (bool) {
        PropertyTypes.Booking[] memory tokenBookings = bookings[tokenId];
        for (uint256 i = 0; i < tokenBookings.length; i++) {
            if (
                tokenBookings[i].status != PropertyTypes.BookingStatus.Cancelled &&
                tokenBookings[i].status != PropertyTypes.BookingStatus.Completed
            ) {
                return true;
            }
        }
        return false;
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Find first available unit for the date range
     * @dev Iterates through all units to find first available one
     */
    function _findAvailableUnit(
        uint256 tokenId,
        uint256 checkInDate,
        uint256 checkOutDate,
        uint256 totalSupply
    ) internal view returns (uint256) {
        for (uint256 i = 0; i < totalSupply; i++) {
            if (availabilityManager.isRoomAvailable(tokenId, i, checkInDate, checkOutDate)) {
                return i;
            }
        }
        revert NoAvailableUnits();
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setEscrowFactory(address _escrowFactory) external onlyOwner {
        if (_escrowFactory == address(0)) revert InvalidAddress();
        escrowFactory = _escrowFactory;
    }

    function setReviewRegistry(address _reviewRegistry) external onlyOwner {
        if (_reviewRegistry == address(0)) revert InvalidAddress();
        reviewRegistry = _reviewRegistry;
    }

    function setPropertyRegistry(address _propertyRegistry) external onlyOwner {
        if (_propertyRegistry == address(0)) revert InvalidAddress();
        propertyRegistry = IPropertyRegistry(_propertyRegistry);
    }

    function setRoomTypeNFT(address _roomTypeNFT) external onlyOwner {
        if (_roomTypeNFT == address(0)) revert InvalidAddress();
        roomTypeNFT = IRoomTypeNFT(_roomTypeNFT);
    }

    function setAvailabilityManager(address _availabilityManager) external onlyOwner {
        if (_availabilityManager == address(0)) revert InvalidAddress();
        availabilityManager = IAvailabilityManager(_availabilityManager);
    }

    function setTravelerSBT(address _travelerSBT) external onlyOwner {
        if (_travelerSBT == address(0)) revert InvalidAddress();
        travelerSBT = ITravelerSBT(_travelerSBT);
    }

    function setPropertyNFTAdapter(address _propertyNFTAdapter) external onlyOwner {
        if (_propertyNFTAdapter == address(0)) revert InvalidAddress();
        propertyNFTAdapter = _propertyNFTAdapter;
    }
}
