// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IHostSBT
 * @notice Interface for HostSBT contract
 */
interface IHostSBT {
    function walletToTokenId(address wallet) external view returns (uint256);
    function hasSBT(address wallet) external view returns (bool);
    function linkProperty(address host, uint256 propertyId) external;
    function unlinkProperty(address host, uint256 propertyId) external;
    function incrementBookingReceived(address host) external;
    function incrementCompletedBooking(address host) external;
    function recordCancellation(address host) external;
    function updateReputation(address host, uint8 rating, uint256 responseTime) external;
}
