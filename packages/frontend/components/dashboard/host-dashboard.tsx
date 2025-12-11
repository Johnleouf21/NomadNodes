"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import {
  Home,
  DollarSign,
  Calendar,
  Plus,
  Loader2,
  TrendingUp,
  Clock,
  BarChart3,
  Wallet,
  AlertCircle,
  CheckCircle2,
  LogIn,
  Star,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePonderHostProperties } from "@/hooks/usePonderProperties";
import { usePonderBookings, type PonderBooking } from "@/hooks/usePonderBookings";
import {
  usePonderPropertiesWithMetadata,
  type PropertyWithMetadata,
} from "@/hooks/usePonderPropertiesWithMetadata";
import { type PonderRoomType } from "@/hooks/usePonderRoomTypes";
import { getIPFSUrl, fetchFromIPFS } from "@/lib/utils/ipfs";
import type { RoomTypeData } from "@/lib/hooks/property/types";

// Extended room type with metadata
interface RoomTypeWithCurrency extends PonderRoomType {
  currency?: "USD" | "EUR";
}
import { DashboardStats, type DashboardStat } from "./dashboard-stats";
import { PropertyCardPonder } from "@/components/property/property-card-ponder";
import {
  BookingFiltersToolbar,
  HostBookingCard,
  HostBookingDetailSheet,
  CancelBookingModal,
  type BookingStatusFilter,
  type SortOption,
} from "./booking";
import { CONTRACTS } from "@/lib/contracts";
import { toast } from "sonner";
import { HostAnalytics, HostRevenue } from "./analytics";
import { ReviewSubmissionForm, type ReviewableBooking } from "@/components/review";
import { BookingMessaging } from "@/components/messaging";
import { usePonderReviews } from "@/hooks/usePonderReviews";
import type { Address } from "viem";

// Escrow ABI for autoReleaseToHost
const ESCROW_ABI = [
  {
    inputs: [],
    name: "autoReleaseToHost",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function HostDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("properties");
  const { address } = useAuth();

  // Filter & sort state
  const [statusFilter, setStatusFilter] = React.useState<BookingStatusFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortOption>("date-desc");
  const [propertyFilter, setPropertyFilter] = React.useState("all");

  // Modal/Sheet state
  const [selectedBooking, setSelectedBooking] = React.useState<PonderBooking | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = React.useState(false);
  const [cancelBooking, setCancelBooking] = React.useState<PonderBooking | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = React.useState(false);
  const [messagingBooking, setMessagingBooking] = React.useState<PonderBooking | null>(null);

  // Action state
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const [pendingEscrowRelease, setPendingEscrowRelease] = React.useState<PonderBooking | null>(
    null
  );

  // Contract interactions for BookingManager
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Contract interactions for Escrow (autoReleaseToHost after check-in)
  const {
    writeContract: writeEscrow,
    data: escrowTxHash,
    isPending: isEscrowWritePending,
  } = useWriteContract();
  const { isLoading: isEscrowTxLoading, isSuccess: isEscrowTxSuccess } =
    useWaitForTransactionReceipt({
      hash: escrowTxHash,
    });

  // Fetch user's properties from Ponder (by host address)
  const {
    properties: hostProperties,
    propertyIds,
    loading: isLoading,
  } = usePonderHostProperties(address);

  // Convert property IDs to strings for Ponder query
  const propertyIdStrings = React.useMemo(() => {
    return propertyIds?.map((id) => id.toString()) || [];
  }, [propertyIds]);

  // Fetch bookings for all host's properties
  const {
    bookings: ponderBookings,
    loading: loadingBookings,
    refetch: refetchBookings,
  } = usePonderBookings({
    propertyIds: propertyIdStrings.length > 0 ? propertyIdStrings : undefined,
  });

  // Fetch property metadata for booking display
  const { allProperties, loading: loadingProperties } = usePonderPropertiesWithMetadata({
    isActive: true,
    pageSize: 100,
  });

  // Fetch reviews left by the host (to know which completed bookings still need a review)
  const { reviews: hostReviews } = usePonderReviews({
    reviewerAddress: address,
  });

  // Fetch room types for all host properties (with IPFS metadata for currency)
  const [roomTypesMap, setRoomTypesMap] = React.useState<Map<string, RoomTypeWithCurrency>>(
    new Map()
  );
  const [_loadingRoomTypes, setLoadingRoomTypes] = React.useState(false);

  React.useEffect(() => {
    async function fetchRoomTypes() {
      if (!propertyIdStrings.length) return;

      setLoadingRoomTypes(true);
      try {
        const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
        const propertyIdList = propertyIdStrings.map((id) => `"${id}"`).join(", ");

        const graphqlQuery = `
          query {
            roomTypes(where: { propertyId_in: [${propertyIdList}] }, limit: 1000) {
              items {
                id
                tokenId
                propertyId
                roomTypeId
                name
                ipfsHash
                pricePerNight
                isActive
              }
            }
          }
        `;

        const response = await fetch(`${PONDER_URL}/graphql`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: graphqlQuery }),
        });

        if (response.ok) {
          const result = await response.json();
          const items = result.data?.roomTypes?.items || [];

          // Create map from tokenId to room type
          const map = new Map<string, RoomTypeWithCurrency>();

          // Fetch IPFS metadata for each room type to get currency
          await Promise.all(
            items.map(async (item: any) => {
              let currency: "USD" | "EUR" = "USD"; // Default to USD

              // Fetch IPFS metadata to get currency
              if (item.ipfsHash) {
                try {
                  const metadata = await fetchFromIPFS<RoomTypeData>(item.ipfsHash);
                  if (metadata?.currency) {
                    currency = metadata.currency;
                  }
                } catch {
                  // Ignore IPFS fetch errors, use default currency
                }
              }

              map.set(item.tokenId, {
                ...item,
                tokenId: BigInt(item.tokenId),
                roomTypeId: BigInt(item.roomTypeId || 0),
                pricePerNight: BigInt(item.pricePerNight || 0),
                cleaningFee: BigInt(0),
                maxGuests: BigInt(2),
                totalSupply: BigInt(1),
                createdAt: BigInt(0),
                updatedAt: BigInt(0),
                ipfsHash: item.ipfsHash || "",
                isDeleted: false,
                currency,
              });
            })
          );

          setRoomTypesMap(map);
        }
      } catch (error) {
        console.error("Failed to fetch room types:", error);
      } finally {
        setLoadingRoomTypes(false);
      }
    }

    fetchRoomTypes();
  }, [propertyIdStrings]);

  // Handle BookingManager transaction success
  React.useEffect(() => {
    if (isTxSuccess && pendingAction) {
      // If we have a pending escrow release (from check-in), trigger it now
      if (pendingEscrowRelease && pendingEscrowRelease.escrowAddress) {
        toast.success("Check-in confirmed! Now releasing payment...", {
          description: "Please confirm the second transaction",
        });
        writeEscrow({
          address: pendingEscrowRelease.escrowAddress as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: "autoReleaseToHost",
        });
        setPendingAction(null);
      } else {
        toast.success("Action completed successfully");
        setPendingAction(null);
        // Refetch bookings after a short delay to allow indexer to catch up
        setTimeout(() => refetchBookings(), 2000);
      }
    }
  }, [isTxSuccess, pendingAction, pendingEscrowRelease, writeEscrow, refetchBookings]);

  // Handle Escrow transaction success
  React.useEffect(() => {
    if (isEscrowTxSuccess && pendingEscrowRelease) {
      toast.success("Payment released! You can now withdraw in the Revenue tab.");
      setPendingEscrowRelease(null);
      // Refetch bookings after a short delay to allow indexer to catch up
      setTimeout(() => refetchBookings(), 2000);
    }
  }, [isEscrowTxSuccess, pendingEscrowRelease, refetchBookings]);

  // Create property lookup map for quick access
  const propertyMap = React.useMemo(() => {
    const map = new Map<string, PropertyWithMetadata>();
    allProperties.forEach((p: PropertyWithMetadata) => {
      map.set(p.propertyId.toString(), p);
    });
    return map;
  }, [allProperties]);

  // Get property info for a booking
  const getPropertyInfo = React.useCallback(
    (booking: PonderBooking) => {
      const property = propertyMap.get(booking.propertyId);
      const name = property?.metadata?.name || `Property #${booking.propertyId}`;
      let imageUrl = "/images/property-placeholder.jpg";
      if (property?.metadata?.images && property.metadata.images.length > 0) {
        imageUrl = getIPFSUrl(property.metadata.images[0]);
      }
      return { name, imageUrl };
    },
    [propertyMap]
  );

  // Get room type info for a booking (name and currency)
  const getRoomTypeInfo = React.useCallback(
    (booking: PonderBooking): { name: string; currency: "USD" | "EUR" } => {
      const roomType = roomTypesMap.get(booking.roomTypeId);
      return {
        name: roomType?.name || `Room #${booking.roomTypeId}`,
        currency: roomType?.currency || "USD",
      };
    },
    [roomTypesMap]
  );

  // Properties list for filter dropdown
  const propertiesForFilter = React.useMemo(() => {
    if (!hostProperties) return [];
    return hostProperties.map((p) => {
      const propertyIdStr = p.propertyId.toString();
      const metadata = propertyMap.get(propertyIdStr);
      return {
        id: propertyIdStr,
        name: metadata?.metadata?.name || `Property #${p.propertyId}`,
      };
    });
  }, [hostProperties, propertyMap]);

  // Calculate booking counts by status
  const bookingCounts = React.useMemo(() => {
    const counts = {
      all: 0,
      Pending: 0,
      Confirmed: 0,
      CheckedIn: 0,
      Completed: 0,
      Cancelled: 0,
    };
    if (!ponderBookings) return counts;

    ponderBookings.forEach((b: PonderBooking) => {
      counts.all++;
      counts[b.status]++;
    });
    return counts;
  }, [ponderBookings]);

  // Filter and sort bookings
  const filteredBookings = React.useMemo(() => {
    if (!ponderBookings) return [];

    let filtered = [...ponderBookings];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Property filter
    if (propertyFilter !== "all") {
      filtered = filtered.filter((b) => b.propertyId === propertyFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((b) => {
        const { name } = getPropertyInfo(b);
        return (
          b.traveler.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query) ||
          b.bookingIndex.toLowerCase().includes(query) ||
          name.toLowerCase().includes(query)
        );
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return Number(b.checkInDate) - Number(a.checkInDate);
        case "date-asc":
          return Number(a.checkInDate) - Number(b.checkInDate);
        case "amount-desc":
          return Number(b.totalPrice) - Number(a.totalPrice);
        case "amount-asc":
          return Number(a.totalPrice) - Number(b.totalPrice);
        case "status": {
          const statusOrder = {
            Pending: 0,
            Confirmed: 1,
            CheckedIn: 2,
            Completed: 3,
            Cancelled: 4,
          };
          return statusOrder[a.status] - statusOrder[b.status];
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [ponderBookings, statusFilter, propertyFilter, searchQuery, sortBy, getPropertyInfo]);

  // Action handlers
  const handleCheckIn = React.useCallback(
    (booking: PonderBooking) => {
      setPendingAction(booking.id);
      // Store the booking for escrow release after check-in succeeds
      if (booking.escrowAddress) {
        setPendingEscrowRelease(booking);
      }
      writeContract({
        ...CONTRACTS.bookingManager,
        functionName: "checkInBooking",
        args: [BigInt(booking.tokenId), BigInt(booking.bookingIndex)],
      });
      toast.info("Processing check-in...", {
        description: booking.escrowAddress
          ? "Step 1/2: Confirm check-in in your wallet"
          : "Please confirm in your wallet",
      });
    },
    [writeContract]
  );

  const handleComplete = React.useCallback(
    (booking: PonderBooking) => {
      setPendingAction(booking.id);
      writeContract({
        ...CONTRACTS.bookingManager,
        functionName: "completeBooking",
        args: [BigInt(booking.tokenId), BigInt(booking.bookingIndex)],
      });
      toast.info("Completing booking...", { description: "Please confirm in your wallet" });
    },
    [writeContract]
  );

  const handleOpenDetails = React.useCallback((booking: PonderBooking) => {
    setSelectedBooking(booking);
    setIsDetailSheetOpen(true);
  }, []);

  const handleOpenCancel = React.useCallback((booking: PonderBooking) => {
    setCancelBooking(booking);
  }, []);

  const handleReviewClick = React.useCallback(() => {
    if (selectedBooking) {
      // Don't close the sheet immediately - the review modal will handle the transition
      setIsReviewModalOpen(true);
      // Close the sheet after a small delay to ensure the booking data is passed
      setTimeout(() => setIsDetailSheetOpen(false), 100);
    }
  }, [selectedBooking]);

  // Calculate enhanced stats
  const totalProperties = hostProperties?.length || 0;
  const activeBookings = bookingCounts.Confirmed + bookingCounts.CheckedIn;
  const completedBookings = bookingCounts.Completed;

  // Calculate detailed pending actions with actual booking objects
  const pendingActions = React.useMemo(() => {
    if (!ponderBookings)
      return { total: 0, toConfirm: [], toCheckIn: [], toComplete: [], toReview: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime() / 1000;

    // Bookings needing confirmation
    const toConfirm = ponderBookings.filter((b) => b.status === "Pending");

    // Bookings ready for check-in (Confirmed + check-in date is today or passed)
    const toCheckIn = ponderBookings.filter(
      (b) => b.status === "Confirmed" && Number(b.checkInDate) <= todayTimestamp
    );

    // Bookings ready to complete (CheckedIn + check-out date has passed)
    const toComplete = ponderBookings.filter(
      (b) => b.status === "CheckedIn" && Number(b.checkOutDate) <= todayTimestamp
    );

    // Completed bookings without host review
    // Host reviews travelers, so we check if the host (reviewer) has reviewed the traveler (reviewee)
    const reviewedTravelers = new Set(
      hostReviews.map((r) => `${r.propertyId}-${r.reviewee.toLowerCase()}`)
    );
    const toReview = ponderBookings.filter((b) => {
      if (b.status !== "Completed") return false;
      if (!b.escrowAddress) return false; // Must have escrow address for review
      const key = `${b.propertyId}-${b.traveler.toLowerCase()}`;
      return !reviewedTravelers.has(key);
    });

    return {
      total: toConfirm.length + toCheckIn.length + toComplete.length + toReview.length,
      toConfirm,
      toCheckIn,
      toComplete,
      toReview,
    };
  }, [ponderBookings, hostReviews]);

  // Calculate total earnings from completed bookings
  const totalEarnings = React.useMemo(() => {
    if (!ponderBookings) return 0;
    return ponderBookings
      .filter((b: PonderBooking) => b.status === "Completed")
      .reduce((sum: number, b: PonderBooking) => sum + Number(b.totalPrice) / 1e6, 0);
  }, [ponderBookings]);

  // Calculate occupancy rate (simplified: confirmed + checked-in as % of total non-cancelled)
  const occupancyRate = React.useMemo(() => {
    const total = bookingCounts.all - bookingCounts.Cancelled;
    if (total === 0) return 0;
    return Math.round(((bookingCounts.Confirmed + bookingCounts.CheckedIn) / total) * 100);
  }, [bookingCounts]);

  // Build pending actions trend text
  const pendingActionsTrend = React.useMemo(() => {
    const parts: string[] = [];
    if (pendingActions.toConfirm.length > 0)
      parts.push(`${pendingActions.toConfirm.length} to confirm`);
    if (pendingActions.toCheckIn.length > 0)
      parts.push(`${pendingActions.toCheckIn.length} to check-in`);
    if (pendingActions.toComplete.length > 0)
      parts.push(`${pendingActions.toComplete.length} to complete`);
    if (pendingActions.toReview.length > 0)
      parts.push(`${pendingActions.toReview.length} to review`);
    return parts.length > 0 ? parts.join(", ") : "All caught up!";
  }, [pendingActions]);

  const stats: DashboardStat[] = [
    {
      title: t("dashboard.total_properties"),
      value: totalProperties.toString(),
      icon: Home,
      trend: `${activeBookings} active bookings`,
    },
    {
      title: t("dashboard.total_earnings"),
      value: `$${totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      trend: `From ${completedBookings} completed`,
    },
    {
      title: "Pending Actions",
      value: pendingActions.total.toString(),
      icon: Clock,
      trend: pendingActionsTrend,
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      icon: TrendingUp,
      trend: `${activeBookings} active / ${bookingCounts.all - bookingCounts.Cancelled} total`,
    },
  ];

  return (
    <ProtectedRoute requireSBT="host">
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{t("dashboard.host_dashboard")}</h1>
            <p className="text-muted-foreground">
              {t("dashboard.manage")} {t("nav.my_properties")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/host/calendar")}>
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </Button>
            <Button onClick={() => router.push("/host/create-property")}>
              <Plus className="mr-2 h-4 w-4" />
              {t("dashboard.add_property")}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <DashboardStats stats={stats} />

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
                Complete these actions to keep your hosting on track
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Bookings to Confirm */}
              {pendingActions.toConfirm.length > 0 && (
                <Collapsible defaultOpen className="rounded-lg border">
                  <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between p-3 transition-colors">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Confirm Bookings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500 px-2 py-0.5 text-xs text-white">
                        {pendingActions.toConfirm.length}
                      </Badge>
                      <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-3 pb-3">
                    <div className="space-y-2 pt-2">
                      {pendingActions.toConfirm.slice(0, 5).map((booking) => {
                        const { name } = getPropertyInfo(booking);
                        return (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between rounded-lg border bg-white/50 p-3 dark:bg-gray-800/50"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{name}</p>
                              <p className="text-muted-foreground text-sm">
                                {booking.traveler.slice(0, 8)}...{booking.traveler.slice(-6)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="bg-yellow-600 hover:bg-yellow-700"
                              onClick={() => handleOpenDetails(booking)}
                            >
                              Confirm
                            </Button>
                          </div>
                        );
                      })}
                      {pendingActions.toConfirm.length > 5 && (
                        <p className="text-muted-foreground pt-1 text-center text-sm">
                          +{pendingActions.toConfirm.length - 5} more to confirm
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Bookings to Check-In */}
              {pendingActions.toCheckIn.length > 0 && (
                <Collapsible defaultOpen className="rounded-lg border">
                  <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between p-3 transition-colors">
                    <div className="flex items-center gap-2">
                      <LogIn className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Ready for Check-In</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500 px-2 py-0.5 text-xs text-white">
                        {pendingActions.toCheckIn.length}
                      </Badge>
                      <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-3 pb-3">
                    <div className="space-y-2 pt-2">
                      {pendingActions.toCheckIn.slice(0, 5).map((booking) => {
                        const { name } = getPropertyInfo(booking);
                        return (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between rounded-lg border bg-white/50 p-3 dark:bg-gray-800/50"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{name}</p>
                              <p className="text-muted-foreground text-sm">
                                Check-in:{" "}
                                {new Date(Number(booking.checkInDate) * 1000).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleCheckIn(booking)}
                              disabled={
                                pendingAction === booking.id && (isWritePending || isTxLoading)
                              }
                            >
                              {pendingAction === booking.id && (isWritePending || isTxLoading) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Check-In"
                              )}
                            </Button>
                          </div>
                        );
                      })}
                      {pendingActions.toCheckIn.length > 5 && (
                        <p className="text-muted-foreground pt-1 text-center text-sm">
                          +{pendingActions.toCheckIn.length - 5} more to check-in
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Bookings to Complete */}
              {pendingActions.toComplete.length > 0 && (
                <Collapsible defaultOpen className="rounded-lg border">
                  <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between p-3 transition-colors">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Ready to Complete</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500 px-2 py-0.5 text-xs text-white">
                        {pendingActions.toComplete.length}
                      </Badge>
                      <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-3 pb-3">
                    <div className="space-y-2 pt-2">
                      {pendingActions.toComplete.slice(0, 5).map((booking) => {
                        const { name } = getPropertyInfo(booking);
                        return (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between rounded-lg border bg-white/50 p-3 dark:bg-gray-800/50"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{name}</p>
                              <p className="text-muted-foreground text-sm">
                                Check-out:{" "}
                                {new Date(Number(booking.checkOutDate) * 1000).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleComplete(booking)}
                              disabled={
                                pendingAction === booking.id && (isWritePending || isTxLoading)
                              }
                            >
                              {pendingAction === booking.id && (isWritePending || isTxLoading) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Complete"
                              )}
                            </Button>
                          </div>
                        );
                      })}
                      {pendingActions.toComplete.length > 5 && (
                        <p className="text-muted-foreground pt-1 text-center text-sm">
                          +{pendingActions.toComplete.length - 5} more to complete
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Reviews to Leave */}
              {pendingActions.toReview.length > 0 && (
                <Collapsible defaultOpen className="rounded-lg border">
                  <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between p-3 transition-colors">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Leave a Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500 px-2 py-0.5 text-xs text-white">
                        {pendingActions.toReview.length}
                      </Badge>
                      <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-3 pb-3">
                    <div className="space-y-2 pt-2">
                      {pendingActions.toReview.slice(0, 5).map((booking) => {
                        const { name } = getPropertyInfo(booking);
                        return (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between rounded-lg border bg-white/50 p-3 dark:bg-gray-800/50"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{name}</p>
                              <p className="text-muted-foreground text-sm">
                                Traveler: {booking.traveler.slice(0, 8)}...
                                {booking.traveler.slice(-6)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setIsReviewModalOpen(true);
                              }}
                            >
                              <Star className="mr-1 h-3 w-3" />
                              Review
                            </Button>
                          </div>
                        );
                      })}
                      {pendingActions.toReview.length > 5 && (
                        <p className="text-muted-foreground pt-1 text-center text-sm">
                          +{pendingActions.toReview.length - 5} more reviews to leave
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="properties">{t("dashboard.my_listings")}</TabsTrigger>
            <TabsTrigger value="bookings" className="relative">
              {t("dashboard.total_bookings")}
              {pendingActions.total > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white">
                  {pendingActions.total}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4" />
              Revenue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            {isLoading ? (
              <Card>
                <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12">
                  <Loader2 className="text-muted-foreground mb-4 h-12 w-12 animate-spin" />
                  <p className="text-muted-foreground">{t("common.loading")}...</p>
                </CardContent>
              </Card>
            ) : !hostProperties || hostProperties.length === 0 ? (
              <Card>
                <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12">
                  <Home className="text-muted-foreground mb-4 h-16 w-16" />
                  <p className="mb-2 text-xl font-semibold">{t("dashboard.no_properties")}</p>
                  <p className="text-muted-foreground mb-6 text-center text-sm">
                    Start hosting by adding your first property
                  </p>
                  <Button onClick={() => router.push("/host/create-property")}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("dashboard.add_property")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {hostProperties.map((property) => (
                  <PropertyCardPonder key={property.id} property={property} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            {loadingBookings || loadingProperties ? (
              <Card>
                <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-12">
                  <Loader2 className="text-muted-foreground mb-4 h-12 w-12 animate-spin" />
                  <p className="text-muted-foreground">{t("common.loading")}...</p>
                </CardContent>
              </Card>
            ) : !ponderBookings || ponderBookings.length === 0 ? (
              <Card>
                <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-12">
                  <Calendar className="text-muted-foreground mb-4 h-12 w-12" />
                  <p className="mb-2 text-lg font-semibold">{t("dashboard.no_bookings")}</p>
                  <p className="text-muted-foreground text-sm">
                    Bookings for your properties will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Filters Toolbar */}
                <BookingFiltersToolbar
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  propertyFilter={propertyFilter}
                  onPropertyFilterChange={setPropertyFilter}
                  properties={propertiesForFilter}
                  bookingCounts={bookingCounts}
                />

                {/* Results summary */}
                <div className="text-muted-foreground text-sm">
                  Showing {filteredBookings.length} of {ponderBookings.length} bookings
                </div>

                {/* Booking Cards */}
                {filteredBookings.length === 0 ? (
                  <Card>
                    <CardContent className="flex min-h-[200px] flex-col items-center justify-center p-8">
                      <p className="mb-2 text-lg font-semibold">No bookings match your filters</p>
                      <p className="text-muted-foreground text-sm">
                        Try adjusting your search or filter criteria
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((booking) => {
                      const { name, imageUrl } = getPropertyInfo(booking);
                      const { name: roomName, currency } = getRoomTypeInfo(booking);
                      return (
                        <HostBookingCard
                          key={booking.id}
                          booking={booking}
                          propertyName={name}
                          propertyImage={imageUrl}
                          roomTypeName={roomName}
                          currency={currency}
                          onViewDetails={() => handleOpenDetails(booking)}
                          onCheckIn={
                            booking.status === "Confirmed"
                              ? () => handleCheckIn(booking)
                              : undefined
                          }
                          onComplete={
                            booking.status === "CheckedIn"
                              ? () => handleComplete(booking)
                              : undefined
                          }
                          onCancel={
                            booking.status === "Pending" || booking.status === "Confirmed"
                              ? () => handleOpenCancel(booking)
                              : undefined
                          }
                          isActionPending={
                            pendingAction === booking.id && (isWritePending || isTxLoading)
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <HostAnalytics
              bookings={ponderBookings || []}
              properties={allProperties}
              roomTypesMap={roomTypesMap}
              getPropertyInfo={getPropertyInfo}
              getRoomTypeInfo={getRoomTypeInfo}
            />
          </TabsContent>

          <TabsContent value="revenue">
            <HostRevenue
              bookings={ponderBookings || []}
              getPropertyInfo={getPropertyInfo}
              getRoomTypeInfo={getRoomTypeInfo}
            />
          </TabsContent>
        </Tabs>

        {/* Booking Detail Sheet */}
        <HostBookingDetailSheet
          booking={selectedBooking}
          propertyName={selectedBooking ? getPropertyInfo(selectedBooking).name : ""}
          propertyImage={selectedBooking ? getPropertyInfo(selectedBooking).imageUrl : undefined}
          roomTypeName={selectedBooking ? getRoomTypeInfo(selectedBooking).name : undefined}
          currency={selectedBooking ? getRoomTypeInfo(selectedBooking).currency : "USD"}
          open={isDetailSheetOpen}
          onOpenChange={(open) => {
            setIsDetailSheetOpen(open);
            // Only clear selectedBooking if we're not transitioning to review modal
            if (!open && !isReviewModalOpen) setSelectedBooking(null);
          }}
          onCheckIn={
            selectedBooking?.status === "Confirmed"
              ? () => handleCheckIn(selectedBooking)
              : undefined
          }
          onComplete={
            selectedBooking?.status === "CheckedIn"
              ? () => handleComplete(selectedBooking)
              : undefined
          }
          onCancel={
            selectedBooking?.status === "Pending" || selectedBooking?.status === "Confirmed"
              ? () => {
                  setIsDetailSheetOpen(false);
                  setCancelBooking(selectedBooking);
                }
              : undefined
          }
          onReviewClick={selectedBooking?.status === "Completed" ? handleReviewClick : undefined}
          onMessage={() => {
            if (selectedBooking) {
              setMessagingBooking(selectedBooking);
              setIsDetailSheetOpen(false);
              setIsMessagingOpen(true);
            }
          }}
          isActionPending={
            selectedBooking
              ? pendingAction === selectedBooking.id && (isWritePending || isTxLoading)
              : false
          }
        />

        {/* Cancel Modal */}
        <CancelBookingModal
          open={!!cancelBooking}
          onOpenChange={(open) => {
            if (!open) {
              setCancelBooking(null);
            }
          }}
          booking={
            cancelBooking
              ? {
                  id: cancelBooking.id,
                  propertyName: getPropertyInfo(cancelBooking).name,
                  roomName: getRoomTypeInfo(cancelBooking).name,
                  checkIn: new Date(Number(cancelBooking.checkInDate) * 1000),
                  checkOut: new Date(Number(cancelBooking.checkOutDate) * 1000),
                  nights: Math.ceil(
                    (Number(cancelBooking.checkOutDate) - Number(cancelBooking.checkInDate)) / 86400
                  ),
                  total: Number(cancelBooking.totalPrice) / 1e6,
                  currency: getRoomTypeInfo(cancelBooking).currency,
                  escrowAddress: cancelBooking.escrowAddress || null,
                }
              : null
          }
          onSuccess={() => {
            setCancelBooking(null);
            setTimeout(() => refetchBookings(), 2000);
          }}
        />

        {/* Review Modal - Host reviewing Traveler - Only render when modal is open */}
        {isReviewModalOpen && selectedBooking && selectedBooking.escrowAddress && address && (
          <ReviewSubmissionForm
            booking={{
              id: selectedBooking.id,
              propertyId: selectedBooking.propertyId,
              propertyName: getPropertyInfo(selectedBooking).name,
              roomName: getRoomTypeInfo(selectedBooking).name,
              tokenId: selectedBooking.tokenId,
              bookingIndex: selectedBooking.bookingIndex,
              checkOut: new Date(Number(selectedBooking.checkOutDate) * 1000),
              location:
                allProperties?.find(
                  (p: PropertyWithMetadata) =>
                    p.propertyId.toString() === selectedBooking.propertyId
                )?.metadata?.location || "",
              image: getPropertyInfo(selectedBooking).imageUrl,
              escrowAddress: selectedBooking.escrowAddress,
              hostAddress: address as Address,
              travelerAddress: selectedBooking.traveler as Address,
            }}
            open={isReviewModalOpen}
            onOpenChange={(open) => {
              setIsReviewModalOpen(open);
              // Clear selectedBooking when review modal closes
              if (!open) setSelectedBooking(null);
            }}
            onSuccess={() => {
              refetchBookings();
              setSelectedBooking(null);
            }}
            isTravelerReview={false}
          />
        )}

        {/* Messaging Modal */}
        <BookingMessaging
          open={isMessagingOpen}
          onOpenChange={(open) => {
            setIsMessagingOpen(open);
            if (!open) setMessagingBooking(null);
          }}
          peerAddress={messagingBooking?.traveler || ""}
          bookingId={messagingBooking?.id || ""}
          propertyName={messagingBooking ? getPropertyInfo(messagingBooking).name : ""}
          isHost={true}
        />
      </div>
    </ProtectedRoute>
  );
}
