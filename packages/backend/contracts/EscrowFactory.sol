// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./libraries/QuoteVerifier.sol";
import "./interfaces/IPropertyNFT.sol";
import "./EscrowRegistry.sol";
import "./EscrowDeployer.sol";

/**
 * @title EscrowFactory
 * @notice Lightweight factory to create TravelEscrow contracts with off-chain pricing
 * @dev Delegates to EscrowRegistry (storage) and EscrowDeployer (deployment)
 */
contract EscrowFactory is Ownable, Pausable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct RoomBooking {
        uint256 tokenId;
        uint256 quantity;
        uint256 price;
    }

    struct BookingQuote {
        uint256 tokenId;
        uint256 checkIn;
        uint256 checkOut;
        uint256 price;
        address currency;
        uint256 validUntil;
        uint256 quantity;
        bytes signature;
    }

    struct BatchBookingQuote {
        RoomBooking[] rooms;
        uint256 checkIn;
        uint256 checkOut;
        uint256 totalPrice;
        address currency;
        uint256 validUntil;
        bytes signature;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    uint256 public platformFeePercent = 750; // 7.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public minFee = 0.5e6; // 0.5 USDC/EURC

    address public platformWallet;
    address public admin;
    address public backendSigner;
    address public propertyNFT;
    address public USDC;
    address public EURC;

    EscrowRegistry public escrowRegistry;
    EscrowDeployer public escrowDeployer;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event EscrowCreated(
        address indexed escrowAddress,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 amount
    );
    event TravelEscrowCreated(
        address indexed escrowAddress,
        uint256 indexed tokenId,
        address indexed traveler,
        address currency,
        uint256 price,
        uint256 checkIn,
        uint256 checkOut
    );
    event BatchBookingCreated(
        uint256 indexed batchId,
        address indexed traveler,
        address currency,
        uint256 totalPrice,
        uint256 checkIn,
        uint256 checkOut,
        uint256 roomCount,
        uint256[] escrowIds
    );

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidAddress();
    error InvalidAmount();
    error InvalidFee();
    error InvalidQuote();
    error QuoteExpired();
    error UnsupportedCurrency();
    error EmptyRoomList();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(
        address _platformWallet,
        address _admin,
        address _backendSigner,
        address _USDC,
        address _EURC
    ) Ownable(msg.sender) {
        if (
            _platformWallet == address(0) ||
            _admin == address(0) ||
            _backendSigner == address(0) ||
            _USDC == address(0) ||
            _EURC == address(0)
        ) {
            revert InvalidAddress();
        }

        platformWallet = _platformWallet;
        admin = _admin;
        backendSigner = _backendSigner;
        USDC = _USDC;
        EURC = _EURC;
    }

    /*//////////////////////////////////////////////////////////////
                        CORE CREATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function createTravelEscrowWithQuote(
        BookingQuote calldata quote
    ) external whenNotPaused returns (address escrowAddress) {
        // Verify quote
        if (
            !QuoteVerifier.verifyQuote(
                quote.tokenId,
                quote.checkIn,
                quote.checkOut,
                quote.price,
                quote.currency,
                quote.validUntil,
                quote.quantity,
                quote.signature,
                backendSigner,
                address(this)
            )
        ) revert InvalidQuote();

        if (block.timestamp > quote.validUntil) revert QuoteExpired();
        if (quote.currency != USDC && quote.currency != EURC) revert UnsupportedCurrency();

        // Verify availability
        if (propertyNFT == address(0)) revert InvalidAddress();
        IPropertyNFT nft = IPropertyNFT(propertyNFT);
        if (!nft.checkAvailability(quote.tokenId, quote.checkIn, quote.checkOut)) revert InvalidAmount();

        // Get host
        (uint256 propertyId, ) = nft.decodeTokenId(quote.tokenId);
        address host = nft.propertyOwner(propertyId);
        if (host == address(0) || msg.sender == host) revert InvalidAddress();

        // Calculate fee
        uint256 fee = (quote.price * platformFeePercent) / FEE_DENOMINATOR;
        if (fee < minFee) fee = minFee;
        if (fee >= quote.price) revert InvalidFee();

        // Transfer payment
        IERC20(quote.currency).safeTransferFrom(msg.sender, address(this), quote.price);

        // Create booking first (pass msg.sender as traveler for Account Abstraction support)
        uint256 numGuests = quote.quantity > 0 ? quote.quantity : 2;
        uint256 bookingIndex = nft.bookRoom(
            quote.tokenId,
            quote.checkIn,
            quote.checkOut,
            numGuests,
            address(0),
            msg.sender
        );

        // Deploy escrow
        escrowAddress = escrowDeployer.deployEscrow(
            msg.sender,
            host,
            quote.currency,
            quote.price,
            fee,
            platformWallet,
            admin,
            backendSigner,
            propertyNFT,
            quote.tokenId,
            bookingIndex,
            quote.checkIn,
            quote.checkOut
        );

        // Update booking with escrow address
        nft.setEscrowAddress(quote.tokenId, bookingIndex, escrowAddress);

        // Transfer to escrow
        IERC20(quote.currency).safeTransfer(escrowAddress, quote.price);

        // Register in registry
        escrowRegistry.registerEscrow(escrowAddress, msg.sender, host);

        emit EscrowCreated(escrowAddress, msg.sender, host, quote.currency, quote.price);
        emit TravelEscrowCreated(
            escrowAddress,
            quote.tokenId,
            msg.sender,
            quote.currency,
            quote.price,
            quote.checkIn,
            quote.checkOut
        );

        return escrowAddress;
    }

    function createBatchTravelEscrow(
        BatchBookingQuote calldata quote
    ) external whenNotPaused returns (address[] memory escrowAddresses) {
        if (quote.rooms.length == 0) revert EmptyRoomList();

        // Verify batch quote
        bytes32 roomsHash = QuoteVerifier.hashRoomBookings(
            _extractTokenIds(quote.rooms),
            _extractQuantities(quote.rooms),
            _extractPrices(quote.rooms)
        );

        if (
            !QuoteVerifier.verifyBatchQuote(
                roomsHash,
                quote.checkIn,
                quote.checkOut,
                quote.totalPrice,
                quote.currency,
                quote.validUntil,
                quote.signature,
                backendSigner,
                address(this)
            )
        ) revert InvalidQuote();

        if (block.timestamp > quote.validUntil) revert QuoteExpired();
        if (quote.currency != USDC && quote.currency != EURC) revert UnsupportedCurrency();

        IPropertyNFT nft = IPropertyNFT(propertyNFT);

        // Verify all rooms from same property and available
        (uint256 propertyId, ) = nft.decodeTokenId(quote.rooms[0].tokenId);
        address host = nft.propertyOwner(propertyId);
        if (host == address(0) || msg.sender == host) revert InvalidAddress();

        uint256 priceSum = 0;
        for (uint256 i = 0; i < quote.rooms.length; i++) {
            (uint256 roomPropertyId, ) = nft.decodeTokenId(quote.rooms[i].tokenId);
            if (roomPropertyId != propertyId) revert InvalidAddress();
            if (!nft.checkAvailability(quote.rooms[i].tokenId, quote.checkIn, quote.checkOut)) revert InvalidAmount();
            priceSum += quote.rooms[i].price;
        }

        if (priceSum != quote.totalPrice) revert InvalidAmount();

        // Transfer total payment
        IERC20(quote.currency).safeTransferFrom(msg.sender, address(this), quote.totalPrice);

        // Create batch ID
        uint256 batchId = escrowRegistry.createBatchId();

        // Create arrays
        escrowAddresses = new address[](quote.rooms.length);
        uint256[] memory escrowIds = new uint256[](quote.rooms.length);

        // Create escrow for each room
        for (uint256 i = 0; i < quote.rooms.length; i++) {
            RoomBooking calldata room = quote.rooms[i];

            uint256 roomFee = (room.price * platformFeePercent) / FEE_DENOMINATOR;
            if (roomFee < minFee) roomFee = minFee;
            if (roomFee >= room.price) revert InvalidFee();

            // Create booking (pass msg.sender as traveler for Account Abstraction support)
            uint256 numGuests = room.quantity > 0 ? room.quantity : 2;
            uint256 bookingIndex = nft.bookRoom(
                room.tokenId,
                quote.checkIn,
                quote.checkOut,
                numGuests,
                address(0),
                msg.sender
            );

            // Deploy escrow
            address escrowAddress = escrowDeployer.deployEscrow(
                msg.sender,
                host,
                quote.currency,
                room.price,
                roomFee,
                platformWallet,
                admin,
                backendSigner,
                propertyNFT,
                room.tokenId,
                bookingIndex,
                quote.checkIn,
                quote.checkOut
            );

            // Update booking
            nft.setEscrowAddress(room.tokenId, bookingIndex, escrowAddress);

            // Transfer to escrow
            IERC20(quote.currency).safeTransfer(escrowAddress, room.price);

            // Confirm booking (funds received)
            nft.confirmBooking(room.tokenId, bookingIndex);

            // Register
            uint256 escrowId = escrowRegistry.registerEscrow(escrowAddress, msg.sender, host);
            escrowRegistry.registerBatchEscrow(escrowId, batchId);

            escrowAddresses[i] = escrowAddress;
            escrowIds[i] = escrowId;

            emit EscrowCreated(escrowAddress, msg.sender, host, quote.currency, room.price);
            emit TravelEscrowCreated(
                escrowAddress,
                room.tokenId,
                msg.sender,
                quote.currency,
                room.price,
                quote.checkIn,
                quote.checkOut
            );
        }

        emit BatchBookingCreated(
            batchId,
            msg.sender,
            quote.currency,
            quote.totalPrice,
            quote.checkIn,
            quote.checkOut,
            quote.rooms.length,
            escrowIds
        );

        return escrowAddresses;
    }

    /*//////////////////////////////////////////////////////////////
                        HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _extractTokenIds(RoomBooking[] calldata rooms) private pure returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](rooms.length);
        for (uint256 i = 0; i < rooms.length; i++) {
            tokenIds[i] = rooms[i].tokenId;
        }
        return tokenIds;
    }

    function _extractQuantities(RoomBooking[] calldata rooms) private pure returns (uint256[] memory) {
        uint256[] memory quantities = new uint256[](rooms.length);
        for (uint256 i = 0; i < rooms.length; i++) {
            quantities[i] = rooms[i].quantity;
        }
        return quantities;
    }

    function _extractPrices(RoomBooking[] calldata rooms) private pure returns (uint256[] memory) {
        uint256[] memory prices = new uint256[](rooms.length);
        for (uint256 i = 0; i < rooms.length; i++) {
            prices[i] = rooms[i].price;
        }
        return prices;
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS (delegate to Registry)
    //////////////////////////////////////////////////////////////*/

    function getUserEscrows(address user) external view returns (uint256[] memory) {
        return escrowRegistry.getUserEscrows(user);
    }

    function getBatchEscrows(uint256 batchId) external view returns (uint256[] memory) {
        return escrowRegistry.getBatchEscrows(batchId);
    }

    function escrows(uint256 escrowId) external view returns (address) {
        return escrowRegistry.escrows(escrowId);
    }

    function escrowCount() external view returns (uint256) {
        return escrowRegistry.totalEscrows();
    }

    function batchCount() external view returns (uint256) {
        return escrowRegistry.totalBatches();
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        platformFeePercent = _newFee;
    }

    function setMinFee(uint256 _newMinFee) external onlyOwner {
        minFee = _newMinFee;
    }

    function setPlatformWallet(address _newWallet) external onlyOwner {
        if (_newWallet == address(0)) revert InvalidAddress();
        platformWallet = _newWallet;
    }

    function setAdmin(address _newAdmin) external onlyOwner {
        if (_newAdmin == address(0)) revert InvalidAddress();
        admin = _newAdmin;
    }

    function setBackendSigner(address _newSigner) external onlyOwner {
        if (_newSigner == address(0)) revert InvalidAddress();
        backendSigner = _newSigner;
    }

    function setPropertyNFT(address _newPropertyNFT) external onlyOwner {
        if (_newPropertyNFT == address(0)) revert InvalidAddress();
        propertyNFT = _newPropertyNFT;
    }

    function setUSDC(address _newUSDC) external onlyOwner {
        if (_newUSDC == address(0)) revert InvalidAddress();
        USDC = _newUSDC;
    }

    function setEURC(address _newEURC) external onlyOwner {
        if (_newEURC == address(0)) revert InvalidAddress();
        EURC = _newEURC;
    }

    function setEscrowRegistry(address _escrowRegistry) external onlyOwner {
        if (_escrowRegistry == address(0)) revert InvalidAddress();
        escrowRegistry = EscrowRegistry(_escrowRegistry);
    }

    function setEscrowDeployer(address _escrowDeployer) external onlyOwner {
        if (_escrowDeployer == address(0)) revert InvalidAddress();
        escrowDeployer = EscrowDeployer(_escrowDeployer);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
