// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title QuoteVerifier
 * @notice Library for verifying off-chain pricing quotes signed by backend
 * @dev Uses ECDSA signature verification with EIP-191 format
 */
library QuoteVerifier {
    using MessageHashUtils for bytes32;

    /**
     * @notice Verify single room booking quote signature
     * @param tokenId PropertyNFT token ID
     * @param checkIn Check-in timestamp
     * @param checkOut Check-out timestamp
     * @param price Total price in selected currency
     * @param currency USDC or EURC address
     * @param validUntil Quote expiry timestamp
     * @param quantity Number of room units to book
     * @param signature Backend signature
     * @param backendSigner Expected signer address
     * @param contractAddress EscrowFactory contract address (for replay protection)
     * @return bool True if signature is valid
     */
    function verifyQuote(
        uint256 tokenId,
        uint256 checkIn,
        uint256 checkOut,
        uint256 price,
        address currency,
        uint256 validUntil,
        uint256 quantity,
        bytes memory signature,
        address backendSigner,
        address contractAddress
    ) internal view returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                tokenId,
                checkIn,
                checkOut,
                price,
                currency,
                validUntil,
                quantity,
                block.chainid, // Chain ID for replay protection
                contractAddress // Contract address for extra security
            )
        );

        address signer = ECDSA.recover(messageHash.toEthSignedMessageHash(), signature);
        return signer == backendSigner;
    }

    /**
     * @notice Verify batch booking quote signature
     * @param roomsHash Keccak256 hash of all RoomBooking structs
     * @param checkIn Check-in timestamp
     * @param checkOut Check-out timestamp
     * @param totalPrice Total price for all rooms
     * @param currency USDC or EURC address
     * @param validUntil Quote expiry timestamp
     * @param signature Backend signature
     * @param backendSigner Expected signer address
     * @param contractAddress EscrowFactory contract address (for replay protection)
     * @return bool True if signature is valid
     */
    function verifyBatchQuote(
        bytes32 roomsHash,
        uint256 checkIn,
        uint256 checkOut,
        uint256 totalPrice,
        address currency,
        uint256 validUntil,
        bytes memory signature,
        address backendSigner,
        address contractAddress
    ) internal view returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                roomsHash,
                checkIn,
                checkOut,
                totalPrice,
                currency,
                validUntil,
                block.chainid, // Chain ID for replay protection
                contractAddress // Contract address for extra security
            )
        );

        address signer = ECDSA.recover(messageHash.toEthSignedMessageHash(), signature);
        return signer == backendSigner;
    }

    /**
     * @notice Hash array of RoomBooking structs for batch verification
     * @dev Creates deterministic hash of room bookings for signature verification
     * @param tokenIds Array of token IDs
     * @param quantities Array of quantities
     * @param prices Array of prices
     * @return bytes32 Hash of all room bookings
     */
    function hashRoomBookings(
        uint256[] memory tokenIds,
        uint256[] memory quantities,
        uint256[] memory prices
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(tokenIds, quantities, prices));
    }
}
