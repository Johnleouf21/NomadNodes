// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPropertyRegistry.sol";
import "./libraries/PropertyTypes.sol";

/**
 * @title RoomTypeNFT
 * @notice ERC1155 for room types - each token represents units of a specific room type
 * @dev Token ID = (propertyId << 128) | roomTypeId
 */
contract RoomTypeNFT is ERC1155, Ownable {
    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    IPropertyRegistry public propertyRegistry;
    address public availabilityManager;
    address public bookingManager;

    mapping(uint256 => PropertyTypes.RoomType) public roomTypes;
    mapping(uint256 => uint256[]) public propertyRoomTypes; // propertyId => roomTypeIds[]
    mapping(uint256 => uint256) private _roomTypeIdCounter; // propertyId => next roomTypeId

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event RoomTypeAdded(
        uint256 indexed propertyId,
        uint256 indexed roomTypeId,
        uint256 indexed tokenId,
        string name,
        string ipfsHash,
        uint256 pricePerNight,
        uint256 maxSupply
    );
    event RoomTypeUpdated(uint256 indexed tokenId, uint256 pricePerNight, uint256 cleaningFee);
    event RoomTypeMetadataUpdated(uint256 indexed tokenId, string ipfsHash);
    event RoomTypeSupplyIncreased(uint256 indexed tokenId, uint256 oldSupply, uint256 newSupply);
    event RoomTypeDeleted(uint256 indexed tokenId);
    event RoomTypeActivated(uint256 indexed tokenId);
    event RoomTypeDeactivated(uint256 indexed tokenId);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error NotPropertyOwner();
    error NotAuthorized();
    error InvalidAddress();
    error InvalidTokenId();
    error InvalidSupply();
    error RoomTypeNotFound();
    error CannotReduceSupply();
    error HasActiveBookings();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _propertyRegistry) ERC1155("") Ownable(msg.sender) {
        propertyRegistry = IPropertyRegistry(_propertyRegistry);
    }

    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyPropertyOwner(uint256 propertyId) {
        if (!propertyRegistry.isPropertyOwner(propertyId, msg.sender)) revert NotPropertyOwner();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                        ROOM TYPE MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function addRoomType(
        uint256 propertyId,
        string memory name,
        string memory ipfsHash,
        uint256 pricePerNight,
        uint256 cleaningFee,
        uint256 maxGuests,
        uint256 maxSupply
    ) external onlyPropertyOwner(propertyId) returns (uint256 tokenId) {
        if (maxSupply == 0) revert InvalidSupply();

        uint256 roomTypeId = ++_roomTypeIdCounter[propertyId];
        tokenId = encodeTokenId(propertyId, roomTypeId);

        roomTypes[tokenId] = PropertyTypes.RoomType({
            roomTypeId: roomTypeId,
            propertyId: propertyId,
            name: name,
            ipfsMetadataHash: ipfsHash,
            pricePerNight: pricePerNight,
            cleaningFee: cleaningFee,
            maxGuests: maxGuests,
            totalSupply: maxSupply,
            isActive: true
        });

        propertyRoomTypes[propertyId].push(roomTypeId);

        // Mint initial supply to property owner
        address owner = propertyRegistry.propertyOwner(propertyId);
        _mint(owner, tokenId, maxSupply, "");

        emit RoomTypeAdded(propertyId, roomTypeId, tokenId, name, ipfsHash, pricePerNight, maxSupply);
    }

    function updateRoomTypeSettings(uint256 tokenId, uint256 pricePerNight, uint256 cleaningFee) external {
        (uint256 propertyId, ) = decodeTokenId(tokenId);
        if (!propertyRegistry.isPropertyOwner(propertyId, msg.sender)) revert NotPropertyOwner();
        if (roomTypes[tokenId].roomTypeId == 0) revert RoomTypeNotFound();

        PropertyTypes.RoomType storage roomType = roomTypes[tokenId];
        roomType.pricePerNight = pricePerNight;
        roomType.cleaningFee = cleaningFee;

        emit RoomTypeUpdated(tokenId, pricePerNight, cleaningFee);
    }

    function updateRoomTypeMetadata(uint256 tokenId, string memory ipfsHash) external {
        (uint256 propertyId, ) = decodeTokenId(tokenId);
        if (!propertyRegistry.isPropertyOwner(propertyId, msg.sender)) revert NotPropertyOwner();
        if (roomTypes[tokenId].roomTypeId == 0) revert RoomTypeNotFound();

        roomTypes[tokenId].ipfsMetadataHash = ipfsHash;

        emit RoomTypeMetadataUpdated(tokenId, ipfsHash);
    }

    function updateRoomTypeSupply(uint256 tokenId, uint256 newSupply) external {
        (uint256 propertyId, ) = decodeTokenId(tokenId);
        if (!propertyRegistry.isPropertyOwner(propertyId, msg.sender)) revert NotPropertyOwner();
        if (roomTypes[tokenId].roomTypeId == 0) revert RoomTypeNotFound();

        PropertyTypes.RoomType storage roomType = roomTypes[tokenId];
        uint256 oldSupply = roomType.totalSupply;

        if (newSupply < oldSupply) revert CannotReduceSupply();
        if (newSupply == oldSupply) return;

        uint256 additionalSupply = newSupply - oldSupply;
        roomType.totalSupply = newSupply;

        // Mint additional supply to property owner
        address owner = propertyRegistry.propertyOwner(propertyId);
        _mint(owner, tokenId, additionalSupply, "");

        emit RoomTypeSupplyIncreased(tokenId, oldSupply, newSupply);
    }

    function deleteRoomType(uint256 tokenId) external {
        (uint256 propertyId, uint256 roomTypeId) = decodeTokenId(tokenId);
        if (!propertyRegistry.isPropertyOwner(propertyId, msg.sender)) revert NotPropertyOwner();
        if (roomTypes[tokenId].roomTypeId == 0) revert RoomTypeNotFound();

        // Check no active bookings via BookingManager
        if (bookingManager != address(0)) {
            // BookingManager should implement hasActiveBookings(uint256 tokenId)
            (bool success, bytes memory data) = bookingManager.staticcall(
                abi.encodeWithSignature("hasActiveBookings(uint256)", tokenId)
            );
            if (success && data.length > 0 && abi.decode(data, (bool))) {
                revert HasActiveBookings();
            }
        }

        // Remove from propertyRoomTypes array
        uint256[] storage roomTypeIds = propertyRoomTypes[propertyId];
        for (uint256 i = 0; i < roomTypeIds.length; i++) {
            if (roomTypeIds[i] == roomTypeId) {
                roomTypeIds[i] = roomTypeIds[roomTypeIds.length - 1];
                roomTypeIds.pop();
                break;
            }
        }

        delete roomTypes[tokenId];
        emit RoomTypeDeleted(tokenId);
    }

    function setRoomTypeActive(uint256 tokenId, bool active) external {
        (uint256 propertyId, ) = decodeTokenId(tokenId);
        if (!propertyRegistry.isPropertyOwner(propertyId, msg.sender)) revert NotPropertyOwner();
        if (roomTypes[tokenId].roomTypeId == 0) revert RoomTypeNotFound();

        roomTypes[tokenId].isActive = active;
        if (active) emit RoomTypeActivated(tokenId);
        else emit RoomTypeDeactivated(tokenId);
    }

    /*//////////////////////////////////////////////////////////////
                        TOKEN ID ENCODING
    //////////////////////////////////////////////////////////////*/

    function encodeTokenId(uint256 propertyId, uint256 roomTypeId) public pure returns (uint256) {
        return (propertyId << 128) | roomTypeId;
    }

    function decodeTokenId(uint256 tokenId) public pure returns (uint256 propertyId, uint256 roomTypeId) {
        propertyId = tokenId >> 128;
        roomTypeId = tokenId & ((1 << 128) - 1);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getRoomType(uint256 tokenId) external view returns (PropertyTypes.RoomType memory) {
        if (roomTypes[tokenId].roomTypeId == 0) revert RoomTypeNotFound();
        return roomTypes[tokenId];
    }

    function getPropertyRoomTypes(uint256 propertyId) external view returns (uint256[] memory tokenIds) {
        uint256[] memory roomTypeIds = propertyRoomTypes[propertyId];
        tokenIds = new uint256[](roomTypeIds.length);
        for (uint256 i = 0; i < roomTypeIds.length; i++) {
            tokenIds[i] = encodeTokenId(propertyId, roomTypeIds[i]);
        }
    }

    /*//////////////////////////////////////////////////////////////
                        ERC1155 METADATA
    //////////////////////////////////////////////////////////////*/

    function uri(uint256 tokenId) public view override returns (string memory) {
        PropertyTypes.RoomType memory roomType = roomTypes[tokenId];
        if (roomType.roomTypeId == 0) revert InvalidTokenId();

        // Get property IPFS hash from PropertyRegistry
        PropertyTypes.Property memory property = propertyRegistry.getProperty(roomType.propertyId);

        return string(abi.encodePacked("ipfs://", property.ipfsMetadataHash, "/", roomType.ipfsMetadataHash));
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setAvailabilityManager(address _availabilityManager) external onlyOwner {
        if (_availabilityManager == address(0)) revert InvalidAddress();
        availabilityManager = _availabilityManager;
    }

    function setBookingManager(address _bookingManager) external onlyOwner {
        if (_bookingManager == address(0)) revert InvalidAddress();
        bookingManager = _bookingManager;
    }

    function setPropertyRegistry(address _propertyRegistry) external onlyOwner {
        if (_propertyRegistry == address(0)) revert InvalidAddress();
        propertyRegistry = IPropertyRegistry(_propertyRegistry);
    }
}
