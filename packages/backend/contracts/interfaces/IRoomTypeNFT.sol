// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../libraries/PropertyTypes.sol";

interface IRoomTypeNFT {
    function getRoomType(uint256 tokenId) external view returns (PropertyTypes.RoomType memory);
    function getPropertyRoomTypes(uint256 propertyId) external view returns (uint256[] memory);
    function encodeTokenId(uint256 propertyId, uint256 roomTypeId) external pure returns (uint256);
    function decodeTokenId(uint256 tokenId) external pure returns (uint256 propertyId, uint256 roomTypeId);
    function propertyRegistry() external view returns (address);
}
