"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import {
  Calendar,
  MapPin,
  Star,
  Clock,
  Loader2,
  User,
  MessageSquare,
  TrendingUp,
  DollarSign,
  XCircle,
  Home,
  BedDouble,
  Eye,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  LogIn,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useRouter, useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAccount, useReadContracts } from "wagmi";
import { usePonderBookings, type PonderBooking } from "@/hooks/usePonderBookings";
import { CONTRACTS } from "@/lib/contracts";
import { usePonderPropertiesWithMetadata } from "@/hooks/usePonderPropertiesWithMetadata";
import {
  usePonderTraveler,
  formatTravelerRating,
  getTierColor,
  getTierEmoji,
  type TravelerTier,
} from "@/hooks/usePonderTraveler";
import { CheckInScanner } from "@/components/booking/CheckInScanner";
import { usePonderReviews, renderStars } from "@/hooks/usePonderReviews";
import { getIPFSUrl, fetchFromIPFS } from "@/lib/utils/ipfs";
import { useQuery } from "@tanstack/react-query";
import {
  BookingDetailSheet,
  CancelBookingModal,
  RoomDetailModal,
  CompleteStayButton,
} from "./booking";
import { ReviewSubmissionForm, type ReviewableBooking, ReviewsModal } from "@/components/review";
import { BookingMessaging } from "@/components/messaging";
import type { RoomTypeData } from "@/lib/hooks/property/types";
import type { Address } from "viem";
import { toast } from "sonner";

interface BookingSummary {
  id: string;
  propertyId: string;
  propertyName: string;
  roomTypeId: string;
  roomName: string;
  tokenId: string;
  bookingIndex: string;
  location: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  total: number;
  currency?: "USD" | "EUR";
  status: "upcoming" | "past" | "cancelled";
  ponderStatus: PonderBooking["status"];
  image: string;
  escrowAddress: string | null;
  hostAddress: Address | null;
  travelerAddress: Address;
}

interface RoomTypeInfo {
  id: string;
  tokenId: string;
  propertyId: string;
  name: string;
  ipfsHash?: string;
  currency?: "USD" | "EUR";
}

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

// Fetch room types for multiple properties (with IPFS metadata for currency)
async function fetchRoomTypesForBookings(
  propertyIds: string[]
): Promise<Map<string, RoomTypeInfo[]>> {
  if (propertyIds.length === 0) return new Map();

  const propertyIdList = propertyIds.map((id) => `"${id}"`).join(", ");

  const graphqlQuery = `
    query {
      roomTypes(where: { propertyId_in: [${propertyIdList}] }, limit: 1000) {
        items {
          id
          tokenId
          propertyId
          name
          ipfsHash
        }
      }
    }
  `;

  const response = await fetch(`${PONDER_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: graphqlQuery }),
  });

  if (!response.ok) throw new Error("Failed to fetch room types");

  const result = await response.json();
  if (result.errors) throw new Error(result.errors[0]?.message || "GraphQL error");

  const roomTypes = result.data?.roomTypes?.items || [];
  const grouped = new Map<string, RoomTypeInfo[]>();

  // Fetch IPFS metadata for each room type to get currency
  const roomTypesWithCurrency = await Promise.all(
    roomTypes.map(async (rt: any) => {
      let currency: "USD" | "EUR" = "USD"; // Default to USD
      if (rt.ipfsHash) {
        try {
          const metadata = await fetchFromIPFS<RoomTypeData>(rt.ipfsHash);
          if (metadata?.currency) {
            currency = metadata.currency;
          }
        } catch {
          // Ignore IPFS fetch errors, use default currency
        }
      }
      return { ...rt, currency };
    })
  );

  for (const rt of roomTypesWithCurrency) {
    const existing = grouped.get(rt.propertyId) || [];
    existing.push(rt);
    grouped.set(rt.propertyId, existing);
  }

  return grouped;
}

// Status filter type for past bookings
type PastBookingStatusFilter = "all" | "Completed" | "Cancelled";

export function TravelerDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState("upcoming");
  const [pastStatusFilter, setPastStatusFilter] = React.useState<PastBookingStatusFilter>("all");
  const { address } = useAccount();

  // Read tab and status from URL query parameters
  React.useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["upcoming", "past"].includes(tab)) {
      setActiveTab(tab);
    }

    // Read status filter for past bookings tab
    const status = searchParams.get("status");
    if (status && ["all", "Completed", "Cancelled"].includes(status)) {
      setPastStatusFilter(status as PastBookingStatusFilter);
    }
  }, [searchParams]);

  // Modal states
  const [selectedBooking, setSelectedBooking] = React.useState<BookingSummary | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = React.useState(false);
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
  const [roomModalOpen, setRoomModalOpen] = React.useState(false);
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = React.useState(false);
  const [messagingOpen, setMessagingOpen] = React.useState(false);

  // Track bookings that were just reviewed (for instant UI feedback before refetch)
  const [justReviewedBookings, setJustReviewedBookings] = React.useState<Set<string>>(new Set());

  // Fetch traveler profile from Ponder
  const { traveler, loading: loadingTraveler } = usePonderTraveler({
    walletAddress: address,
  });

  // Fetch reviews given by this traveler
  const {
    reviews: reviewsGiven,
    loading: _loadingReviewsGiven,
    refetch: refetchReviewsGiven,
  } = usePonderReviews({
    reviewerAddress: address,
  });

  // Fetch reviews received by this traveler
  const { reviews: reviewsReceived, loading: _loadingReviewsReceived } = usePonderReviews({
    revieweeAddress: address,
  });

  // Calculate average rating from reviews, excluding flagged ones
  const { calculatedAvgRating, nonFlaggedReviewCount } = React.useMemo(() => {
    const nonFlagged = reviewsReceived.filter((r) => !r.isFlagged);
    if (nonFlagged.length === 0) return { calculatedAvgRating: null, nonFlaggedReviewCount: 0 };
    const sum = nonFlagged.reduce((acc, r) => acc + r.rating, 0);
    return {
      calculatedAvgRating: sum / nonFlagged.length,
      nonFlaggedReviewCount: nonFlagged.length,
    };
  }, [reviewsReceived]);

  // Batch fetch review data from contract to get escrowId for each review
  const reviewContractCalls = React.useMemo(() => {
    if (!reviewsGiven || reviewsGiven.length === 0) return [];
    return reviewsGiven.map((review) => ({
      ...CONTRACTS.reviewValidator,
      functionName: "getReview" as const,
      args: [BigInt(review.reviewId)],
    }));
  }, [reviewsGiven]);

  const { data: reviewContractData } = useReadContracts({
    contracts: reviewContractCalls,
    query: {
      enabled: reviewContractCalls.length > 0,
    },
  } as any);

  // Extract escrowIds from review contract data
  // The result is a struct with named properties: { reviewId, escrowId, propertyId, bookingIndex, ... }
  const escrowIds = React.useMemo(() => {
    if (!reviewContractData) return [];
    const ids = reviewContractData
      .filter((result: any) => result.status === "success" && result.result)
      .map((result: any) => {
        // result.result is a struct with named properties
        const reviewStruct = result.result as { escrowId: bigint };
        return reviewStruct.escrowId;
      });
    return ids;
  }, [reviewContractData]);

  // Batch fetch escrow addresses from EscrowFactory
  const escrowAddressCalls = React.useMemo(() => {
    if (escrowIds.length === 0) return [];
    return escrowIds.map((escrowId) => ({
      address: CONTRACTS.escrowFactory.address,
      abi: CONTRACTS.escrowFactory.abi,
      functionName: "escrows" as const,
      args: [escrowId] as const,
    }));
  }, [escrowIds]);

  const { data: escrowAddressData } = useReadContracts({
    contracts: escrowAddressCalls,
    query: {
      enabled: escrowAddressCalls.length > 0,
    },
  } as any);

  // Build Set of reviewed escrow addresses
  const reviewedEscrowAddresses = React.useMemo(() => {
    const addresses = new Set<string>();
    if (!escrowAddressData) {
      return addresses;
    }

    (escrowAddressData as any[]).forEach((result: any) => {
      if (result.status === "success" && result.result) {
        const addr = (result.result as string).toLowerCase();
        addresses.add(addr);
      }
    });

    return addresses;
  }, [escrowAddressData]);

  // Fetch bookings from Ponder
  const {
    bookings: ponderBookings,
    loading: loadingBookings,
    refetch: refetchBookings,
  } = usePonderBookings({
    travelerAddress: address?.toLowerCase(),
  });

  // Fetch all properties to get metadata
  const { allProperties, loading: loadingProperties } = usePonderPropertiesWithMetadata({
    isActive: true,
    pageSize: 100,
  });

  // Get unique property IDs from bookings
  const propertyIds = React.useMemo(() => {
    if (!ponderBookings) return [];
    return [...new Set(ponderBookings.map((b: PonderBooking) => b.propertyId))];
  }, [ponderBookings]);

  // Fetch room types for booking properties
  const { data: roomTypesMap } = useQuery({
    queryKey: ["roomTypesForBookings", propertyIds],
    queryFn: () => fetchRoomTypesForBookings(propertyIds),
    enabled: propertyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Transform Ponder bookings to BookingSummary format
  const bookings: BookingSummary[] = React.useMemo(() => {
    if (!ponderBookings || ponderBookings.length === 0) return [];

    const now = Date.now();

    return ponderBookings.map((booking: PonderBooking) => {
      // Find property metadata
      const property = allProperties.find((p) => p.propertyId.toString() === booking.propertyId);
      const metadata = property?.metadata;

      // Find room type name
      const propertyRoomTypes = roomTypesMap?.get(booking.propertyId) || [];
      const roomType = propertyRoomTypes.find((rt) => rt.tokenId === booking.tokenId);
      const roomName = roomType?.name || `Room #${booking.roomTypeId}`;

      const checkIn = new Date(Number(booking.checkInDate) * 1000);
      const checkOut = new Date(Number(booking.checkOutDate) * 1000);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

      // Determine status based on dates and ponder status
      let status: "upcoming" | "past" | "cancelled" = "upcoming";
      if (booking.status === "Cancelled") {
        status = "cancelled";
      } else if (booking.status === "Completed" || checkOut.getTime() < now) {
        status = "past";
      }

      // Check if image is an external URL or IPFS hash
      let imageUrl = "";
      if (metadata?.images?.[0]) {
        const img = metadata.images[0];
        imageUrl = img.startsWith("http") ? img : getIPFSUrl(img);
      }

      return {
        id: booking.id,
        propertyId: booking.propertyId,
        propertyName: metadata?.name || `Property #${booking.propertyId}`,
        roomTypeId: booking.roomTypeId,
        roomName,
        tokenId: booking.tokenId,
        bookingIndex: booking.bookingIndex,
        location:
          metadata?.city && metadata?.country
            ? `${metadata.city}, ${metadata.country}`
            : metadata?.location || "Location not available",
        checkIn,
        checkOut,
        nights,
        total: Number(booking.totalPrice || 0) / 1e6, // Convert from stablecoin decimals
        currency: roomType?.currency || "USD",
        status,
        ponderStatus: booking.status,
        image: imageUrl,
        escrowAddress: booking.escrowAddress,
        hostAddress: (property?.host as Address) || null,
        travelerAddress: booking.traveler as Address,
      };
    });
  }, [ponderBookings, allProperties, roomTypesMap]);

  const upcomingBookings = bookings.filter((b) => b.status === "upcoming");
  const pastBookings = bookings.filter((b) => b.status === "past" || b.status === "cancelled");

  // Calculate booking counts by ponder status for past bookings
  const pastBookingCounts = React.useMemo(() => {
    return {
      all: pastBookings.length,
      Completed: pastBookings.filter((b) => b.ponderStatus === "Completed").length,
      Cancelled: pastBookings.filter((b) => b.ponderStatus === "Cancelled").length,
    };
  }, [pastBookings]);

  // Filter past bookings by status
  const filteredPastBookings = React.useMemo(() => {
    if (pastStatusFilter === "all") return pastBookings;
    return pastBookings.filter((b) => b.ponderStatus === pastStatusFilter);
  }, [pastBookings, pastStatusFilter]);

  // Calculate total spent (only from completed bookings)
  const totalSpent = React.useMemo(() => {
    return bookings
      .filter((b) => b.ponderStatus === "Completed")
      .reduce((sum, b) => sum + b.total, 0);
  }, [bookings]);

  // Calculate total nights from all bookings
  const totalNights = React.useMemo(() => {
    return bookings.reduce((sum, b) => sum + b.nights, 0);
  }, [bookings]);

  // Get next check-in date
  const nextCheckIn = React.useMemo(() => {
    if (upcomingBookings.length === 0) return null;
    const sorted = [...upcomingBookings].sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());
    return sorted[0]?.checkIn || null;
  }, [upcomingBookings]);

  // Count unique properties visited
  const uniqueProperties = React.useMemo(() => {
    const propertySet = new Set(
      bookings.filter((b) => b.ponderStatus === "Completed").map((b) => b.propertyId)
    );
    return propertySet.size;
  }, [bookings]);

  // Count completed bookings
  const completedBookingsCount = React.useMemo(() => {
    return bookings.filter((b) => b.ponderStatus === "Completed").length;
  }, [bookings]);

  // Calculate detailed pending actions for travelers
  const pendingActions = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime() / 1000;
    const todayEnd = todayStart + 86400; // End of today in seconds
    const nowTimestamp = Date.now() / 1000;

    // Bookings where traveler can confirm arrival (CheckedIn status on check-in day)
    // Actually, for travelers, they need to confirmStay on check-in day
    // Looking at the smart contract flow - travelers confirm after being checked in by host
    const toConfirmArrival = bookings.filter((b) => {
      if (b.ponderStatus !== "CheckedIn") return false;
      // Traveler can confirm arrival on check-in day
      const checkInTimestamp = b.checkIn.getTime() / 1000;
      return checkInTimestamp >= todayStart && checkInTimestamp < todayEnd;
    });

    // Bookings ready for completion or review
    // This includes:
    // - CheckedIn bookings past check-in day (need completion or review if escrow already completed)
    // - Completed bookings without review
    const reviewedHosts = new Set(
      reviewsGiven.map((r) => `${r.propertyId}-${r.reviewee.toLowerCase()}`)
    );

    const toCompleteOrReview = bookings.filter((b) => {
      if (!b.hostAddress) return false;
      if (!b.escrowAddress) return false;

      // Already reviewed? Skip
      const key = `${b.propertyId}-${b.hostAddress.toLowerCase()}`;
      if (reviewedHosts.has(key)) return false;

      // Just reviewed in this session? Skip (instant feedback before refetch)
      if (justReviewedBookings.has(b.id)) return false;

      // Completed status in Ponder = definitely needs review
      if (b.ponderStatus === "Completed") return true;

      // CheckedIn + past check-in day = needs completion OR review (escrow might be already completed)
      if (b.ponderStatus === "CheckedIn") {
        const checkInDayEnd = Math.floor(b.checkIn.getTime() / 1000 / 86400) * 86400 + 86400 - 1;
        return nowTimestamp > checkInDayEnd;
      }

      return false;
    });

    // Upcoming check-ins today (Confirmed status, check-in date is today)
    const checkInsToday = bookings.filter((b) => {
      if (b.ponderStatus !== "Confirmed") return false;
      const checkInTimestamp = b.checkIn.getTime() / 1000;
      return checkInTimestamp >= todayStart && checkInTimestamp < todayEnd;
    });

    return {
      total: toConfirmArrival.length + toCompleteOrReview.length + checkInsToday.length,
      toConfirmArrival,
      toCompleteOrReview,
      checkInsToday,
    };
  }, [bookings, reviewsGiven, justReviewedBookings]);

  const isLoading = loadingBookings || loadingProperties || loadingTraveler;

  // Handlers
  const handleBookingClick = (booking: BookingSummary) => {
    setSelectedBooking(booking);
    setDetailSheetOpen(true);
  };

  const handleCancelClick = () => {
    setCancelModalOpen(true);
  };

  const handleReviewClick = () => {
    if (selectedBooking) {
      setDetailSheetOpen(false);
      setReviewModalOpen(true);
    }
  };

  const handleRoomClick = (booking: BookingSummary) => {
    setSelectedBooking(booking);
    setRoomModalOpen(true);
  };

  const handleCancelSuccess = () => {
    refetchBookings();
  };

  return (
    <ProtectedRoute requireSBT="any">
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{t("dashboard.traveler_dashboard")}</h1>
          <p className="text-muted-foreground">{t("nav.my_bookings")}</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            <span className="text-muted-foreground ml-2">Loading dashboard...</span>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Profile Card */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
                  {/* Avatar */}
                  <div className="from-primary/20 to-primary/40 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br">
                    <User className="text-primary h-10 w-10" />
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h2 className="text-2xl font-bold">
                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Anonymous"}
                      </h2>
                      {traveler && (
                        <Badge className={`${getTierColor(traveler.tier as TravelerTier)} border`}>
                          {getTierEmoji(traveler.tier as TravelerTier)} {traveler.tier}
                        </Badge>
                      )}
                    </div>

                    <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                      {traveler && (
                        <>
                          <button
                            onClick={() => setReviewsModalOpen(true)}
                            className="hover:bg-muted flex items-center gap-1 rounded-md px-2 py-1 transition-colors"
                          >
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            <span className="text-foreground font-medium">
                              {calculatedAvgRating !== null
                                ? calculatedAvgRating.toFixed(2)
                                : formatTravelerRating(traveler.averageRating).toFixed(2)}
                            </span>
                            <span>rating</span>
                            <span className="text-muted-foreground/60">•</span>
                            <MessageSquare className="h-4 w-4" />
                            <span>
                              {nonFlaggedReviewCount > 0
                                ? nonFlaggedReviewCount
                                : traveler.totalReviewsReceived}{" "}
                              reviews
                            </span>
                          </button>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Member since{" "}
                              {new Date(Number(traveler.memberSince) * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </>
                      )}
                      {!traveler && (
                        <span>Complete your first booking to build your traveler profile</span>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      {t("nav.profile")}
                    </Button>
                    <Button onClick={() => router.push("/explore")}>{t("nav.explore")}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        {t("dashboard.total_bookings")}
                      </p>
                      <p className="text-3xl font-bold">{bookings.length}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {totalNights > 0 ? `${totalNights} nights total` : "Start exploring"}
                      </p>
                    </div>
                    <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                      <Calendar className="text-primary h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        {t("dashboard.upcoming")}
                      </p>
                      <p className="text-3xl font-bold">{upcomingBookings.length}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {nextCheckIn
                          ? `Next: ${nextCheckIn.toLocaleDateString()}`
                          : "No trips planned"}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Completed Stays</p>
                      <p className="text-3xl font-bold">{completedBookingsCount}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {uniqueProperties > 0
                          ? `${uniqueProperties} unique properties`
                          : "Complete your first stay"}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setReviewsModalOpen(true)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Your Rating</p>
                      <p className="text-3xl font-bold">
                        {calculatedAvgRating !== null
                          ? calculatedAvgRating.toFixed(1)
                          : traveler && Number(traveler.averageRating) > 0
                            ? formatTravelerRating(traveler.averageRating).toFixed(1)
                            : "—"}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {nonFlaggedReviewCount > 0
                          ? `${nonFlaggedReviewCount} review${nonFlaggedReviewCount !== 1 ? "s" : ""}`
                          : traveler && Number(traveler.totalReviewsReceived) > 0
                            ? `${traveler.totalReviewsReceived} review${Number(traveler.totalReviewsReceived) !== 1 ? "s" : ""}`
                            : "No reviews yet"}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
                      <Star className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Total Spent</p>
                      <p className="text-3xl font-bold">
                        ${totalSpent > 0 ? totalSpent.toFixed(0) : "0"}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {completedBookingsCount > 0
                          ? `~$${Math.round(totalSpent / completedBookingsCount)}/trip avg`
                          : "Book your first stay"}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                      <DollarSign className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Required Card */}
            {pendingActions.total > 0 && (
              <Card className="mb-8 border-yellow-500/50 bg-yellow-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <AlertCircle className="h-5 w-5" />
                    Action Required
                    <Badge
                      variant="secondary"
                      className="ml-auto bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                    >
                      {pendingActions.total} pending
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Complete these actions to keep your bookings on track
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Check-ins Today */}
                  {pendingActions.checkInsToday.length > 0 && (
                    <Collapsible defaultOpen className="rounded-lg border">
                      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between p-3 transition-colors">
                        <div className="flex items-center gap-2">
                          <LogIn className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Check-in Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500 px-2 py-0.5 text-xs text-white">
                            {pendingActions.checkInsToday.length}
                          </Badge>
                          <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-3 pb-3">
                        <div className="space-y-2 pt-2">
                          {pendingActions.checkInsToday.map((booking) => (
                            <div
                              key={booking.id}
                              className="flex items-center justify-between rounded-lg border bg-white/50 p-3 dark:bg-gray-800/50"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{booking.propertyName}</p>
                                <p className="text-muted-foreground text-sm">{booking.roomName}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBookingClick(booking)}
                              >
                                View Details
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Confirm Arrival */}
                  {pendingActions.toConfirmArrival.length > 0 && (
                    <Collapsible defaultOpen className="rounded-lg border">
                      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between p-3 transition-colors">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Confirm Your Arrival</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500 px-2 py-0.5 text-xs text-white">
                            {pendingActions.toConfirmArrival.length}
                          </Badge>
                          <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-3 pb-3">
                        <div className="space-y-2 pt-2">
                          {pendingActions.toConfirmArrival.map((booking) => (
                            <div
                              key={booking.id}
                              className="flex items-center justify-between rounded-lg border bg-white/50 p-3 dark:bg-gray-800/50"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{booking.propertyName}</p>
                                <p className="text-muted-foreground text-sm">
                                  Confirm to release payment to host
                                </p>
                              </div>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleBookingClick(booking)}
                              >
                                Confirm Stay
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Complete or Review */}
                  {pendingActions.toCompleteOrReview.length > 0 && (
                    <Collapsible defaultOpen className="rounded-lg border">
                      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between p-3 transition-colors">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">Complete or Review</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-500 px-2 py-0.5 text-xs text-white">
                            {pendingActions.toCompleteOrReview.length}
                          </Badge>
                          <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-3 pb-3">
                        <div className="space-y-2 pt-2">
                          {pendingActions.toCompleteOrReview.slice(0, 5).map((booking) => {
                            // Double-check if already reviewed (belt and suspenders)
                            const hasReview = reviewsGiven.some(
                              (r) =>
                                r.propertyId === booking.propertyId &&
                                r.reviewee.toLowerCase() === booking.hostAddress?.toLowerCase()
                            );
                            return (
                              <div
                                key={booking.id}
                                className="flex items-center justify-between rounded-lg border bg-white/50 p-3 dark:bg-gray-800/50"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium">{booking.propertyName}</p>
                                  <p className="text-muted-foreground text-sm">
                                    Stayed {booking.checkOut.toLocaleDateString()}
                                  </p>
                                </div>
                                <CompleteStayButton
                                  escrowAddress={booking.escrowAddress!}
                                  checkInDate={booking.checkIn}
                                  onSuccess={() => refetchBookings()}
                                  hasReview={hasReview}
                                  onReviewClick={() => {
                                    setSelectedBooking(booking);
                                    setReviewModalOpen(true);
                                  }}
                                />
                              </div>
                            );
                          })}
                          {pendingActions.toCompleteOrReview.length > 5 && (
                            <p className="text-muted-foreground pt-1 text-center text-sm">
                              +{pendingActions.toCompleteOrReview.length - 5} more to complete or
                              review
                            </p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Check-In Scanner */}
            {upcomingBookings.length > 0 && (
              <div className="mb-8">
                <CheckInScanner />
              </div>
            )}

            {/* Bookings Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.my_trips")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="upcoming">
                      {t("dashboard.upcoming")} ({upcomingBookings.length})
                    </TabsTrigger>
                    <TabsTrigger value="past">
                      {t("dashboard.past")} ({pastBookings.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upcoming">
                    {upcomingBookings.length === 0 ? (
                      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
                        <Calendar className="text-muted-foreground mb-4 h-12 w-12" />
                        <p className="mb-2 text-lg font-semibold">{t("dashboard.no_bookings")}</p>
                        <p className="text-muted-foreground mb-4 text-sm">
                          Start exploring properties to book your next adventure
                        </p>
                        <Button onClick={() => router.push("/explore")}>{t("nav.explore")}</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {upcomingBookings.map((booking) => (
                          <BookingCard
                            key={booking.id}
                            booking={booking}
                            onClick={() => handleBookingClick(booking)}
                            onRoomClick={() => handleRoomClick(booking)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="past">
                    {pastBookings.length === 0 ? (
                      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
                        <Star className="text-muted-foreground mb-4 h-12 w-12" />
                        <p className="mb-2 text-lg font-semibold">No past trips</p>
                        <p className="text-muted-foreground text-sm">
                          Your completed bookings will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Status Filter Badges */}
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={pastStatusFilter === "all" ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setPastStatusFilter("all")}
                          >
                            All ({pastBookingCounts.all})
                          </Badge>
                          <Badge
                            variant={pastStatusFilter === "Completed" ? "default" : "outline"}
                            className={`cursor-pointer ${
                              pastStatusFilter === "Completed"
                                ? "bg-green-600 hover:bg-green-700"
                                : "hover:bg-green-100 dark:hover:bg-green-900/30"
                            }`}
                            onClick={() => setPastStatusFilter("Completed")}
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Completed ({pastBookingCounts.Completed})
                          </Badge>
                          <Badge
                            variant={pastStatusFilter === "Cancelled" ? "default" : "outline"}
                            className={`cursor-pointer ${
                              pastStatusFilter === "Cancelled"
                                ? "bg-red-600 hover:bg-red-700"
                                : "hover:bg-red-100 dark:hover:bg-red-900/30"
                            }`}
                            onClick={() => setPastStatusFilter("Cancelled")}
                          >
                            Cancelled ({pastBookingCounts.Cancelled})
                          </Badge>
                        </div>

                        {/* Filtered Bookings */}
                        {filteredPastBookings.length === 0 ? (
                          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
                            <p className="text-muted-foreground text-sm">
                              No {pastStatusFilter.toLowerCase()} bookings found
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {filteredPastBookings.map((booking) => (
                              <BookingCard
                                key={booking.id}
                                booking={booking}
                                onClick={() => handleBookingClick(booking)}
                                onRoomClick={() => handleRoomClick(booking)}
                                isReviewed={
                                  booking.escrowAddress
                                    ? reviewedEscrowAddresses.has(
                                        booking.escrowAddress.toLowerCase()
                                      ) || justReviewedBookings.has(booking.id)
                                    : false
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}

        {/* Modals */}
        <BookingDetailSheet
          booking={selectedBooking}
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
          onCancelClick={handleCancelClick}
          onReviewClick={handleReviewClick}
          onMessage={() => {
            setDetailSheetOpen(false);
            setMessagingOpen(true);
          }}
          existingReview={
            selectedBooking
              ? reviewsGiven.find(
                  (r) =>
                    r.propertyId === selectedBooking.propertyId &&
                    r.reviewee.toLowerCase() === selectedBooking.hostAddress?.toLowerCase()
                ) || null
              : null
          }
        />

        <CancelBookingModal
          booking={selectedBooking}
          open={cancelModalOpen}
          onOpenChange={setCancelModalOpen}
          onSuccess={handleCancelSuccess}
        />

        <RoomDetailModal
          tokenId={selectedBooking?.tokenId || null}
          propertyId={selectedBooking?.propertyId || null}
          propertyName={selectedBooking?.propertyName || ""}
          open={roomModalOpen}
          onOpenChange={setRoomModalOpen}
        />

        {/* Review Form Modal - Only render when modal is open to avoid unnecessary queries */}
        {reviewModalOpen &&
          selectedBooking &&
          selectedBooking.escrowAddress &&
          selectedBooking.hostAddress && (
            <ReviewSubmissionForm
              booking={{
                id: selectedBooking.id,
                propertyId: selectedBooking.propertyId,
                propertyName: selectedBooking.propertyName,
                roomName: selectedBooking.roomName,
                tokenId: selectedBooking.tokenId,
                bookingIndex: selectedBooking.bookingIndex,
                checkOut: selectedBooking.checkOut,
                location: selectedBooking.location,
                image: selectedBooking.image,
                escrowAddress: selectedBooking.escrowAddress,
                hostAddress: selectedBooking.hostAddress,
                travelerAddress: selectedBooking.travelerAddress,
              }}
              open={reviewModalOpen}
              onOpenChange={setReviewModalOpen}
              onSuccess={() => {
                // Immediately mark this booking as reviewed for instant UI feedback
                if (selectedBooking) {
                  setJustReviewedBookings((prev) => new Set([...prev, selectedBooking.id]));
                }
                // Refetch both bookings and reviews to update the UI
                refetchBookings();
                // Add a small delay to allow the indexer to process the review
                setTimeout(() => {
                  refetchReviewsGiven();
                }, 2000);
              }}
              isTravelerReview={true}
            />
          )}

        {/* Messaging Modal */}
        <BookingMessaging
          open={messagingOpen}
          onOpenChange={setMessagingOpen}
          peerAddress={selectedBooking?.hostAddress || ""}
          bookingId={selectedBooking?.id || ""}
          propertyName={selectedBooking?.propertyName || ""}
          isHost={false}
        />

        {/* Reviews Modal */}
        <ReviewsModal
          open={reviewsModalOpen}
          onOpenChange={setReviewsModalOpen}
          reviewsReceived={reviewsReceived}
          reviewsGiven={reviewsGiven}
          averageRating={
            calculatedAvgRating ?? (traveler ? formatTravelerRating(traveler.averageRating) : 0)
          }
          totalReviews={
            nonFlaggedReviewCount > 0
              ? nonFlaggedReviewCount
              : traveler
                ? Number(traveler.totalReviewsReceived)
                : 0
          }
        />
      </div>
    </ProtectedRoute>
  );
}

interface BookingCardProps {
  booking: BookingSummary;
  onClick: () => void;
  onRoomClick: () => void;
  isReviewed?: boolean;
}

function BookingCard({ booking, onClick, onRoomClick, isReviewed }: BookingCardProps) {
  const { t } = useTranslation();

  const ponderStatusColors: Record<PonderBooking["status"], string> = {
    Pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    Confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    CheckedIn: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
    Completed: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
    Cancelled: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  };

  // Calculate days until check-in
  const daysUntilCheckIn = Math.ceil(
    (booking.checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isUpcoming = booking.status === "upcoming";

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
      onClick={onClick}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="bg-muted relative h-48 w-full overflow-hidden md:h-auto md:w-56">
          {booking.image ? (
            <img
              src={booking.image}
              alt={booking.propertyName}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Home className="text-muted-foreground/50 h-12 w-12" />
            </div>
          )}
          {isUpcoming && daysUntilCheckIn > 0 && daysUntilCheckIn <= 7 && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-primary text-primary-foreground">
                {daysUntilCheckIn} day{daysUntilCheckIn > 1 ? "s" : ""} left
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4 md:p-6">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold">{booking.propertyName}</h3>
              <button
                className="text-primary mt-1 flex items-center gap-1.5 text-sm hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  onRoomClick();
                }}
              >
                <BedDouble className="h-3.5 w-3.5" />
                <span>{booking.roomName}</span>
                <Eye className="h-3 w-3 opacity-60" />
              </button>
              <div className="text-muted-foreground mt-1 flex items-center text-sm">
                <MapPin className="mr-1 h-3.5 w-3.5" />
                <span className="truncate">{booking.location}</span>
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-1">
              <Badge className={`${ponderStatusColors[booking.ponderStatus]} border`}>
                {booking.ponderStatus}
              </Badge>
              {booking.ponderStatus === "Completed" && (
                <Badge
                  variant="outline"
                  className={
                    isReviewed
                      ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                      : "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                  }
                >
                  {isReviewed ? (
                    <>
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      Reviewed
                    </>
                  ) : (
                    <>
                      <Star className="mr-1 h-3 w-3" />
                      Leave Review
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="mb-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span>{booking.checkIn.toLocaleDateString()}</span>
              <span className="text-muted-foreground">-</span>
              <span>{booking.checkOut.toLocaleDateString()}</span>
            </div>
            <span className="text-muted-foreground">({booking.nights} nights)</span>
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold">${booking.total.toFixed(2)}</span>
              <span className="text-muted-foreground text-sm">USDC</span>
            </div>
            <Button variant="ghost" size="sm" className="group-hover:bg-primary/10">
              View Details
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
