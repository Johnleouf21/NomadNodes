// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../libraries/PropertyTypes.sol";

interface IPropertyRegistry {
    function isPropertyOwner(uint256 propertyId, address account) external view returns (bool);
    function propertyOwner(uint256 propertyId) external view returns (address);
    function getProperty(uint256 propertyId) external view returns (PropertyTypes.Property memory);
    function totalProperties() external view returns (uint256);
    function incrementBookingCount(uint256 propertyId) external;
    function updatePropertyRating(uint256 propertyId, uint8 rating) external;
}
