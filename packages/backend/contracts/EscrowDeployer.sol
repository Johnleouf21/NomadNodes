// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./TravelEscrow.sol";

/**
 * @title EscrowDeployer
 * @notice Deploys TravelEscrow contracts
 * @dev Separates deployment logic from EscrowFactory to reduce bytecode size
 */
contract EscrowDeployer is Ownable {
    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    address public escrowFactory;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event EscrowDeployed(address indexed escrowAddress, address indexed traveler, address indexed host);
    event EscrowFactoryUpdated(address indexed oldFactory, address indexed newFactory);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error OnlyEscrowFactory();
    error InvalidAddress();
    error DeploymentFailed();

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
                        DEPLOYMENT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploy a new TravelEscrow contract
     * @param traveler Traveler address
     * @param host Host address
     * @param token Payment token (USDC/EURC)
     * @param amount Total payment amount
     * @param platformFee Platform fee amount
     * @param platformWallet Platform wallet address
     * @param admin Admin address for disputes
     * @param backendSigner Backend signer address
     * @param propertyNFT PropertyNFT contract address
     * @param tokenId Property token ID
     * @param bookingIndex Booking index
     * @param checkIn Check-in timestamp
     * @param checkOut Check-out timestamp
     * @return escrowAddress Address of deployed escrow
     */
    function deployEscrow(
        address traveler,
        address host,
        address token,
        uint256 amount,
        uint256 platformFee,
        address platformWallet,
        address admin,
        address backendSigner,
        address propertyNFT,
        uint256 tokenId,
        uint256 bookingIndex,
        uint256 checkIn,
        uint256 checkOut
    ) external onlyFactory returns (address escrowAddress) {
        // Deploy new TravelEscrow
        TravelEscrow escrow = new TravelEscrow(
            traveler,
            host,
            token,
            amount,
            platformFee,
            platformWallet,
            admin,
            backendSigner,
            propertyNFT,
            tokenId,
            bookingIndex,
            checkIn,
            checkOut
        );

        escrowAddress = address(escrow);

        if (escrowAddress == address(0)) revert DeploymentFailed();

        emit EscrowDeployed(escrowAddress, traveler, host);
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
