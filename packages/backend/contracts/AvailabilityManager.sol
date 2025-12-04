// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IRoomTypeNFT.sol";

/**
 * @title AvailabilityManager
 * @notice Manages room availability using bitmap for efficient storage
 * @dev Uses uint256 bitmap to store 256 days of availability per chunk
 */
contract AvailabilityManager is Ownable {
    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    IRoomTypeNFT public roomTypeNFT;
    address public bookingManager;

    // tokenId => unitIndex => startDate => bitmap (256 days per uint256)
    mapping(uint256 => mapping(uint256 => mapping(uint256 => uint256))) private availability;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event AvailabilitySet(
        uint256 indexed tokenId,
        uint256 indexed unitIndex,
        uint256 startDate,
        uint256 endDate,
        bool available
    );

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error NotPropertyOwner();
    error NotBookingManager();
    error InvalidAddress();
    error InvalidDateRange();
    error InvalidUnitIndex();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _roomTypeNFT) Ownable(msg.sender) {
        roomTypeNFT = IRoomTypeNFT(_roomTypeNFT);
    }

    /*//////////////////////////////////////////////////////////////
                        AVAILABILITY MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set availability for multiple units over a date range
     * @param tokenId The room type token ID
     * @param numUnitsAvailable Number of units to mark as available (0 to totalSupply)
     * @param startDate Unix timestamp for start date
     * @param endDate Unix timestamp for end date
     * @dev Sets units 0 to numUnitsAvailable-1 as available, rest as unavailable
     */
    function setBulkAvailability(
        uint256 tokenId,
        uint256 numUnitsAvailable,
        uint256 startDate,
        uint256 endDate
    ) external {
        (uint256 propertyId, ) = roomTypeNFT.decodeTokenId(tokenId);

        // Only property owner can set bulk availability
        (bool success, bytes memory data) = address(roomTypeNFT).staticcall(
            abi.encodeWithSignature("propertyRegistry()")
        );
        require(success, "Failed to get property registry");
        address propertyRegistry = abi.decode(data, (address));

        (success, data) = propertyRegistry.staticcall(
            abi.encodeWithSignature("isPropertyOwner(uint256,address)", propertyId, msg.sender)
        );
        require(success && abi.decode(data, (bool)), "Not property owner");

        if (startDate >= endDate) revert InvalidDateRange();

        // Get total supply from RoomTypeNFT
        (success, data) = address(roomTypeNFT).staticcall(abi.encodeWithSignature("getRoomType(uint256)", tokenId));
        require(success, "Failed to get room type");

        uint256 totalSupply;
        assembly {
            totalSupply := mload(add(data, 256))
        }

        require(numUnitsAvailable <= totalSupply, "Exceeds total supply");

        // Normalize to start of day
        startDate = (startDate / 1 days) * 1 days;
        endDate = (endDate / 1 days) * 1 days;

        // Set availability for each unit
        for (uint256 i = 0; i < totalSupply; i++) {
            bool available = i < numUnitsAvailable;
            uint256 currentDate = startDate;
            while (currentDate < endDate) {
                _setDayAvailability(tokenId, i, currentDate, available);
                currentDate += 1 days;
            }
            emit AvailabilitySet(tokenId, i, startDate, endDate, available);
        }
    }

    /**
     * @notice Set availability for a specific room unit over a date range
     * @param tokenId The room type token ID
     * @param unitIndex The specific unit (0 to totalSupply-1)
     * @param startDate Unix timestamp for start date
     * @param endDate Unix timestamp for end date
     * @param available True to mark as available, false to mark as booked
     */
    function setAvailability(
        uint256 tokenId,
        uint256 unitIndex,
        uint256 startDate,
        uint256 endDate,
        bool available
    ) external {
        (uint256 propertyId, ) = roomTypeNFT.decodeTokenId(tokenId);

        // Only property owner or booking manager can set availability
        if (msg.sender != bookingManager) {
            (bool success, bytes memory data) = address(roomTypeNFT).staticcall(
                abi.encodeWithSignature("propertyRegistry()")
            );
            require(success, "Failed to get property registry");
            address propertyRegistry = abi.decode(data, (address));

            (success, data) = propertyRegistry.staticcall(
                abi.encodeWithSignature("isPropertyOwner(uint256,address)", propertyId, msg.sender)
            );
            require(success && abi.decode(data, (bool)), "Not property owner");
        }

        if (startDate >= endDate) revert InvalidDateRange();

        // Normalize to start of day
        startDate = (startDate / 1 days) * 1 days;
        endDate = (endDate / 1 days) * 1 days;

        uint256 currentDate = startDate;
        while (currentDate < endDate) {
            _setDayAvailability(tokenId, unitIndex, currentDate, available);
            currentDate += 1 days;
        }

        emit AvailabilitySet(tokenId, unitIndex, startDate, endDate, available);
    }

    /**
     * @notice Check if a room unit is available for a date range
     * @param tokenId The room type token ID
     * @param unitIndex The specific unit index
     * @param startDate Unix timestamp for check-in
     * @param endDate Unix timestamp for check-out
     * @return bool True if available for entire period
     */
    function isRoomAvailable(
        uint256 tokenId,
        uint256 unitIndex,
        uint256 startDate,
        uint256 endDate
    ) external view returns (bool) {
        if (startDate >= endDate) return false;

        // Normalize to start of day
        startDate = (startDate / 1 days) * 1 days;
        endDate = (endDate / 1 days) * 1 days;

        uint256 currentDate = startDate;
        while (currentDate < endDate) {
            if (!_isDayAvailable(tokenId, unitIndex, currentDate)) {
                return false;
            }
            currentDate += 1 days;
        }
        return true;
    }

    /**
     * @notice Check availability across all units and return number of available units
     * @param tokenId The room type token ID
     * @param startDate Unix timestamp for check-in
     * @param endDate Unix timestamp for check-out
     * @return uint256 Number of units available
     */
    function getAvailableUnits(uint256 tokenId, uint256 startDate, uint256 endDate) external view returns (uint256) {
        if (startDate >= endDate) return 0;

        // Get total supply from RoomTypeNFT
        (bool success, bytes memory data) = address(roomTypeNFT).staticcall(
            abi.encodeWithSignature("getRoomType(uint256)", tokenId)
        );
        if (!success) return 0;

        // Decode RoomType struct - totalSupply is at position 7
        uint256 totalSupply;
        assembly {
            // Skip 32 bytes (length) + 7*32 bytes (first 7 fields) = 256 bytes
            totalSupply := mload(add(data, 256))
        }

        uint256 availableCount = 0;
        for (uint256 i = 0; i < totalSupply; i++) {
            bool isAvailable = true;
            uint256 currentDate = (startDate / 1 days) * 1 days;
            uint256 normalizedEndDate = (endDate / 1 days) * 1 days;

            while (currentDate < normalizedEndDate) {
                if (!_isDayAvailable(tokenId, i, currentDate)) {
                    isAvailable = false;
                    break;
                }
                currentDate += 1 days;
            }

            if (isAvailable) {
                availableCount++;
            }
        }

        return availableCount;
    }

    /**
     * @notice Check if ANY unit is available for the date range
     * @param tokenId The room type token ID
     * @param startDate Unix timestamp for check-in
     * @param endDate Unix timestamp for check-out
     * @return bool True if at least one unit is available
     */
    function checkAvailability(uint256 tokenId, uint256 startDate, uint256 endDate) external view returns (bool) {
        if (startDate >= endDate) return false;

        // Get total supply from RoomTypeNFT
        (bool success, bytes memory data) = address(roomTypeNFT).staticcall(
            abi.encodeWithSignature("getRoomType(uint256)", tokenId)
        );
        if (!success) return false;

        // Decode totalSupply from RoomType struct
        uint256 totalSupply;
        assembly {
            totalSupply := mload(add(data, 256))
        }

        // Normalize dates
        uint256 normalizedStart = (startDate / 1 days) * 1 days;
        uint256 normalizedEnd = (endDate / 1 days) * 1 days;

        // Check each unit
        for (uint256 i = 0; i < totalSupply; i++) {
            bool isAvailable = true;
            uint256 currentDate = normalizedStart;

            while (currentDate < normalizedEnd) {
                if (!_isDayAvailable(tokenId, i, currentDate)) {
                    isAvailable = false;
                    break;
                }
                currentDate += 1 days;
            }

            if (isAvailable) {
                return true;
            }
        }

        return false;
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set availability for a specific day
     * @dev Uses bitmap storage: each uint256 stores 256 days
     */
    function _setDayAvailability(uint256 tokenId, uint256 unitIndex, uint256 date, bool available) internal {
        uint256 dayIndex = date / 1 days;
        uint256 chunkIndex = dayIndex / 256;
        uint256 bitPosition = dayIndex % 256;

        uint256 chunk = availability[tokenId][unitIndex][chunkIndex];

        if (available) {
            // Set bit to 1 (available)
            chunk |= (1 << bitPosition);
        } else {
            // Set bit to 0 (unavailable)
            chunk &= ~(1 << bitPosition);
        }

        availability[tokenId][unitIndex][chunkIndex] = chunk;
    }

    /**
     * @notice Check if a specific day is available
     * @dev Reads from bitmap storage
     * @dev Rooms are UNAVAILABLE by default until explicitly set as available
     */
    function _isDayAvailable(uint256 tokenId, uint256 unitIndex, uint256 date) internal view returns (bool) {
        uint256 dayIndex = date / 1 days;
        uint256 chunkIndex = dayIndex / 256;
        uint256 bitPosition = dayIndex % 256;

        uint256 chunk = availability[tokenId][unitIndex][chunkIndex];

        // Check if bit is set (1 = available, 0 = unavailable)
        // Uninitialized bits (0) are treated as unavailable
        return (chunk & (1 << bitPosition)) != 0;
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setBookingManager(address _bookingManager) external onlyOwner {
        if (_bookingManager == address(0)) revert InvalidAddress();
        bookingManager = _bookingManager;
    }

    function setRoomTypeNFT(address _roomTypeNFT) external onlyOwner {
        if (_roomTypeNFT == address(0)) revert InvalidAddress();
        roomTypeNFT = IRoomTypeNFT(_roomTypeNFT);
    }
}
