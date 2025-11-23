// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./TravelEscrow.sol";
import "./interfaces/IPropertyNFT.sol";

/**
 * @title EscrowFactory
 * @notice Factory to create and manage TravelEscrow contracts with off-chain pricing
 * @dev KEY CHANGES:
 * - Removed Escrow.sol dependency (only TravelEscrow now)
 * - Added quote verification with backend signature
 * - Dual currency support (USDC/EURC)
 * - Integration with PropertyNFT (ERC1155)
 * - Removed IEscrowFactory interface (deprecated createEscrow function)
 */
contract EscrowFactory is Ownable, Pausable {
    using SafeERC20 for IERC20;
    using MessageHashUtils for bytes32;

    // ============ Structs ============

    /**
     * @notice Off-chain pricing quote signed by backend
     */
    struct BookingQuote {
        uint256 tokenId; // PropertyNFT token ID (includes room type)
        uint256 checkIn; // Check-in timestamp
        uint256 checkOut; // Check-out timestamp
        uint256 price; // Total price in selected currency
        address currency; // USDC or EURC
        uint256 validUntil; // Quote expiry timestamp
        bytes signature; // Backend signature
    }

    // ============ State Variables ============

    uint256 public platformFeePercent = 750; // 7.5% (base 10000)
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public minFee = 0.5e6; // 0.5 USDC/EURC minimum (6 decimals)

    address public platformWallet;
    address public admin; // Admin who can resolve disputes
    address public backendSigner; // Backend signer for quote verification
    address public propertyNFT; // PropertyNFT contract address

    // Supported stablecoins (USDC and EURC)
    address public USDC;
    address public EURC;

    mapping(uint256 => address) public escrows; // escrowId => escrow address
    mapping(address => uint256[]) private userEscrowIds; // user => escrow IDs

    uint256 public escrowCount;

    // ============ Events ============

    event EscrowCreated(
        address indexed escrowAddress,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 amount
    );
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event MinFeeUpdated(uint256 oldMinFee, uint256 newMinFee);
    event CurrencyUpdated(address indexed currency, string currencyType);
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event BackendSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event PropertyNFTUpdated(address indexed oldPropertyNFT, address indexed newPropertyNFT);
    event TravelEscrowCreated(
        address indexed escrowAddress,
        uint256 indexed tokenId,
        address indexed traveler,
        address currency,
        uint256 price,
        uint256 checkIn,
        uint256 checkOut
    );

    // ============ Errors ============

    error InvalidAddress();
    error InvalidAmount();
    error InvalidFee();
    error InvalidQuote();
    error QuoteExpired();
    error UnsupportedCurrency();

    // ============ Constructor ============

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
        ) revert InvalidAddress();

        platformWallet = _platformWallet;
        admin = _admin;
        backendSigner = _backendSigner;
        USDC = _USDC;
        EURC = _EURC;
    }

    // ============ CORE FUNCTIONS (with Off-Chain Pricing) ============

    /**
     * @notice Create a TravelEscrow with off-chain pricing quote
     * @param quote Signed booking quote from backend
     * @return escrowAddress Address of created TravelEscrow
     */
    function createTravelEscrowWithQuote(
        BookingQuote calldata quote
    ) external whenNotPaused returns (address escrowAddress) {
        // 1. Verify quote signature
        _verifyQuote(quote);

        // 2. Verify quote hasn't expired
        if (block.timestamp > quote.validUntil) revert QuoteExpired();

        // 3. Verify currency is supported
        if (quote.currency != USDC && quote.currency != EURC) {
            revert UnsupportedCurrency();
        }

        // 4. Verify property and availability
        if (propertyNFT == address(0)) revert InvalidAddress();
        IPropertyNFT nft = IPropertyNFT(propertyNFT);

        // Check availability
        if (!nft.checkAvailability(quote.tokenId, quote.checkIn, quote.checkOut, 1)) {
            revert InvalidAmount(); // Room not available
        }

        // Get property owner (host)
        (uint256 propertyId, ) = nft.decodeTokenId(quote.tokenId);
        address host = nft.propertyOwner(propertyId);

        if (host == address(0)) revert InvalidAddress();
        if (msg.sender == host) revert InvalidAddress(); // Can't book own property

        // 5. Calculate platform fee
        uint256 fee = (quote.price * platformFeePercent) / FEE_DENOMINATOR;
        if (fee < minFee) {
            fee = minFee;
        }

        if (fee >= quote.price) revert InvalidFee();

        // 6. Transfer payment from traveler to factory
        IERC20(quote.currency).safeTransferFrom(msg.sender, address(this), quote.price);

        // 7. Create booking in PropertyNFT
        uint256 bookingIndex = nft.bookRoom(
            quote.tokenId,
            msg.sender,
            quote.checkIn,
            quote.checkOut,
            escrowCount // Will be the escrowId
        );

        // 8. Create TravelEscrow contract
        TravelEscrow escrow = new TravelEscrow(
            msg.sender, // traveler
            host, // host
            quote.currency, // USDC or EURC
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

        escrowAddress = address(escrow);

        // 9. Transfer tokens to escrow
        IERC20(quote.currency).safeTransfer(escrowAddress, quote.price);

        // 10. Register escrow
        uint256 escrowId = escrowCount++;
        escrows[escrowId] = escrowAddress;
        userEscrowIds[msg.sender].push(escrowId);
        userEscrowIds[host].push(escrowId);

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

    /**
     * @notice Verify backend signature on booking quote
     */
    function _verifyQuote(BookingQuote calldata quote) internal view {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                quote.tokenId,
                quote.checkIn,
                quote.checkOut,
                quote.price,
                quote.currency,
                quote.validUntil
            )
        );

        address signer = ECDSA.recover(messageHash.toEthSignedMessageHash(), quote.signature);

        if (signer != backendSigner) revert InvalidQuote();
    }

    // ============ Admin Functions ============

    /**
     * @notice Set platform fee percentage
     * @param newFeePercent New fee percentage (base 10000, e.g. 750 = 7.5%)
     */
    function setPlatformFee(uint256 newFeePercent) external onlyOwner {
        if (newFeePercent > 1000) revert InvalidFee(); // Max 10%
        uint256 oldFee = platformFeePercent;
        platformFeePercent = newFeePercent;
        emit PlatformFeeUpdated(oldFee, newFeePercent);
    }

    /**
     * @notice Set minimum fee amount
     * @param _minFee New minimum fee (in stablecoin decimals)
     */
    function setMinFee(uint256 _minFee) external onlyOwner {
        uint256 oldMinFee = minFee;
        minFee = _minFee;
        emit MinFeeUpdated(oldMinFee, _minFee);
    }

    /**
     * @notice Set platform wallet address
     * @param newWallet New wallet address
     */
    function setPlatformWallet(address newWallet) external onlyOwner {
        if (newWallet == address(0)) revert InvalidAddress();
        address oldWallet = platformWallet;
        platformWallet = newWallet;
        emit PlatformWalletUpdated(oldWallet, newWallet);
    }

    /**
     * @notice Set admin address (dispute resolver)
     * @param newAdmin New admin address
     */
    function setAdmin(address newAdmin) external onlyOwner {
        if (newAdmin == address(0)) revert InvalidAddress();
        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminUpdated(oldAdmin, newAdmin);
    }

    /**
     * @notice Set backend signer address
     * @param newSigner New backend signer address
     */
    function setBackendSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert InvalidAddress();
        address oldSigner = backendSigner;
        backendSigner = newSigner;
        emit BackendSignerUpdated(oldSigner, newSigner);
    }

    /**
     * @notice Set PropertyNFT contract address
     * @param newPropertyNFT New PropertyNFT address
     */
    function setPropertyNFT(address newPropertyNFT) external onlyOwner {
        if (newPropertyNFT == address(0)) revert InvalidAddress();
        address oldPropertyNFT = propertyNFT;
        propertyNFT = newPropertyNFT;
        emit PropertyNFTUpdated(oldPropertyNFT, newPropertyNFT);
    }

    /**
     * @notice Update USDC address
     */
    function setUSDC(address _USDC) external onlyOwner {
        if (_USDC == address(0)) revert InvalidAddress();
        USDC = _USDC;
        emit CurrencyUpdated(_USDC, "USDC");
    }

    /**
     * @notice Update EURC address
     */
    function setEURC(address _EURC) external onlyOwner {
        if (_EURC == address(0)) revert InvalidAddress();
        EURC = _EURC;
        emit CurrencyUpdated(_EURC, "EURC");
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @notice Get user's escrow addresses
     * @param user User address
     * @return Array of escrow addresses
     */
    function getUserEscrows(address user) external view returns (address[] memory) {
        uint256[] memory ids = userEscrowIds[user];
        address[] memory userEscrows = new address[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            userEscrows[i] = escrows[ids[i]];
        }

        return userEscrows;
    }

    /**
     * @notice Get escrow address by ID
     * @param escrowId Escrow ID
     * @return Escrow address
     */
    function getEscrowAddress(uint256 escrowId) external view returns (address) {
        return escrows[escrowId];
    }

    /**
     * @notice Calculate fee for a given amount
     * @param amount Amount to calculate fee for
     * @return Fee amount
     */
    function calculateFee(uint256 amount) external view returns (uint256) {
        uint256 fee = (amount * platformFeePercent) / FEE_DENOMINATOR;
        return fee < minFee ? minFee : fee;
    }

    /**
     * @notice Get TravelEscrow details
     * @param escrowAddress TravelEscrow contract address
     */
    function getTravelEscrowDetails(
        address escrowAddress
    )
        external
        view
        returns (
            address traveler,
            address host,
            address token,
            uint256 amount,
            uint256 tokenId,
            uint256 checkIn,
            uint256 checkOut,
            uint8 status,
            uint8 preference,
            bool withdrawn
        )
    {
        TravelEscrow escrow = TravelEscrow(payable(escrowAddress));

        TravelEscrow.Status escrowStatus;
        TravelEscrow.PaymentPreference paymentPref;

        (traveler, host, token, amount, tokenId, checkIn, checkOut, escrowStatus, paymentPref, withdrawn) = escrow
            .getDetails();

        status = uint8(escrowStatus);
        preference = uint8(paymentPref);

        return (traveler, host, token, amount, tokenId, checkIn, checkOut, status, preference, withdrawn);
    }

    /**
     * @notice Verify a booking quote without executing
     * @param quote Booking quote to verify
     * @return isValid Whether quote is valid
     */
    function verifyQuote(BookingQuote calldata quote) external view returns (bool isValid) {
        try this._verifyQuoteExternal(quote) {
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @notice External wrapper for quote verification (for try/catch)
     */
    function _verifyQuoteExternal(BookingQuote calldata quote) external view {
        _verifyQuote(quote);
    }

    /**
     * @notice Check if currency is supported
     */
    function isCurrencySupported(address currency) external view returns (bool) {
        return currency == USDC || currency == EURC;
    }
}
