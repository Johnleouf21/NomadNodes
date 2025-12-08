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
} from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAccount } from "wagmi";
import { usePonderBookings, type PonderBooking } from "@/hooks/usePonderBookings";
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
import { BookingDetailSheet, CancelBookingModal, RoomDetailModal } from "./booking";
import { ReviewSubmissionForm, type ReviewableBooking } from "@/components/review";
import type { RoomTypeData } from "@/lib/hooks/property/types";
import type { Address } from "viem";

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

export function TravelerDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("upcoming");
  const { address } = useAccount();

  // Modal states
  const [selectedBooking, setSelectedBooking] = React.useState<BookingSummary | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = React.useState(false);
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
  const [roomModalOpen, setRoomModalOpen] = React.useState(false);
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);

  // Fetch traveler profile from Ponder
  const { traveler, loading: loadingTraveler } = usePonderTraveler({
    walletAddress: address,
  });

  // Fetch reviews given by this traveler
  const { reviews: reviewsGiven, loading: _loadingReviewsGiven } = usePonderReviews({
    reviewerAddress: address,
  });

  // Fetch reviews received by this traveler
  const { reviews: reviewsReceived, loading: _loadingReviewsReceived } = usePonderReviews({
    revieweeAddress: address,
  });

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

  // Calculate total spent
  const totalSpent = React.useMemo(() => {
    return bookings.reduce((sum, b) => sum + b.total, 0);
  }, [bookings]);

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
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            <span className="text-foreground font-medium">
                              {formatTravelerRating(traveler.averageRating).toFixed(2)}
                            </span>
                            <span>rating</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Member since{" "}
                              {new Date(Number(traveler.memberSince) * 1000).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{traveler.totalReviewsReceived} reviews</span>
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
                      <p className="text-3xl font-bold">
                        {traveler
                          ? traveler.completedStays
                          : pastBookings.filter((b) => b.status === "past").length}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Total Spent</p>
                      <p className="text-3xl font-bold">${totalSpent.toFixed(0)}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                      <DollarSign className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Cancelled</p>
                      <p className="text-3xl font-bold">
                        {traveler
                          ? traveler.cancelledBookings
                          : pastBookings.filter((b) => b.status === "cancelled").length}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                      <XCircle className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Check-In Scanner */}
            {upcomingBookings.length > 0 && (
              <div className="mb-8">
                <CheckInScanner />
              </div>
            )}

            {/* Reviews Section */}
            {(reviewsReceived.length > 0 || reviewsGiven.length > 0) && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Reviews
                  </CardTitle>
                  <CardDescription>
                    Your reviews from hosts and reviews you have left
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="received">
                    <TabsList className="mb-4">
                      <TabsTrigger value="received">
                        Received ({reviewsReceived.length})
                      </TabsTrigger>
                      <TabsTrigger value="given">Given ({reviewsGiven.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="received">
                      {reviewsReceived.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Star className="text-muted-foreground/50 mb-4 h-12 w-12" />
                          <p className="text-muted-foreground">No reviews received yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reviewsReceived.map((review) => (
                            <ReviewCard key={review.id} review={review} type="received" />
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="given">
                      {reviewsGiven.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <MessageSquare className="text-muted-foreground/50 mb-4 h-12 w-12" />
                          <p className="text-muted-foreground">You have not left any reviews yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reviewsGiven.map((review) => (
                            <ReviewCard key={review.id} review={review} type="given" />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
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
                        {pastBookings.map((booking) => (
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

        {/* Review Form Modal */}
        <ReviewSubmissionForm
          booking={
            selectedBooking && selectedBooking.escrowAddress && selectedBooking.hostAddress
              ? {
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
                }
              : null
          }
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          onSuccess={() => {
            refetchBookings();
          }}
          isTravelerReview={true}
        />
      </div>
    </ProtectedRoute>
  );
}

function ReviewCard({ review, type }: { review: any; type: "given" | "received" }) {
  const formattedDate = new Date(Number(review.createdAt) * 1000).toLocaleDateString();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-yellow-500">{renderStars(review.rating)}</span>
              <span className="text-muted-foreground text-sm">{formattedDate}</span>
              {review.isFlagged && (
                <Badge variant="destructive" className="text-xs">
                  Flagged
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {type === "received" ? (
                <>
                  From:{" "}
                  <span className="font-mono text-xs">
                    {review.reviewer.slice(0, 8)}...{review.reviewer.slice(-6)}
                  </span>
                </>
              ) : (
                <>
                  To:{" "}
                  <span className="font-mono text-xs">
                    {review.reviewee.slice(0, 8)}...{review.reviewee.slice(-6)}
                  </span>
                </>
              )}
            </p>
            {review.propertyId && (
              <p className="text-muted-foreground mt-1 text-sm">Property #{review.propertyId}</p>
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span className="text-green-500">+{review.helpfulVotes}</span>
            <span>/</span>
            <span className="text-red-500">-{review.unhelpfulVotes}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BookingCardProps {
  booking: BookingSummary;
  onClick: () => void;
  onRoomClick: () => void;
}

function BookingCard({ booking, onClick, onRoomClick }: BookingCardProps) {
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
            <Badge className={`${ponderStatusColors[booking.ponderStatus]} flex-shrink-0 border`}>
              {booking.ponderStatus}
            </Badge>
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
