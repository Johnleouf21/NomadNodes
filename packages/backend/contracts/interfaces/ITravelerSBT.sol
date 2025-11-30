// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ITravelerSBT
 * @notice Interface for TravelerSBT contract
 */
interface ITravelerSBT {
    function hasSBT(address wallet) external view returns (bool);
    function walletToTokenId(address wallet) external view returns (uint256);
    function linkBooking(address traveler, uint256 tokenId, uint256 bookingIndex) external;
    function updateReputation(address traveler, uint8 rating, bool cancelled) external;
}
