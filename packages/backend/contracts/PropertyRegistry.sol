// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IHostSBT.sol";
import "./libraries/PropertyTypes.sol";

/**
 * @title PropertyRegistry
 * @notice Central registry for properties - tracks ownership and property data
 * @dev Lightweight contract (~8-10KB) - just property storage and ownership
 */
contract PropertyRegistry is Ownable {
    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    mapping(uint256 => PropertyTypes.Property) public properties;
    mapping(uint256 => address) public propertyOwner;
    uint256 private _propertyIdCounter = 1;

    IHostSBT public hostSBT;
    address public platform;
    address public roomTypeNFT;
    address public bookingManager;
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
    event PropertyActivated(uint256 indexed propertyId);
    event PropertyDeactivated(uint256 indexed propertyId);
    event PropertyOwnershipTransferred(uint256 indexed propertyId, address indexed oldOwner, address indexed newOwner);
    event PropertyRated(uint256 indexed propertyId, uint8 rating, uint256 newAverageRating);
    event PropertyMetadataUpdated(uint256 indexed propertyId, string oldIpfsHash, string newIpfsHash);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error MustHaveHostSBT();
    error NotPropertyOwner();
    error NotPlatform();
    error NotAuthorized();
    error InvalidAddress();
    error InvalidRating();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _hostSBT, address _platform) Ownable(msg.sender) {
        hostSBT = IHostSBT(_hostSBT);
        platform = _platform;
    }

    /*//////////////////////////////////////////////////////////////
                        PROPERTY CREATION
    //////////////////////////////////////////////////////////////*/

    function createProperty(
        string memory ipfsHash,
        string memory propertyType,
        string memory location
    ) external returns (uint256 propertyId) {
        if (!hostSBT.hasSBT(msg.sender)) revert MustHaveHostSBT();

        uint256 hostTokenId = hostSBT.walletToTokenId(msg.sender);
        propertyId = _propertyIdCounter++;

        properties[propertyId] = PropertyTypes.Property({
            propertyId: propertyId,
            hostWallet: msg.sender,
            hostSbtTokenId: hostTokenId,
            ipfsMetadataHash: ipfsHash,
            propertyType: propertyType,
            location: location,
            isActive: true,
            totalBookings: 0,
            totalReviewsReceived: 0,
            averageRating: 0,
            createdAt: block.timestamp,
            lastBookingTimestamp: 0
        });

        propertyOwner[propertyId] = msg.sender;

        hostSBT.linkProperty(msg.sender, propertyId);

        emit PropertyCreated(propertyId, msg.sender, hostTokenId, ipfsHash);
    }

    /*//////////////////////////////////////////////////////////////
                        PROPERTY MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function setPropertyActive(uint256 propertyId, bool active) external {
        if (propertyOwner[propertyId] != msg.sender) revert NotPropertyOwner();
        properties[propertyId].isActive = active;
        if (active) emit PropertyActivated(propertyId);
        else emit PropertyDeactivated(propertyId);
    }

    /**
     * @notice Update property metadata IPFS hash
     * @param propertyId The property ID
     * @param newIpfsHash The new IPFS metadata hash
     */
    function updatePropertyMetadata(uint256 propertyId, string memory newIpfsHash) external {
        if (propertyOwner[propertyId] != msg.sender) revert NotPropertyOwner();

        string memory oldIpfsHash = properties[propertyId].ipfsMetadataHash;
        properties[propertyId].ipfsMetadataHash = newIpfsHash;

        emit PropertyMetadataUpdated(propertyId, oldIpfsHash, newIpfsHash);
    }

    function transferPropertyOwnership(uint256 propertyId, address newOwner) external {
        if (msg.sender != platform) revert NotPlatform();
        if (!hostSBT.hasSBT(newOwner)) revert MustHaveHostSBT();

        address oldOwner = propertyOwner[propertyId];
        PropertyTypes.Property storage prop = properties[propertyId];

        propertyOwner[propertyId] = newOwner;
        prop.hostWallet = newOwner;
        prop.hostSbtTokenId = hostSBT.walletToTokenId(newOwner);

        hostSBT.unlinkProperty(oldOwner, propertyId);
        hostSBT.linkProperty(newOwner, propertyId);

        emit PropertyOwnershipTransferred(propertyId, oldOwner, newOwner);
    }

    /*//////////////////////////////////////////////////////////////
                        BOOKING UPDATES
    //////////////////////////////////////////////////////////////*/

    function incrementBookingCount(uint256 propertyId) external {
        if (msg.sender != bookingManager) revert NotAuthorized();
        PropertyTypes.Property storage prop = properties[propertyId];
        prop.totalBookings++;
        prop.lastBookingTimestamp = block.timestamp;
    }

    /*//////////////////////////////////////////////////////////////
                        RATING UPDATES
    //////////////////////////////////////////////////////////////*/

    function updatePropertyRating(uint256 propertyId, uint8 rating) external {
        if (msg.sender != reviewRegistry) revert NotAuthorized();
        if (rating < 1 || rating > 5) revert InvalidRating();

        PropertyTypes.Property storage prop = properties[propertyId];
        uint256 oldTotal = prop.totalReviewsReceived++;

        prop.averageRating = oldTotal == 0
            ? uint256(rating) * 100
            : (prop.averageRating * oldTotal + uint256(rating) * 100) / prop.totalReviewsReceived;

        emit PropertyRated(propertyId, rating, prop.averageRating);
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setPlatform(address _platform) external onlyOwner {
        if (_platform == address(0)) revert InvalidAddress();
        platform = _platform;
    }

    function setRoomTypeNFT(address _roomTypeNFT) external onlyOwner {
        if (_roomTypeNFT == address(0)) revert InvalidAddress();
        roomTypeNFT = _roomTypeNFT;
    }

    function setBookingManager(address _bookingManager) external onlyOwner {
        if (_bookingManager == address(0)) revert InvalidAddress();
        bookingManager = _bookingManager;
    }

    function setReviewRegistry(address _reviewRegistry) external onlyOwner {
        if (_reviewRegistry == address(0)) revert InvalidAddress();
        reviewRegistry = _reviewRegistry;
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function isPropertyOwner(uint256 propertyId, address account) external view returns (bool) {
        return propertyOwner[propertyId] == account;
    }

    function getProperty(uint256 propertyId) external view returns (PropertyTypes.Property memory) {
        return properties[propertyId];
    }

    function totalProperties() external view returns (uint256) {
        return _propertyIdCounter - 1;
    }
}
