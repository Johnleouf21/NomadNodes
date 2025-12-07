// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title HostSBT
 * @notice Soulbound Token (non-transferable) for property hosts with integrated reputation system
 * @dev Each wallet can only own one HostSBT. Reputation is updated after guest stays.
 */
contract HostSBT is ERC721, Ownable {
    using Strings for uint256;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct HostProfile {
        // Reputation metrics
        uint256 totalPropertiesListed;
        uint256 totalBookingsReceived;
        uint256 completedBookings;
        uint256 averageRating; // 0-500 (5.00 stars = 500)
        uint256 totalReviewsReceived;
        uint256 positiveReviews; // 4-5 stars
        // Performance metrics
        uint256 averageResponseTime; // in minutes
        uint256 acceptanceRate; // 0-10000 basis points (100% = 10000)
        uint256 cancellationsByHost;
        // Metadata
        uint256 memberSince;
        uint256 lastActivityTimestamp;
        ReputationTier tier;
        bool superHost; // Elite status
        // Moderation
        uint256 timesReportedByTravelers;
        bool suspended;
    }

    enum ReputationTier {
        Newcomer, // 0-5 bookings
        Experienced, // 6-20 bookings
        Pro, // 21-50 bookings, avg >= 4.0
        SuperHost // 50+ bookings, avg >= 4.7, response < 120min
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    mapping(uint256 => HostProfile) public profiles;
    mapping(address => uint256) public walletToTokenId;
    mapping(uint256 => uint256[]) public hostProperties; // tokenId => propertyIds[]

    uint256 private _tokenIdCounter;

    // Authorized contracts that can update reputation
    mapping(address => bool) public authorizedUpdaters;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event HostMinted(address indexed host, uint256 indexed tokenId);
    event ReputationUpdated(address indexed host, uint256 indexed tokenId, uint256 newRating, ReputationTier newTier);
    event TierUpgraded(address indexed host, uint256 indexed tokenId, ReputationTier oldTier, ReputationTier newTier);
    event SuperHostAwarded(address indexed host, uint256 indexed tokenId);
    event SuperHostRevoked(address indexed host, uint256 indexed tokenId);
    event PropertyLinked(uint256 indexed tokenId, uint256 indexed propertyId);
    event PropertyUnlinked(uint256 indexed tokenId, uint256 indexed propertyId);
    event HostSuspended(address indexed host, uint256 indexed tokenId);
    event HostUnsuspended(address indexed host, uint256 indexed tokenId);
    event AuthorizedUpdaterSet(address indexed updater, bool authorized);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error AlreadyHasSBT();
    error NoSBT();
    error SoulboundToken();
    error NotAuthorized();
    error InvalidRating();
    error HostIsSuspended();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() ERC721("Host SBT", "HOST") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start at 1
    }

    /*//////////////////////////////////////////////////////////////
                            MINTING LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mint a HostSBT for a new property host
     * @param to Address to mint the SBT to
     */
    function mint(address to) external returns (uint256) {
        if (walletToTokenId[to] != 0) revert AlreadyHasSBT();

        uint256 tokenId = _tokenIdCounter++;

        _safeMint(to, tokenId);

        profiles[tokenId] = HostProfile({
            totalPropertiesListed: 0,
            totalBookingsReceived: 0,
            completedBookings: 0,
            averageRating: 0,
            totalReviewsReceived: 0,
            positiveReviews: 0,
            averageResponseTime: 0,
            acceptanceRate: 10000, // Start at 100%
            cancellationsByHost: 0,
            memberSince: block.timestamp,
            lastActivityTimestamp: block.timestamp,
            tier: ReputationTier.Newcomer,
            superHost: false,
            timesReportedByTravelers: 0,
            suspended: false
        });

        walletToTokenId[to] = tokenId;

        emit HostMinted(to, tokenId);

        return tokenId;
    }

    /*//////////////////////////////////////////////////////////////
                        REPUTATION UPDATES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Increment booking received count when a booking is confirmed
     * @param host Address of the host
     */
    function incrementBookingReceived(address host) external {
        if (!authorizedUpdaters[msg.sender]) revert NotAuthorized();

        uint256 tokenId = walletToTokenId[host];
        if (tokenId == 0) revert NoSBT();

        HostProfile storage profile = profiles[tokenId];
        if (profile.suspended) revert HostIsSuspended();

        profile.totalBookingsReceived++;
        profile.lastActivityTimestamp = block.timestamp;

        // Update tier based on new booking count
        ReputationTier oldTier = profile.tier;
        profile.tier = _calculateTier(profile);

        if (profile.tier != oldTier) {
            emit TierUpgraded(host, tokenId, oldTier, profile.tier);
        }
    }

    /**
     * @notice Increment completed bookings when a booking is completed
     * @param host Address of the host
     */
    function incrementCompletedBooking(address host) external {
        if (!authorizedUpdaters[msg.sender]) revert NotAuthorized();

        uint256 tokenId = walletToTokenId[host];
        if (tokenId == 0) revert NoSBT();

        HostProfile storage profile = profiles[tokenId];
        if (profile.suspended) revert HostIsSuspended();

        profile.completedBookings++;
        profile.lastActivityTimestamp = block.timestamp;

        // Check SuperHost status
        bool wasSuperHost = profile.superHost;
        profile.superHost = _calculateSuperHost(profile);

        if (profile.superHost && !wasSuperHost) {
            emit SuperHostAwarded(host, tokenId);
        } else if (!profile.superHost && wasSuperHost) {
            emit SuperHostRevoked(host, tokenId);
        }
    }

    /**
     * @notice Update host rating after receiving a review from traveler
     * @param host Address of the host
     * @param rating Rating given by traveler (1-5)
     * @param responseTime Response time in minutes
     */
    function updateReputation(address host, uint8 rating, uint256 responseTime) external {
        if (!authorizedUpdaters[msg.sender]) revert NotAuthorized();
        if (rating < 1 || rating > 5) revert InvalidRating();

        uint256 tokenId = walletToTokenId[host];
        if (tokenId == 0) revert NoSBT();

        HostProfile storage profile = profiles[tokenId];

        if (profile.suspended) revert HostIsSuspended();

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

        // Update average response time
        if (oldTotal == 0) {
            profile.averageResponseTime = responseTime;
        } else {
            profile.averageResponseTime =
                (profile.averageResponseTime * oldTotal + responseTime) / profile.totalReviewsReceived;
        }

        // Update tier based on rating change
        ReputationTier oldTier = profile.tier;
        profile.tier = _calculateTier(profile);

        if (profile.tier != oldTier) {
            emit TierUpgraded(host, tokenId, oldTier, profile.tier);
        }

        // Check SuperHost status
        bool wasSuperHost = profile.superHost;
        profile.superHost = _calculateSuperHost(profile);

        if (profile.superHost && !wasSuperHost) {
            emit SuperHostAwarded(host, tokenId);
        } else if (!profile.superHost && wasSuperHost) {
            emit SuperHostRevoked(host, tokenId);
        }

        emit ReputationUpdated(host, tokenId, profile.averageRating, profile.tier);
    }

    /**
     * @notice Record a cancellation by the host
     * @param host Address of the host
     */
    function recordCancellation(address host) external {
        if (!authorizedUpdaters[msg.sender]) revert NotAuthorized();

        uint256 tokenId = walletToTokenId[host];
        if (tokenId == 0) revert NoSBT();

        HostProfile storage profile = profiles[tokenId];
        profile.cancellationsByHost++;

        // Recalculate SuperHost status
        bool wasSuperHost = profile.superHost;
        profile.superHost = _calculateSuperHost(profile);

        if (!profile.superHost && wasSuperHost) {
            emit SuperHostRevoked(host, tokenId);
        }
    }

    /**
     * @notice Link a property to a host
     * @param host Address of the host
     * @param propertyId ID of the property
     */
    function linkProperty(address host, uint256 propertyId) external {
        if (!authorizedUpdaters[msg.sender]) revert NotAuthorized();

        uint256 tokenId = walletToTokenId[host];
        if (tokenId == 0) revert NoSBT();

        HostProfile storage profile = profiles[tokenId];
        profile.totalPropertiesListed++;

        hostProperties[tokenId].push(propertyId);

        emit PropertyLinked(tokenId, propertyId);
    }

    /**
     * @notice Unlink a property from a host
     * @param host Address of the host
     * @param propertyId ID of the property
     */
    function unlinkProperty(address host, uint256 propertyId) external {
        if (!authorizedUpdaters[msg.sender]) revert NotAuthorized();

        uint256 tokenId = walletToTokenId[host];
        if (tokenId == 0) revert NoSBT();

        HostProfile storage profile = profiles[tokenId];
        if (profile.totalPropertiesListed > 0) {
            profile.totalPropertiesListed--;
        }

        // Remove from array
        uint256[] storage properties = hostProperties[tokenId];
        for (uint256 i = 0; i < properties.length; i++) {
            if (properties[i] == propertyId) {
                properties[i] = properties[properties.length - 1];
                properties.pop();
                break;
            }
        }

        emit PropertyUnlinked(tokenId, propertyId);
    }

    /**
     * @notice Report a host for bad behavior
     * @param host Address of the host to report
     */
    function reportHost(address host) external {
        if (!authorizedUpdaters[msg.sender]) revert NotAuthorized();

        uint256 tokenId = walletToTokenId[host];
        if (tokenId == 0) revert NoSBT();

        HostProfile storage profile = profiles[tokenId];
        profile.timesReportedByTravelers++;

        // Auto-suspend if reported 3+ times
        if (profile.timesReportedByTravelers >= 3 && !profile.suspended) {
            profile.suspended = true;
            profile.superHost = false;
            emit HostSuspended(host, tokenId);
        }
    }

    /**
     * @notice Suspend a host (admin only)
     * @param host Address to suspend
     */
    function suspendHost(address host) external onlyOwner {
        uint256 tokenId = walletToTokenId[host];
        if (tokenId == 0) revert NoSBT();

        profiles[tokenId].suspended = true;
        profiles[tokenId].superHost = false;
        emit HostSuspended(host, tokenId);
    }

    /**
     * @notice Unsuspend a host (admin only)
     * @param host Address to unsuspend
     */
    function unsuspendHost(address host) external onlyOwner {
        uint256 tokenId = walletToTokenId[host];
        if (tokenId == 0) revert NoSBT();

        profiles[tokenId].suspended = false;
        emit HostUnsuspended(host, tokenId);
    }

    /*//////////////////////////////////////////////////////////////
                            INTERNAL LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calculate reputation tier based on profile stats
     */
    function _calculateTier(HostProfile memory profile) internal pure returns (ReputationTier) {
        if (profile.totalBookingsReceived < 6) {
            return ReputationTier.Newcomer;
        }

        if (profile.totalBookingsReceived < 21) {
            return ReputationTier.Experienced;
        }

        // SuperHost: 50+ bookings AND avg >= 4.7 AND response time <= 2h
        if (profile.totalBookingsReceived >= 51 && profile.averageRating >= 470 && profile.averageResponseTime <= 120) {
            return ReputationTier.SuperHost;
        }

        // Pro: 21+ bookings AND avg >= 4.0
        if (profile.totalBookingsReceived >= 21 && profile.averageRating >= 400) {
            return ReputationTier.Pro;
        }

        return ReputationTier.Experienced;
    }

    /**
     * @notice Calculate SuperHost status
     */
    function _calculateSuperHost(HostProfile memory profile) internal pure returns (bool) {
        return (profile.totalBookingsReceived >= 50 &&
            profile.averageRating >= 470 && // 4.7 stars
            profile.averageResponseTime <= 120 && // 2 hours
            profile.cancellationsByHost <= 2 &&
            !profile.suspended);
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
     * @notice Generate dynamic SVG based on host's reputation
     */
    function _generateSVG(HostProfile memory profile) internal pure returns (string memory) {
        // Tier colors
        string memory tierColor;
        string memory tierName;

        if (profile.superHost) {
            tierColor = "#FF1493"; // Pink/magenta for SuperHost
            tierName = "SUPERHOST";
        } else if (profile.tier == ReputationTier.Pro) {
            tierColor = "#FFD700"; // Gold
            tierName = "PRO";
        } else if (profile.tier == ReputationTier.Experienced) {
            tierColor = "#C0C0C0"; // Silver
            tierName = "EXPERIENCED";
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
                    '<stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />',
                    '<stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />',
                    "</linearGradient>",
                    "</defs>",
                    '<rect width="350" height="500" fill="url(#bg)"/>',
                    '<circle cx="175" cy="100" r="60" fill="',
                    tierColor,
                    '" opacity="0.2"/>',
                    '<text x="175" y="115" font-family="Arial" font-size="48" fill="',
                    tierColor,
                    '" text-anchor="middle">&#127968;</text>',
                    '<text x="175" y="180" font-family="Arial" font-size="24" font-weight="bold" fill="white" text-anchor="middle">HOST</text>',
                    '<text x="175" y="210" font-family="Arial" font-size="18" fill="',
                    tierColor,
                    '" text-anchor="middle">',
                    tierName,
                    "</text>",
                    '<text x="175" y="260" font-family="Arial" font-size="16" fill="white" text-anchor="middle">Rating: ',
                    _formatRating(profile.averageRating),
                    "</text>",
                    '<text x="175" y="290" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Properties: ',
                    profile.totalPropertiesListed.toString(),
                    "</text>",
                    '<text x="175" y="320" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Bookings: ',
                    profile.completedBookings.toString(),
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

        HostProfile memory profile = profiles[tokenId];
        string memory svg = _generateSVG(profile);

        string memory tierName = profile.superHost
            ? "SuperHost"
            : ["Newcomer", "Experienced", "Pro", "SuperHost"][uint256(profile.tier)];

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"Host Badge #',
                        tokenId.toString(),
                        '",',
                        '"description":"Soulbound token representing a verified property host with on-chain reputation",',
                        '"image":"data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '",',
                        '"attributes":[',
                        '{"trait_type":"Tier","value":"',
                        tierName,
                        '"},',
                        '{"trait_type":"SuperHost","value":"',
                        profile.superHost ? "true" : "false",
                        '"},',
                        '{"trait_type":"Properties Listed","value":',
                        profile.totalPropertiesListed.toString(),
                        "},",
                        '{"trait_type":"Total Bookings","value":',
                        profile.totalBookingsReceived.toString(),
                        "},",
                        '{"trait_type":"Completed Bookings","value":',
                        profile.completedBookings.toString(),
                        "},",
                        '{"trait_type":"Average Rating","value":',
                        profile.averageRating.toString(),
                        "},",
                        '{"trait_type":"Response Time (min)","value":',
                        profile.averageResponseTime.toString(),
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
     * @notice Set authorized updater (PropertyRWA, ReviewValidator, etc.)
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
     * @notice Check if an address has a HostSBT
     */
    function hasSBT(address wallet) external view returns (bool) {
        return walletToTokenId[wallet] != 0;
    }

    /**
     * @notice Get host profile by wallet address
     */
    function getProfile(address wallet) external view returns (HostProfile memory) {
        uint256 tokenId = walletToTokenId[wallet];
        if (tokenId == 0) revert NoSBT();
        return profiles[tokenId];
    }

    /**
     * @notice Get host's properties
     */
    function getHostProperties(address wallet) external view returns (uint256[] memory) {
        uint256 tokenId = walletToTokenId[wallet];
        if (tokenId == 0) revert NoSBT();
        return hostProperties[tokenId];
    }

    /**
     * @notice Get completion rate (completed vs total)
     */
    function getCompletionRate(address wallet) external view returns (uint256) {
        uint256 tokenId = walletToTokenId[wallet];
        if (tokenId == 0) revert NoSBT();

        HostProfile memory profile = profiles[tokenId];
        if (profile.totalBookingsReceived == 0) return 10000; // 100%

        return (profile.completedBookings * 10000) / profile.totalBookingsReceived; // Basis points
    }
}
