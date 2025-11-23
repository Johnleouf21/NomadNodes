// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IHostSBT.sol";

/**
 * @title PropertyNFT
 * @notice ERC1155 token representing real-world accommodation properties with multi-unit support
 * @dev Properties support multiple room types (Standard x5, Double x10, Suite x2, etc.)
 *
 * TokenID Structure:
 * - Upper 128 bits: PropertyID (unique property identifier)
 * - Lower 128 bits: RoomTypeID (0=Standard, 1=Double, 2=Suite, etc.)
 *
 * Example:
 * Property 42, Standard Room (5 units): tokenId = (42 << 128) | 0, supply = 5
 * Property 42, Double Room (10 units): tokenId = (42 << 128) | 1, supply = 10
 */
contract PropertyNFT is ERC1155, Ownable {
    using Strings for uint256;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Property {
        uint256 propertyId; // Base property ID (upper 128 bits of tokenId)
        address hostWallet; // Current host/owner
        uint256 hostSbtTokenId; // Reference to HostSBT
        bool isActive; // Available for booking
        // Reputation (aggregated across all room types)
        uint256 totalBookings;
        uint256 averageRating; // 0-500 (5.00 = 500)
        uint256 totalReviewsReceived;
        // Metadata
        uint256 createdAt;
        uint256 lastBookingTimestamp;
        string propertyType; // "hotel", "villa", "apartment", "cabin"
        string location; // "Bali, Indonesia"
        string ipfsMetadataHash; // IPFS hash for property-level metadata
    }

    struct RoomType {
        uint256 tokenId; // Full tokenId (propertyId << 128 | roomTypeId)
        string name; // "Standard Room", "Double Room", "Suite"
        uint256 maxSupply; // Maximum units for this room type
        string ipfsMetadataHash; // IPFS hash for room-specific metadata
        bool isActive; // Can be booked
    }

    struct Booking {
        uint256 tokenId; // PropertyNFT tokenId (includes room type)
        address traveler;
        uint256 checkIn; // Unix timestamp
        uint256 checkOut; // Unix timestamp
        uint256 escrowId; // Reference to escrow contract
        BookingStatus status;
        uint256 createdAt;
    }

    enum BookingStatus {
        Pending,
        Confirmed,
        CheckedIn,
        Completed,
        Cancelled
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    // Property registry
    mapping(uint256 => Property) public properties; // propertyId => Property
    mapping(uint256 => RoomType) public roomTypes; // tokenId => RoomType
    mapping(uint256 => uint256[]) public propertyRoomTypes; // propertyId => tokenIds[]

    // Bookings
    mapping(uint256 => Booking[]) public tokenBookings; // tokenId => bookings[]

    // Availability bitmap (per tokenId, per day)
    // Each day is a bit: 0 = unavailable, 1 = available
    // Supports ~256 days of availability per storage slot
    mapping(uint256 => mapping(uint256 => uint256)) public availabilityBitmap;

    // Ownership tracking
    mapping(uint256 => address) public propertyOwner; // propertyId => owner

    uint256 private _propertyIdCounter = 1;
    uint256 private _roomTypeCounter;

    IHostSBT public hostSBT;
    address public platform; // Platform address (only one who can transfer ownership)
    address public escrowFactory;
    address public reviewRegistry;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event PropertyCreated(
        uint256 indexed propertyId,
        address indexed host,
        uint256 indexed hostSbtTokenId,
        string ipfsHash
    );
    event RoomTypeAdded(uint256 indexed propertyId, uint256 indexed tokenId, string name, uint256 maxSupply);
    event PropertyOwnershipTransferred(uint256 indexed propertyId, address indexed oldOwner, address indexed newOwner);
    event PropertyActivated(uint256 indexed propertyId);
    event PropertyDeactivated(uint256 indexed propertyId);
    event RoomTypeActivated(uint256 indexed tokenId);
    event RoomTypeDeactivated(uint256 indexed tokenId);
    event PropertyBooked(
        uint256 indexed tokenId,
        address indexed traveler,
        uint256 checkIn,
        uint256 checkOut,
        uint256 escrowId
    );
    event BookingCancelled(uint256 indexed tokenId, uint256 bookingIndex);
    event BookingCompleted(uint256 indexed tokenId, uint256 bookingIndex);
    event PropertyRated(uint256 indexed propertyId, uint8 rating, uint256 newAverageRating);
    event AvailabilityUpdated(uint256 indexed tokenId, uint256 startDate, uint256 endDate, bool available);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error MustHaveHostSBT();
    error NotPropertyOwner();
    error NotPlatform();
    error PropertyNotActive();
    error RoomTypeNotActive();
    error DatesNotAvailable();
    error InvalidDateRange();
    error InvalidRating();
    error NotAuthorized();
    error BookingNotFound();
    error InvalidTokenId();
    error InvalidSupply();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _hostSBT, address _platform) ERC1155("") Ownable(msg.sender) {
        hostSBT = IHostSBT(_hostSBT);
        platform = _platform;
    }

    /*//////////////////////////////////////////////////////////////
                        TOKEN ID ENCODING/DECODING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Encode propertyId and roomTypeId into a single tokenId
     */
    function encodeTokenId(uint256 propertyId, uint256 roomTypeId) public pure returns (uint256) {
        return (propertyId << 128) | roomTypeId;
    }

    /**
     * @notice Decode tokenId into propertyId and roomTypeId
     */
    function decodeTokenId(uint256 tokenId) public pure returns (uint256 propertyId, uint256 roomTypeId) {
        propertyId = tokenId >> 128;
        roomTypeId = tokenId & ((1 << 128) - 1);
    }

    /*//////////////////////////////////////////////////////////////
                        PROPERTY CREATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new property (mints HostSBT if needed)
     * @param ipfsHash IPFS hash containing property metadata
     * @param propertyType Type of property (hotel, villa, apartment, etc.)
     * @param location Location string
     */
    function createProperty(
        string memory ipfsHash,
        string memory propertyType,
        string memory location
    ) external returns (uint256 propertyId) {
        // Auto-mint HostSBT if user doesn't have one
        if (!hostSBT.hasSBT(msg.sender)) {
            // Note: HostSBT must implement auto-mint in its mintSBT function
            // This will be handled in HostSBT update
            revert MustHaveHostSBT();
        }

        uint256 hostTokenId = hostSBT.walletToTokenId(msg.sender);
        propertyId = _propertyIdCounter++;

        properties[propertyId] = Property({
            propertyId: propertyId,
            hostWallet: msg.sender,
            hostSbtTokenId: hostTokenId,
            isActive: true,
            totalBookings: 0,
            averageRating: 0,
            totalReviewsReceived: 0,
            createdAt: block.timestamp,
            lastBookingTimestamp: 0,
            propertyType: propertyType,
            location: location,
            ipfsMetadataHash: ipfsHash
        });

        propertyOwner[propertyId] = msg.sender;

        // Link to HostSBT
        hostSBT.linkProperty(msg.sender, propertyId);

        emit PropertyCreated(propertyId, msg.sender, hostTokenId, ipfsHash);

        return propertyId;
    }

    /**
     * @notice Add a room type to a property (creates ERC1155 tokens)
     * @param propertyId Property ID
     * @param roomTypeName Name of room type ("Standard Room", "Double Room", etc.)
     * @param maxSupply Number of units for this room type
     * @param ipfsHash IPFS hash for room-specific metadata
     */
    function addRoomType(
        uint256 propertyId,
        string memory roomTypeName,
        uint256 maxSupply,
        string memory ipfsHash
    ) external returns (uint256 tokenId) {
        if (propertyOwner[propertyId] != msg.sender) revert NotPropertyOwner();
        if (maxSupply == 0) revert InvalidSupply();

        uint256 roomTypeId = _roomTypeCounter++;
        tokenId = encodeTokenId(propertyId, roomTypeId);

        roomTypes[tokenId] = RoomType({
            tokenId: tokenId,
            name: roomTypeName,
            maxSupply: maxSupply,
            ipfsMetadataHash: ipfsHash,
            isActive: true
        });

        propertyRoomTypes[propertyId].push(tokenId);

        // Mint all units to the property owner
        _mint(msg.sender, tokenId, maxSupply, "");

        emit RoomTypeAdded(propertyId, tokenId, roomTypeName, maxSupply);

        return tokenId;
    }

    /*//////////////////////////////////////////////////////////////
                    PLATFORM-CONTROLLED OWNERSHIP
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Transfer property ownership (platform only)
     * @dev All future bookings automatically go to new owner
     * @param propertyId Property ID
     * @param newOwner New owner address
     */
    function transferPropertyOwnership(uint256 propertyId, address newOwner) external {
        if (msg.sender != platform) revert NotPlatform();
        if (!hostSBT.hasSBT(newOwner)) revert MustHaveHostSBT();

        address oldOwner = propertyOwner[propertyId];
        Property storage prop = properties[propertyId];

        // Update property owner
        propertyOwner[propertyId] = newOwner;
        prop.hostWallet = newOwner;
        prop.hostSbtTokenId = hostSBT.walletToTokenId(newOwner);

        // Transfer all room type tokens
        uint256[] memory tokenIds = propertyRoomTypes[propertyId];
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            uint256 supply = balanceOf(oldOwner, tokenId);

            if (supply > 0) {
                _safeTransferFrom(oldOwner, newOwner, tokenId, supply, "");
            }
        }

        // Update HostSBT links
        hostSBT.unlinkProperty(oldOwner, propertyId);
        hostSBT.linkProperty(newOwner, propertyId);

        emit PropertyOwnershipTransferred(propertyId, oldOwner, newOwner);
    }

    /*//////////////////////////////////////////////////////////////
                        PROPERTY MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Update property metadata
     */
    function updateProperty(uint256 propertyId, string memory newIpfsHash) external {
        if (propertyOwner[propertyId] != msg.sender) revert NotPropertyOwner();

        properties[propertyId].ipfsMetadataHash = newIpfsHash;
    }

    /**
     * @notice Update room type metadata
     */
    function updateRoomType(uint256 tokenId, string memory newIpfsHash) external {
        (uint256 propertyId, ) = decodeTokenId(tokenId);
        if (propertyOwner[propertyId] != msg.sender) revert NotPropertyOwner();

        roomTypes[tokenId].ipfsMetadataHash = newIpfsHash;
    }

    /**
     * @notice Activate/deactivate property
     */
    function setPropertyActive(uint256 propertyId, bool active) external {
        if (propertyOwner[propertyId] != msg.sender) revert NotPropertyOwner();

        properties[propertyId].isActive = active;

        if (active) {
            emit PropertyActivated(propertyId);
        } else {
            emit PropertyDeactivated(propertyId);
        }
    }

    /**
     * @notice Activate/deactivate room type
     */
    function setRoomTypeActive(uint256 tokenId, bool active) external {
        (uint256 propertyId, ) = decodeTokenId(tokenId);
        if (propertyOwner[propertyId] != msg.sender) revert NotPropertyOwner();

        roomTypes[tokenId].isActive = active;

        if (active) {
            emit RoomTypeActivated(tokenId);
        } else {
            emit RoomTypeDeactivated(tokenId);
        }
    }

    /*//////////////////////////////////////////////////////////////
                        AVAILABILITY BITMAP
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set availability for a date range using bitmap
     * @param tokenId Room type token ID
     * @param startDate Start timestamp (must be start of day)
     * @param endDate End timestamp (must be start of day)
     * @param unitsAvailable Number of units available (0 = fully booked)
     */
    function setAvailability(uint256 tokenId, uint256 startDate, uint256 endDate, uint256 unitsAvailable) external {
        (uint256 propertyId, ) = decodeTokenId(tokenId);
        if (propertyOwner[propertyId] != msg.sender) revert NotPropertyOwner();
        if (startDate >= endDate) revert InvalidDateRange();

        RoomType memory roomType = roomTypes[tokenId];
        if (unitsAvailable > roomType.maxSupply) revert InvalidSupply();

        // Store availability per day
        for (uint256 d = startDate; d < endDate; d += 1 days) {
            uint256 daySlot = d / 1 days;
            availabilityBitmap[tokenId][daySlot] = unitsAvailable;
        }

        emit AvailabilityUpdated(tokenId, startDate, endDate, unitsAvailable > 0);
    }

    /**
     * @notice Check if units are available for a date range
     */
    function checkAvailability(
        uint256 tokenId,
        uint256 checkIn,
        uint256 checkOut,
        uint256 unitsNeeded
    ) public view returns (bool) {
        for (uint256 d = checkIn; d < checkOut; d += 1 days) {
            uint256 daySlot = d / 1 days;
            uint256 available = availabilityBitmap[tokenId][daySlot];

            if (available < unitsNeeded) {
                return false;
            }
        }
        return true;
    }

    /*//////////////////////////////////////////////////////////////
                            BOOKING LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Book a room (called by EscrowFactory)
     * @param tokenId Room type token ID
     * @param traveler Traveler address
     * @param checkIn Check-in timestamp
     * @param checkOut Check-out timestamp
     * @param escrowId Reference to escrow contract
     */
    function bookRoom(
        uint256 tokenId,
        address traveler,
        uint256 checkIn,
        uint256 checkOut,
        uint256 escrowId
    ) external returns (uint256) {
        if (msg.sender != escrowFactory) revert NotAuthorized();

        (uint256 propertyId, ) = decodeTokenId(tokenId);
        Property storage prop = properties[propertyId];
        RoomType memory roomType = roomTypes[tokenId];

        if (!prop.isActive) revert PropertyNotActive();
        if (!roomType.isActive) revert RoomTypeNotActive();
        if (checkIn >= checkOut) revert InvalidDateRange();
        if (!checkAvailability(tokenId, checkIn, checkOut, 1)) revert DatesNotAvailable();

        // Create booking
        Booking memory newBooking = Booking({
            tokenId: tokenId,
            traveler: traveler,
            checkIn: checkIn,
            checkOut: checkOut,
            escrowId: escrowId,
            status: BookingStatus.Pending,
            createdAt: block.timestamp
        });

        tokenBookings[tokenId].push(newBooking);
        uint256 bookingIndex = tokenBookings[tokenId].length - 1;

        // Decrease availability
        for (uint256 d = checkIn; d < checkOut; d += 1 days) {
            uint256 daySlot = d / 1 days;
            availabilityBitmap[tokenId][daySlot]--;
        }

        prop.totalBookings++;
        prop.lastBookingTimestamp = block.timestamp;

        emit PropertyBooked(tokenId, traveler, checkIn, checkOut, escrowId);

        return bookingIndex;
    }

    /**
     * @notice Confirm a booking
     */
    function confirmBooking(uint256 tokenId, uint256 bookingIndex) external {
        (uint256 propertyId, ) = decodeTokenId(tokenId);

        if (msg.sender != propertyOwner[propertyId] && msg.sender != escrowFactory) {
            revert NotAuthorized();
        }

        tokenBookings[tokenId][bookingIndex].status = BookingStatus.Confirmed;
    }

    /**
     * @notice Complete a booking
     */
    function completeBooking(uint256 tokenId, uint256 bookingIndex) external {
        if (msg.sender != escrowFactory && msg.sender != reviewRegistry) {
            revert NotAuthorized();
        }

        tokenBookings[tokenId][bookingIndex].status = BookingStatus.Completed;

        emit BookingCompleted(tokenId, bookingIndex);
    }

    /**
     * @notice Cancel a booking
     */
    function cancelBooking(uint256 tokenId, uint256 bookingIndex) external {
        Booking storage booking = tokenBookings[tokenId][bookingIndex];
        (uint256 propertyId, ) = decodeTokenId(tokenId);

        if (msg.sender != booking.traveler && msg.sender != propertyOwner[propertyId] && msg.sender != escrowFactory) {
            revert NotAuthorized();
        }

        booking.status = BookingStatus.Cancelled;

        // Restore availability
        for (uint256 d = booking.checkIn; d < booking.checkOut; d += 1 days) {
            uint256 daySlot = d / 1 days;
            availabilityBitmap[tokenId][daySlot]++;
        }

        emit BookingCancelled(tokenId, bookingIndex);
    }

    /*//////////////////////////////////////////////////////////////
                            RATING LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Update property rating (called by ReviewRegistry)
     */
    function updatePropertyRating(uint256 propertyId, uint8 rating) external {
        if (msg.sender != reviewRegistry) revert NotAuthorized();
        if (rating < 1 || rating > 5) revert InvalidRating();

        Property storage prop = properties[propertyId];

        uint256 oldTotal = prop.totalReviewsReceived;
        prop.totalReviewsReceived++;

        if (oldTotal == 0) {
            prop.averageRating = uint256(rating) * 100;
        } else {
            uint256 totalRatingPoints = prop.averageRating * oldTotal;
            prop.averageRating = (totalRatingPoints + (uint256(rating) * 100)) / prop.totalReviewsReceived;
        }

        emit PropertyRated(propertyId, rating, prop.averageRating);
    }

    /*//////////////////////////////////////////////////////////////
                        TRANSFER OVERRIDE
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Disable regular transfers (only platform can transfer via transferPropertyOwnership)
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public virtual override {
        // Only allow platform-controlled transfers
        if (msg.sender != platform) revert NotPlatform();

        super.safeTransferFrom(from, to, id, value, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) public virtual override {
        // Only allow platform-controlled transfers
        if (msg.sender != platform) revert NotPlatform();

        super.safeBatchTransferFrom(from, to, ids, values, data);
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setPlatform(address _platform) external onlyOwner {
        platform = _platform;
    }

    function setEscrowFactory(address _escrowFactory) external onlyOwner {
        escrowFactory = _escrowFactory;
    }

    function setReviewRegistry(address _reviewRegistry) external onlyOwner {
        reviewRegistry = _reviewRegistry;
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getProperty(uint256 propertyId) external view returns (Property memory) {
        return properties[propertyId];
    }

    function getRoomType(uint256 tokenId) external view returns (RoomType memory) {
        return roomTypes[tokenId];
    }

    function getPropertyRoomTypes(uint256 propertyId) external view returns (uint256[] memory) {
        return propertyRoomTypes[propertyId];
    }

    function getBookings(uint256 tokenId) external view returns (Booking[] memory) {
        return tokenBookings[tokenId];
    }

    function getBooking(uint256 tokenId, uint256 bookingIndex) external view returns (Booking memory) {
        if (bookingIndex >= tokenBookings[tokenId].length) revert BookingNotFound();
        return tokenBookings[tokenId][bookingIndex];
    }

    function getPropertiesByHost(address host) external view returns (uint256[] memory) {
        uint256 count = 0;

        // Count properties owned by host
        for (uint256 i = 1; i < _propertyIdCounter; i++) {
            if (propertyOwner[i] == host) {
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 1; i < _propertyIdCounter; i++) {
            if (propertyOwner[i] == host) {
                result[index] = i;
                index++;
            }
        }

        return result;
    }

    function totalProperties() external view returns (uint256) {
        return _propertyIdCounter - 1;
    }

    /*//////////////////////////////////////////////////////////////
                        URI OVERRIDE
    //////////////////////////////////////////////////////////////*/

    function uri(uint256 tokenId) public view override returns (string memory) {
        (uint256 propertyId, ) = decodeTokenId(tokenId);

        // If roomTypeId exists, return room-specific metadata
        if (roomTypes[tokenId].tokenId == tokenId) {
            return roomTypes[tokenId].ipfsMetadataHash;
        }

        // Otherwise return property-level metadata
        return properties[propertyId].ipfsMetadataHash;
    }
}
