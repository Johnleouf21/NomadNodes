// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAvailabilityManager {
    function setAvailability(
        uint256 tokenId,
        uint256 unitIndex,
        uint256 startDate,
        uint256 endDate,
        bool available
    ) external;

    function isRoomAvailable(
        uint256 tokenId,
        uint256 unitIndex,
        uint256 startDate,
        uint256 endDate
    ) external view returns (bool);

    function getAvailableUnits(uint256 tokenId, uint256 startDate, uint256 endDate) external view returns (uint256);

    function checkAvailability(uint256 tokenId, uint256 startDate, uint256 endDate) external view returns (bool);
}
