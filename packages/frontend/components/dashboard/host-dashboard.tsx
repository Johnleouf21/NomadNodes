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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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

  // Action state
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  // Contract interactions
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
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

  // Handle transaction success
  React.useEffect(() => {
    if (isTxSuccess && pendingAction) {
      toast.success("Action completed successfully");
      setPendingAction(null);
      // Refetch bookings after a short delay to allow indexer to catch up
      setTimeout(() => refetchBookings(), 2000);
    }
  }, [isTxSuccess, pendingAction, refetchBookings]);

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
      writeContract({
        ...CONTRACTS.bookingManager,
        functionName: "checkInBooking",
        args: [BigInt(booking.tokenId), BigInt(booking.bookingIndex)],
      });
      toast.info("Processing check-in...", { description: "Please confirm in your wallet" });
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

  // Calculate enhanced stats
  const totalProperties = hostProperties?.length || 0;
  const pendingBookings = bookingCounts.Pending;
  const activeBookings = bookingCounts.Confirmed + bookingCounts.CheckedIn;
  const completedBookings = bookingCounts.Completed;

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
      value: pendingBookings.toString(),
      icon: Clock,
      trend: pendingBookings > 0 ? "Needs your attention" : "All caught up!",
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="properties">{t("dashboard.my_listings")}</TabsTrigger>
            <TabsTrigger value="bookings" className="relative">
              {t("dashboard.total_bookings")}
              {pendingBookings > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white">
                  {pendingBookings}
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
            if (!open) setSelectedBooking(null);
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
      </div>
    </ProtectedRoute>
  );
}
