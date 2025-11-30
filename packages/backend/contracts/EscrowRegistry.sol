// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EscrowRegistry
 * @notice Registry for all escrow addresses and mappings
 * @dev Separates storage from EscrowFactory to reduce contract size
 */
contract EscrowRegistry is Ownable {
    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    mapping(uint256 => address) public escrows; // escrowId => escrow address
    mapping(address => uint256[]) private userEscrowIds; // user => escrow IDs
    mapping(uint256 => uint256[]) public batchEscrows; // batchId => escrow IDs
    mapping(uint256 => uint256) public escrowToBatch; // escrowId => batchId

    uint256 public escrowCount;
    uint256 public batchCount;

    address public escrowFactory;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event EscrowRegistered(
        uint256 indexed escrowId,
        address indexed escrowAddress,
        address indexed traveler,
        address host
    );
    event BatchCreated(uint256 indexed batchId, uint256 escrowCount);
    event EscrowFactoryUpdated(address indexed oldFactory, address indexed newFactory);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error OnlyEscrowFactory();
    error InvalidAddress();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() Ownable(msg.sender) {}

    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyFactory() {
        if (msg.sender != escrowFactory) revert OnlyEscrowFactory();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                        REGISTRATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Register a new escrow (called by EscrowFactory)
     * @param escrowAddress Address of the deployed escrow
     * @param traveler Traveler address
     * @param host Host address
     * @return escrowId The ID of the registered escrow
     */
    function registerEscrow(
        address escrowAddress,
        address traveler,
        address host
    ) external onlyFactory returns (uint256 escrowId) {
        if (escrowAddress == address(0)) revert InvalidAddress();

        escrowId = escrowCount++;
        escrows[escrowId] = escrowAddress;
        userEscrowIds[traveler].push(escrowId);
        userEscrowIds[host].push(escrowId);

        emit EscrowRegistered(escrowId, escrowAddress, traveler, host);
    }

    /**
     * @notice Register a batch escrow (called by EscrowFactory)
     * @param escrowId Escrow ID to add to batch
     * @param batchId Batch ID (if 0, creates new batch)
     * @return actualBatchId The batch ID used
     */
    function registerBatchEscrow(
        uint256 escrowId,
        uint256 batchId
    ) external onlyFactory returns (uint256 actualBatchId) {
        // If batchId is 0, create new batch
        if (batchId == 0) {
            actualBatchId = batchCount++;
            emit BatchCreated(actualBatchId, 0);
        } else {
            actualBatchId = batchId;
        }

        batchEscrows[actualBatchId].push(escrowId);
        escrowToBatch[escrowId] = actualBatchId;
    }

    /**
     * @notice Get next batch ID without incrementing (for EscrowFactory to peek)
     * @return uint256 The next batch ID
     */
    function getNextBatchId() external view returns (uint256) {
        return batchCount;
    }

    /**
     * @notice Increment and return new batch ID (for EscrowFactory)
     * @return uint256 The new batch ID
     */
    function createBatchId() external onlyFactory returns (uint256) {
        uint256 newBatchId = batchCount++;
        emit BatchCreated(newBatchId, 0);
        return newBatchId;
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get all escrow IDs for a user (traveler or host)
     * @param user User address
     * @return uint256[] Array of escrow IDs
     */
    function getUserEscrows(address user) external view returns (uint256[] memory) {
        return userEscrowIds[user];
    }

    /**
     * @notice Get all escrow addresses for a user
     * @param user User address
     * @return address[] Array of escrow addresses
     */
    function getUserEscrowAddresses(address user) external view returns (address[] memory) {
        uint256[] memory ids = userEscrowIds[user];
        address[] memory addresses = new address[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            addresses[i] = escrows[ids[i]];
        }

        return addresses;
    }

    /**
     * @notice Get all escrow IDs in a batch
     * @param batchId Batch ID
     * @return uint256[] Array of escrow IDs
     */
    function getBatchEscrows(uint256 batchId) external view returns (uint256[] memory) {
        return batchEscrows[batchId];
    }

    /**
     * @notice Get all escrow addresses in a batch
     * @param batchId Batch ID
     * @return address[] Array of escrow addresses
     */
    function getBatchEscrowAddresses(uint256 batchId) external view returns (address[] memory) {
        uint256[] memory ids = batchEscrows[batchId];
        address[] memory addresses = new address[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            addresses[i] = escrows[ids[i]];
        }

        return addresses;
    }

    /**
     * @notice Get batch ID for an escrow
     * @param escrowId Escrow ID
     * @return uint256 Batch ID (0 if not in batch)
     */
    function getEscrowBatch(uint256 escrowId) external view returns (uint256) {
        return escrowToBatch[escrowId];
    }

    /**
     * @notice Check if an escrow is part of a batch
     * @param escrowId Escrow ID
     * @return bool True if part of batch
     */
    function isInBatch(uint256 escrowId) external view returns (bool) {
        return escrowToBatch[escrowId] != 0;
    }

    /**
     * @notice Get total number of escrows
     * @return uint256 Total escrow count
     */
    function totalEscrows() external view returns (uint256) {
        return escrowCount;
    }

    /**
     * @notice Get total number of batches
     * @return uint256 Total batch count
     */
    function totalBatches() external view returns (uint256) {
        return batchCount;
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set the EscrowFactory address (only owner)
     * @param _escrowFactory New EscrowFactory address
     */
    function setEscrowFactory(address _escrowFactory) external onlyOwner {
        if (_escrowFactory == address(0)) revert InvalidAddress();
        address oldFactory = escrowFactory;
        escrowFactory = _escrowFactory;
        emit EscrowFactoryUpdated(oldFactory, _escrowFactory);
    }
}
