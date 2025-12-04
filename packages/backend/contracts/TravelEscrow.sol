// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./interfaces/IPropertyNFT.sol";
import "./interfaces/ITravelerSBT.sol";
import "./interfaces/IHostSBT.sol";

/**
 * @title TravelEscrow
 * @notice Specialized escrow for travel bookings with intelligent timeline and dual currency support
 * @dev KEY CHANGES:
 * - Timeline based on checkIn instead of checkOut (hotel-style payment)
 * - Dual currency support (USDC/EURC)
 * - Off-chain pricing with backend signature verification
 * - Integration with PropertyNFT (ERC1155)
 */
contract TravelEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using MessageHashUtils for bytes32;

    // ============ Enums ============

    enum Status {
        Pending, // Funds locked, booking active
        Completed, // Payment released to host
        Refunded, // Full refund to traveler
        PartiallyRefunded, // Partial refund (cancellation)
        Disputed // Dispute opened
    }

    enum PaymentPreference {
        CRYPTO, // Host receives stablecoin directly
        FIAT // Platform converts to EUR
    }

    // ============ State Variables ============

    // Participants
    address public immutable traveler; // Buyer (voyageur)
    address public immutable host; // Seller (hôte)
    address public immutable admin;
    address public immutable platformWallet;

    // Token & Amounts (DUAL CURRENCY SUPPORT)
    address public immutable token; // USDC or EURC
    uint256 public immutable amount;
    uint256 public immutable platformFee;

    // Travel specific
    IPropertyNFT public immutable propertyNFT;
    uint256 public immutable tokenId; // PropertyNFT tokenId (includes room type)
    uint256 public immutable bookingIndex;
    uint256 public immutable checkIn;
    uint256 public immutable checkOut;

    // Status & Payment
    Status public status;
    PaymentPreference public hostPreference;
    bool public withdrawn;

    // Backend signer for off-ramp
    address public backendSigner;

    // Timeline constants (CHANGED: Based on checkIn instead of checkOut)
    uint256 public constant GUEST_GRACE_PERIOD = 4 hours; // After checkIn - reduced for short stays
    uint256 public constant AUTO_RELEASE_DELAY = 12 hours; // After checkIn - reduced for 1-night stays
    uint256 public constant MAX_DISPUTE_WINDOW = 7 days; // After checkOut

    // Timestamps
    uint256 public immutable createdAt;
    uint256 public confirmStayTimestamp; // When traveler confirms stay

    // ============ Events ============

    event FundsLocked(
        address indexed traveler,
        address indexed host,
        address indexed token,
        uint256 amount,
        uint256 checkIn,
        uint256 checkOut
    );

    event StayConfirmed(address indexed traveler, uint256 timestamp);
    event AutoReleased(address indexed host, uint256 amount, uint256 timestamp);
    event HostWithdrewCrypto(address indexed host, uint256 amount);
    event BackendInitiatedOffRamp(address indexed backend, uint256 amount);
    event PaymentPreferenceSet(PaymentPreference preference);

    event DisputeOpened(address indexed initiator, string reason, uint256 timestamp);
    event DisputeResolved(bool refunded, address indexed resolvedBy, string resolution);

    event PartialRefund(address indexed traveler, address indexed host, uint256 travelerAmount, uint256 hostAmount);

    event FundsRefunded(address indexed traveler, uint256 amount);
    event CancellationProcessed(address indexed traveler, uint256 refundPercent);

    // ============ Custom Errors ============

    error InvalidAddress();
    error InvalidAmount();
    error InvalidDates();
    error InvalidStatus();
    error Unauthorized();
    error AlreadyWithdrawn();
    error DisputeWindowExpired();
    error TooEarlyForAction();
    error WrongPaymentPreference();
    error InvalidSignature();
    error UnsupportedCurrency();

    // ============ Modifiers ============

    modifier onlyTraveler() {
        if (msg.sender != traveler) revert Unauthorized();
        _;
    }

    modifier onlyHost() {
        if (msg.sender != host) revert Unauthorized();
        _;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier inStatus(Status _status) {
        if (status != _status) revert InvalidStatus();
        _;
    }

    // ============ Constructor ============

    constructor(
        address _traveler,
        address _host,
        address _token, // USDC or EURC
        uint256 _amount,
        uint256 _platformFee,
        address _platformWallet,
        address _admin,
        address _backendSigner,
        address _propertyNFT,
        uint256 _tokenId,
        uint256 _bookingIndex,
        uint256 _checkIn,
        uint256 _checkOut
    ) {
        if (
            _traveler == address(0) ||
            _host == address(0) ||
            _token == address(0) ||
            _platformWallet == address(0) ||
            _admin == address(0) ||
            _backendSigner == address(0) ||
            _propertyNFT == address(0)
        ) revert InvalidAddress();

        if (_amount == 0 || _platformFee >= _amount) revert InvalidAmount();
        if (_checkIn <= block.timestamp) revert InvalidDates();
        if (_checkOut <= _checkIn) revert InvalidDates();

        traveler = _traveler;
        host = _host;
        token = _token;
        amount = _amount;
        platformFee = _platformFee;
        platformWallet = _platformWallet;
        admin = _admin;
        backendSigner = _backendSigner;

        propertyNFT = IPropertyNFT(_propertyNFT);
        tokenId = _tokenId;
        bookingIndex = _bookingIndex;
        checkIn = _checkIn;
        checkOut = _checkOut;

        status = Status.Pending;
        hostPreference = PaymentPreference.CRYPTO; // Default
        createdAt = block.timestamp;

        emit FundsLocked(_traveler, _host, _token, _amount, _checkIn, _checkOut);
    }

    // ============ Payment Preference ============

    /**
     * @notice Host sets payment preference (CRYPTO or FIAT)
     * @param _preference Payment preference
     */
    function setPaymentPreference(PaymentPreference _preference) external onlyHost {
        if (withdrawn) revert AlreadyWithdrawn();

        hostPreference = _preference;
        emit PaymentPreferenceSet(_preference);
    }

    // ============ INTELLIGENT TIMELINE (CHANGED: Based on checkIn) ============

    /**
     * @notice Traveler confirms their stay (4h after checkIn)
     * @dev Releases funds to host after confirmation
     */
    function confirmStay() external onlyTraveler inStatus(Status.Pending) nonReentrant {
        // Must be after checkIn + grace period
        if (block.timestamp < checkIn + GUEST_GRACE_PERIOD) {
            revert TooEarlyForAction();
        }

        confirmStayTimestamp = block.timestamp;
        _releaseFundsToHost();

        emit StayConfirmed(msg.sender, block.timestamp);
    }

    /**
     * @notice Auto-release funds to host (12h after checkIn if no dispute)
     * @dev Anyone can trigger this (permissionless)
     */
    function autoReleaseToHost() external inStatus(Status.Pending) nonReentrant {
        // Must be 12h after checkIn
        if (block.timestamp < checkIn + AUTO_RELEASE_DELAY) {
            revert TooEarlyForAction();
        }

        _releaseFundsToHost();

        emit AutoReleased(host, amount - platformFee, block.timestamp);
    }

    /**
     * @notice Internal function to release funds to host
     */
    function _releaseFundsToHost() internal {
        status = Status.Completed;

        // Transfer platform fee
        IERC20(token).safeTransfer(platformWallet, platformFee);

        // Mark as ready for withdrawal (host chooses crypto or fiat)
    }

    // ============ HOST WITHDRAWAL (Crypto or Fiat) ============

    /**
     * @notice Host withdraws in crypto (USDC/EURC)
     */
    function withdrawCrypto() external onlyHost inStatus(Status.Completed) nonReentrant {
        if (withdrawn) revert AlreadyWithdrawn();
        if (hostPreference != PaymentPreference.CRYPTO) {
            revert WrongPaymentPreference();
        }

        withdrawn = true;
        uint256 hostAmount = amount - platformFee;

        IERC20(token).safeTransfer(host, hostAmount);

        emit HostWithdrewCrypto(host, hostAmount);
    }

    /**
     * @notice Backend initiates off-ramp to EUR (with signature)
     * @param signature Backend signature authorizing off-ramp
     */
    function initiateOffRamp(bytes calldata signature) external inStatus(Status.Completed) nonReentrant {
        if (withdrawn) revert AlreadyWithdrawn();
        if (hostPreference != PaymentPreference.FIAT) {
            revert WrongPaymentPreference();
        }

        // Verify backend signature
        bytes32 messageHash = keccak256(abi.encodePacked(address(this), host, amount - platformFee, token));

        address signer = ECDSA.recover(messageHash.toEthSignedMessageHash(), signature);
        if (signer != backendSigner) revert InvalidSignature();

        withdrawn = true;
        uint256 hostAmount = amount - platformFee;

        // Transfer to platform for EUR conversion
        IERC20(token).safeTransfer(platformWallet, hostAmount);

        emit BackendInitiatedOffRamp(msg.sender, hostAmount);
    }

    // ============ CANCELLATION LOGIC ============

    /**
     * @notice Cancel booking (before checkIn)
     * @dev Refund percentage based on time before checkIn:
     * - >30 days: 100% refund
     * - 14-30 days: 50% refund
     * - <14 days: 0% refund (host keeps all)
     */
    function cancelBooking() external onlyTraveler inStatus(Status.Pending) nonReentrant {
        if (block.timestamp >= checkIn) revert TooEarlyForAction();

        uint256 daysBeforeCheckIn = (checkIn - block.timestamp) / 1 days;
        uint256 refundPercent;

        if (daysBeforeCheckIn > 30) {
            refundPercent = 100;
        } else if (daysBeforeCheckIn >= 14) {
            refundPercent = 50;
        } else {
            refundPercent = 0;
        }

        _processCancellation(refundPercent);

        emit CancellationProcessed(traveler, refundPercent);
    }

    /**
     * @notice Internal cancellation logic
     */
    function _processCancellation(uint256 refundPercent) internal {
        uint256 totalRefundable = amount - platformFee;
        uint256 travelerRefund = (totalRefundable * refundPercent) / 100;
        uint256 hostAmount = totalRefundable - travelerRefund;

        if (refundPercent == 100) {
            status = Status.Refunded;
            IERC20(token).safeTransfer(traveler, totalRefundable);
            emit FundsRefunded(traveler, totalRefundable);
        } else {
            status = Status.PartiallyRefunded;
            if (travelerRefund > 0) {
                IERC20(token).safeTransfer(traveler, travelerRefund);
            }
            if (hostAmount > 0) {
                IERC20(token).safeTransfer(host, hostAmount);
            }
            emit PartialRefund(traveler, host, travelerRefund, hostAmount);
        }

        // Transfer platform fee
        IERC20(token).safeTransfer(platformWallet, platformFee);

        // Cancel booking in PropertyNFT
        propertyNFT.cancelBooking(tokenId, bookingIndex);
    }

    // ============ DISPUTE RESOLUTION ============

    /**
     * @notice Open a dispute (within 7 days after checkOut)
     * @param reason Reason for dispute
     */
    function openDispute(string calldata reason) external inStatus(Status.Pending) {
        if (msg.sender != traveler && msg.sender != host) {
            revert Unauthorized();
        }

        // Must be after checkIn (can't dispute before staying)
        if (block.timestamp < checkIn) revert TooEarlyForAction();

        // Must be within 7 days after checkOut
        if (block.timestamp > checkOut + MAX_DISPUTE_WINDOW) {
            revert DisputeWindowExpired();
        }

        status = Status.Disputed;

        emit DisputeOpened(msg.sender, reason, block.timestamp);
    }

    /**
     * @notice Resolve dispute (admin only)
     * @param refundToTraveler true = refund to traveler, false = pay host
     * @param resolution Resolution explanation
     */
    function resolveDispute(
        bool refundToTraveler,
        string calldata resolution
    ) external onlyAdmin inStatus(Status.Disputed) nonReentrant {
        uint256 totalRefundable = amount - platformFee;

        if (refundToTraveler) {
            status = Status.Refunded;
            IERC20(token).safeTransfer(traveler, totalRefundable);
            emit FundsRefunded(traveler, totalRefundable);
        } else {
            status = Status.Completed;
            IERC20(token).safeTransfer(host, totalRefundable);
            emit HostWithdrewCrypto(host, totalRefundable);
        }

        // Transfer platform fee
        IERC20(token).safeTransfer(platformWallet, platformFee);

        emit DisputeResolved(refundToTraveler, admin, resolution);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get escrow details
     */
    function getDetails()
        external
        view
        returns (
            address _traveler,
            address _host,
            address _token,
            uint256 _amount,
            uint256 _tokenId,
            uint256 _checkIn,
            uint256 _checkOut,
            Status _status,
            PaymentPreference _preference,
            bool _withdrawn
        )
    {
        return (traveler, host, token, amount, tokenId, checkIn, checkOut, status, hostPreference, withdrawn);
    }

    /**
     * @notice Check if auto-release is available
     */
    function canAutoRelease() external view returns (bool) {
        return (status == Status.Pending && block.timestamp >= checkIn + AUTO_RELEASE_DELAY);
    }

    /**
     * @notice Check if traveler can confirm stay
     */
    function canConfirmStay() external view returns (bool) {
        return (status == Status.Pending && block.timestamp >= checkIn + GUEST_GRACE_PERIOD);
    }

    /**
     * @notice Get refund percentage for current time
     */
    function getRefundPercentage() external view returns (uint256) {
        if (block.timestamp >= checkIn) return 0;

        uint256 daysBeforeCheckIn = (checkIn - block.timestamp) / 1 days;

        if (daysBeforeCheckIn > 30) return 100;
        if (daysBeforeCheckIn >= 14) return 50;
        return 0;
    }
}
