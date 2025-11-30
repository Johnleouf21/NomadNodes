// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockBookingManagerWithActiveBookings {
    function hasActiveBookings(uint256) external pure returns (bool) {
        return true;
    }
}
