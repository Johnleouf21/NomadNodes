// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title TravelerSBT
 * @notice Soulbound Token (non-transferable) for travelers with integrated reputation system
 * @dev Each wallet can only own one TravelerSBT. Reputation is updated after completed stays.
 */
contract TravelerSBT is ERC721, Ownable {
    using Strings for uint256;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct TravelerProfile {
        // Reputation metrics
        uint256 totalBookings;
        uint256 completedStays;
        uint256 cancelledBookings;
        uint256 averageRating; // 0-500 (5.00 stars = 500)
        uint256 totalReviewsReceived;
        uint256 positiveReviews; // 4-5 stars
        // Metadata
        uint256 memberSince;
        uint256 lastActivityTimestamp;
        ReputationTier tier;
        // Moderation
        uint256 timesReportedByHosts;
        bool suspended; // Can be suspended for bad behavior
    }

    enum ReputationTier {
        Newcomer, // 0-5 bookings
        Regular, // 6-20 bookings
        Trusted, // 21-50 bookings, avg >= 4.0
        Elite // 50+ bookings, avg >= 4.5
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    mapping(uint256 => TravelerProfile) public profiles;
    mapping(address => uint256) public walletToTokenId;

    uint256 private _tokenIdCounter;

    // Authorized contracts that can update reputation
    mapping(address => bool) public authorizedUpdaters;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event TravelerMinted(address indexed traveler, uint256 indexed tokenId);
    event ReputationUpdated(
        address indexed traveler,
        uint256 indexed tokenId,
        uint256 newRating,
        ReputationTier newTier
    );
    event TierUpgraded(
        address indexed traveler,
        uint256 indexed tokenId,
        ReputationTier oldTier,
        ReputationTier newTier
    );
    event TravelerSuspended(address indexed traveler, uint256 indexed tokenId);
    event TravelerUnsuspended(address indexed traveler, uint256 indexed tokenId);
    event AuthorizedUpdaterSet(address indexed updater, bool authorized);
    event BookingLinked(
        address indexed traveler,
        uint256 indexed sbtTokenId,
        uint256 roomTokenId,
        uint256 bookingIndex
    );

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error AlreadyHasSBT();
    error NoSBT();
    error SoulboundToken();
    error NotAuthorized();
    error InvalidRating();
    error TravelerIsSuspended();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() ERC721("Traveler SBT", "TRAVELER") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start at 1
    }

    /*//////////////////////////////////////////////////////////////
                            MINTING LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mint a TravelerSBT for a new traveler
     * @param to Address to mint the SBT to
     */
    function mint(address to) external returns (uint256) {
        if (walletToTokenId[to] != 0) revert AlreadyHasSBT();

        uint256 tokenId = _tokenIdCounter++;

        _safeMint(to, tokenId);

        profiles[tokenId] = TravelerProfile({
            totalBookings: 0,
            completedStays: 0,
            cancelledBookings: 0,
            averageRating: 0,
            totalReviewsReceived: 0,
            positiveReviews: 0,
            memberSince: block.timestamp,
            lastActivityTimestamp: block.timestamp,
            tier: ReputationTier.Newcomer,
            timesReportedByHosts: 0,
            suspended: false
        });

        walletToTokenId[to] = tokenId;

        emit TravelerMinted(to, tokenId);

        return tokenId;
    }

    /*//////////////////////////////////////////////////////////////
                        REPUTATION UPDATES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Increment booking count when a booking is confirmed
     * @param traveler Address of the traveler
     */
    function incrementBookingCount(address traveler) external {
        if (!authorizedUpdaters[msg.sender]) revert NotAuthorized();

        uint256 tokenId = walletToTokenId[traveler];
        if (tokenId == 0) revert NoSBT();

        TravelerProfile storage profile = profiles[tokenId];
        if (profile.suspended) revert TravelerIsSuspended();

        profile.totalBookings++;
        profile.lastActivityTimestamp = block.timestamp;

        // Update tier based on new booking count
        ReputationTier oldTier = profile.tier;
        profile.tier = _calculateTier(profile);

        if (profile.tier != oldTier) {
            emit TierUpgraded(traveler, tokenId, oldTier, profile.tier);
        }
    }

    /**
     * @notice Increment completed stays when a booking is completed
     * @param traveler Address of the traveler
     */
    function incrementCompletedStays(address traveler) external {
        if (!authorizedUpdaters[msg.sender]) revert NotAuthorized();

        uint256 tokenId = walletToTokenId[traveler];
        if (tokenId == 0) revert NoSBT();

        TravelerProfile storage profile = profiles[tokenId];
        if (profile.suspended) revert TravelerIsSuspended();

        profile.completedStays++;
        profile.lastActivityTimestamp = block.timestamp;
    }

    /**
     * @notice Record a cancelled booking
     * @param traveler Address of the traveler
     */
    function recordCancellation(address traveler) external {
        if (!authorizedUpdaters[msg.sender]) revert NotAuthorized();

        uint256 tokenId = walletToTokenId[traveler];
        if (tokenId == 0) revert NoSBT();

        TravelerProfile storage profile = profiles[tokenId];
        profile.cancelledBookings++;
        profile.lastActivityTimestamp = block.timestamp;
    }

    /**
     * @notice Update traveler rating after receiving a review from host
     * @param traveler Address of the traveler
     * @param rating Rating given by host (1-5)
     */
    function updateReputation(
        address traveler,
        uint8 rating,
        bool /* cancelled - kept for interface compatibility */
    ) external {
        if (!authorizedUpdaters[msg.sender]) revert NotAuthorized();
        if (rating < 1 || rating > 5) revert InvalidRating();

        uint256 tokenId = walletToTokenId[traveler];
        if (tokenId == 0) revert NoSBT();

        TravelerProfile storage profile = profiles[tokenId];

        if (profile.suspended) revert TravelerIsSuspended();

        profile.lastActivityTimestamp = block.timestamp;

        // Calculate weighted average rating
        uint256 oldTotal = profile.totalReviewsReceived;
        profile.totalReviewsReceived++;

        if (oldTotal == 0) {
            profile.averageRating = uint256(rating) * 100;
        } else {
            uint256 totalRatingPoints = profile.averageRating * oldTotal;
            profile.averageRating = (totalRatingPoints + (uint256(rating) * 100)) / profile.totalReviewsReceived;
        }

        if (rating >= 4) {
            profile.positiveReviews++;
        }

        // Update tier based on rating change
        ReputationTier oldTier = profile.tier;
        profile.tier = _calculateTier(profile);

        if (profile.tier != oldTier) {
            emit TierUpgraded(traveler, tokenId, oldTier, profile.tier);
        }

        emit ReputationUpdated(traveler, tokenId, profile.averageRating, profile.tier);
    }

    /**
     * @notice Link a booking to a traveler's profile
     * @param traveler Address of the traveler
     * @param tokenId The room type token ID
     * @param bookingIndex Index of the booking
     */
    function linkBooking(address traveler, uint256 tokenId, uint256 bookingIndex) external {
        if (!authorizedUpdaters[msg.sender]) revert NotAuthorized();

        uint256 sbtTokenId = walletToTokenId[traveler];
        if (sbtTokenId == 0) revert NoSBT();

        TravelerProfile storage profile = profiles[sbtTokenId];
        profile.lastActivityTimestamp = block.timestamp;

        emit BookingLinked(traveler, sbtTokenId, tokenId, bookingIndex);
    }

    /**
     * @notice Report a traveler for bad behavior
     * @param traveler Address of the traveler to report
     */
    function reportTraveler(address traveler) external {
        if (!authorizedUpdaters[msg.sender]) revert NotAuthorized();

        uint256 tokenId = walletToTokenId[traveler];
        if (tokenId == 0) revert NoSBT();

        TravelerProfile storage profile = profiles[tokenId];
        profile.timesReportedByHosts++;

        // Auto-suspend if reported 3+ times
        if (profile.timesReportedByHosts >= 3 && !profile.suspended) {
            profile.suspended = true;
            emit TravelerSuspended(traveler, tokenId);
        }
    }

    /**
     * @notice Suspend a traveler (admin only)
     * @param traveler Address to suspend
     */
    function suspendTraveler(address traveler) external onlyOwner {
        uint256 tokenId = walletToTokenId[traveler];
        if (tokenId == 0) revert NoSBT();

        profiles[tokenId].suspended = true;
        emit TravelerSuspended(traveler, tokenId);
    }

    /**
     * @notice Unsuspend a traveler (admin only)
     * @param traveler Address to unsuspend
     */
    function unsuspendTraveler(address traveler) external onlyOwner {
        uint256 tokenId = walletToTokenId[traveler];
        if (tokenId == 0) revert NoSBT();

        profiles[tokenId].suspended = false;
        emit TravelerUnsuspended(traveler, tokenId);
    }

    /*//////////////////////////////////////////////////////////////
                            INTERNAL LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calculate reputation tier based on profile stats
     */
    function _calculateTier(TravelerProfile memory profile) internal pure returns (ReputationTier) {
        if (profile.totalBookings < 6) {
            return ReputationTier.Newcomer;
        }

        if (profile.totalBookings < 21) {
            return ReputationTier.Regular;
        }

        // Elite: 51+ bookings AND avg >= 4.5 (check first!)
        if (profile.totalBookings >= 51 && profile.averageRating >= 450) {
            return ReputationTier.Elite;
        }

        // Trusted: 21+ bookings AND avg >= 4.0
        if (profile.totalBookings >= 21 && profile.averageRating >= 400) {
            return ReputationTier.Trusted;
        }

        return ReputationTier.Regular;
    }

    /*//////////////////////////////////////////////////////////////
                        SOULBOUND OVERRIDES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Override to make token non-transferable (soulbound)
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0))
        // Block all transfers (from != address(0) && to != address(0))
        if (from != address(0) && to != address(0)) {
            revert SoulboundToken();
        }

        return super._update(to, tokenId, auth);
    }

    /*//////////////////////////////////////////////////////////////
                            METADATA
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Generate dynamic SVG based on traveler's reputation
     */
    function _generateSVG(TravelerProfile memory profile) internal pure returns (string memory) {
        // Tier colors
        string memory tierColor;
        string memory tierName;

        if (profile.tier == ReputationTier.Elite) {
            tierColor = "#FFD700"; // Gold
            tierName = "ELITE";
        } else if (profile.tier == ReputationTier.Trusted) {
            tierColor = "#C0C0C0"; // Silver
            tierName = "TRUSTED";
        } else if (profile.tier == ReputationTier.Regular) {
            tierColor = "#CD7F32"; // Bronze
            tierName = "REGULAR";
        } else {
            tierColor = "#94A3B8"; // Gray
            tierName = "NEWCOMER";
        }

        return
            string(
                abi.encodePacked(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="350" height="500" viewBox="0 0 350 500">',
                    "<defs>",
                    '<linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">',
                    '<stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />',
                    '<stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />',
                    "</linearGradient>",
                    "</defs>",
                    '<rect width="350" height="500" fill="url(#bg)"/>',
                    '<circle cx="175" cy="100" r="60" fill="',
                    tierColor,
                    '" opacity="0.2"/>',
                    '<text x="175" y="110" font-family="Arial" font-size="48" fill="',
                    tierColor,
                    '" text-anchor="middle">&#9992;</text>',
                    '<text x="175" y="180" font-family="Arial" font-size="24" font-weight="bold" fill="white" text-anchor="middle">TRAVELER</text>',
                    '<text x="175" y="210" font-family="Arial" font-size="18" fill="',
                    tierColor,
                    '" text-anchor="middle">',
                    tierName,
                    "</text>",
                    '<text x="175" y="260" font-family="Arial" font-size="16" fill="white" text-anchor="middle">Rating: ',
                    _formatRating(profile.averageRating),
                    "</text>",
                    '<text x="175" y="290" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Completed Stays: ',
                    profile.completedStays.toString(),
                    "</text>",
                    '<text x="175" y="320" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Total Bookings: ',
                    profile.totalBookings.toString(),
                    "</text>",
                    profile.suspended
                        ? '<text x="175" y="400" font-family="Arial" font-size="20" fill="#ef4444" text-anchor="middle">SUSPENDED</text>'
                        : "",
                    "</svg>"
                )
            );
    }

    function _formatRating(uint256 rating) internal pure returns (string memory) {
        if (rating == 0) return "N/A";
        uint256 whole = rating / 100;
        uint256 decimal = rating % 100;
        return string(abi.encodePacked(whole.toString(), ".", decimal < 10 ? "0" : "", (decimal / 10).toString()));
    }

    /**
     * @notice Generate dynamic metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        TravelerProfile memory profile = profiles[tokenId];
        string memory svg = _generateSVG(profile);

        string memory tierName = ["Newcomer", "Regular", "Trusted", "Elite"][uint256(profile.tier)];

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"Traveler Badge #',
                        tokenId.toString(),
                        '",',
                        '"description":"Soulbound token representing a verified traveler with on-chain reputation",',
                        '"image":"data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '",',
                        '"attributes":[',
                        '{"trait_type":"Tier","value":"',
                        tierName,
                        '"},',
                        '{"trait_type":"Total Bookings","value":',
                        profile.totalBookings.toString(),
                        "},",
                        '{"trait_type":"Completed Stays","value":',
                        profile.completedStays.toString(),
                        "},",
                        '{"trait_type":"Average Rating","value":',
                        profile.averageRating.toString(),
                        "},",
                        '{"trait_type":"Reviews Received","value":',
                        profile.totalReviewsReceived.toString(),
                        "},",
                        '{"trait_type":"Positive Reviews","value":',
                        profile.positiveReviews.toString(),
                        "},",
                        '{"trait_type":"Member Since","value":',
                        profile.memberSince.toString(),
                        "},",
                        '{"trait_type":"Suspended","value":"',
                        profile.suspended ? "true" : "false",
                        '"}',
                        "]}"
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set authorized updater (EscrowFactory, ReviewValidator, etc.)
     * @param updater Address of the updater contract
     * @param authorized Whether the updater is authorized
     */
    function setAuthorizedUpdater(address updater, bool authorized) external onlyOwner {
        authorizedUpdaters[updater] = authorized;
        emit AuthorizedUpdaterSet(updater, authorized);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Check if an address has a TravelerSBT
     */
    function hasSBT(address wallet) external view returns (bool) {
        return walletToTokenId[wallet] != 0;
    }

    /**
     * @notice Get traveler profile by wallet address
     */
    function getProfile(address wallet) external view returns (TravelerProfile memory) {
        uint256 tokenId = walletToTokenId[wallet];
        if (tokenId == 0) revert NoSBT();
        return profiles[tokenId];
    }

    /**
     * @notice Get success rate (completed vs cancelled)
     */
    function getSuccessRate(address wallet) external view returns (uint256) {
        uint256 tokenId = walletToTokenId[wallet];
        if (tokenId == 0) revert NoSBT();

        TravelerProfile memory profile = profiles[tokenId];
        if (profile.totalBookings == 0) return 0;

        return (profile.completedStays * 10000) / profile.totalBookings; // Basis points
    }
}
