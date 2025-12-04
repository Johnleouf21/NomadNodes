"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Star,
  Users,
  Bed,
  Edit,
  Calendar,
  Clock,
  Wifi,
  Car,
  Waves,
  Utensils,
  Wind,
  Tv,
  Dumbbell,
  Sparkles,
  Sun,
  Flame,
  ShowerHead,
  CheckCircle2,
  XCircle,
  Info,
  ImageIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PropertyGallery } from "@/components/property/property-gallery";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { usePropertyById, useRoomTypeById, usePropertyMetadata } from "@/lib/hooks/usePropertyNFT";
import { useRoomTypeMetadata } from "@/lib/hooks/property/useIPFSMetadata";
import { useCheckMultipleAvailability, useCalendarAvailability } from "@/lib/hooks/property";
import { useAuth } from "@/lib/hooks/useAuth";
import { getIPFSUrl } from "@/lib/utils/ipfs";
import { formatAddress } from "@/lib/utils";
import { useMemo } from "react";
import { usePonderRoomTypes, type RoomTypeWithMeta_data } from "@/hooks/usePonderRoomTypes";
import { useSearchStore } from "@/lib/store";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { GuestSelector } from "@/components/ui/guest-selector";
import type { DateRange } from "react-day-picker";

// Amenity icons mapping
const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  pool: <Waves className="h-4 w-4" />,
  kitchen: <Utensils className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  air_conditioning: <Wind className="h-4 w-4" />,
  heating: <Flame className="h-4 w-4" />,
  washer: <ShowerHead className="h-4 w-4" />,
  dryer: <Wind className="h-4 w-4" />,
  tv: <Tv className="h-4 w-4" />,
  gym: <Dumbbell className="h-4 w-4" />,
  hot_tub: <Sparkles className="h-4 w-4" />,
  beach_access: <Sun className="h-4 w-4" />,
};

function getAmenityIcon(amenity: string) {
  const key = amenity.toLowerCase().replace(/\s+/g, "_");
  return amenityIcons[key] || <CheckCircle2 className="h-4 w-4" />;
}

function formatAmenityName(amenity: string) {
  return amenity.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { address } = useAuth();
  const propertyId = params.id ? BigInt(params.id as string) : undefined;

  // Get search filters from store (dates selected by user)
  const { filters: searchFilters, setFilters } = useSearchStore();

  // Convert search filters to DateRange format for DateRangePicker
  const dateRange: DateRange | undefined = useMemo(() => {
    if (searchFilters.checkIn && searchFilters.checkOut) {
      return { from: searchFilters.checkIn, to: searchFilters.checkOut };
    }
    return undefined;
  }, [searchFilters.checkIn, searchFilters.checkOut]);

  // Handle date range change from DateRangePicker
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setFilters({ checkIn: range.from, checkOut: range.to });
    } else if (range?.from) {
      setFilters({ checkIn: range.from, checkOut: null });
    } else {
      setFilters({ checkIn: null, checkOut: null });
    }
  };

  // Handle guest count change
  const handleGuestsChange = (guests: number) => {
    setFilters({ guests });
  };

  // Check if user has selected dates
  const hasUserDateFilters = !!(searchFilters.checkIn && searchFilters.checkOut);

  // Fetch property data
  const { data: propertyData, isLoading: isLoadingProperty } = usePropertyById(propertyId);

  // Use Ponder to get only active, non-deleted room types with metadata
  const { data: ponderRoomTypes, isLoading: isLoadingRoomTypes } = usePonderRoomTypes(
    propertyId?.toString()
  );

  // Extract tokenIds from room types for availability check
  const roomTokenIds = useMemo(() => {
    if (!ponderRoomTypes) return [];
    return ponderRoomTypes.map((rt: RoomTypeWithMeta_data) => BigInt(rt.tokenId));
  }, [ponderRoomTypes]);

  // Check availability using multicall - calls checkAvailability for each room type
  // This is ONLY enabled when user has selected dates
  const { availabilityMap, isLoading: isLoadingAvailability } = useCheckMultipleAvailability(
    roomTokenIds,
    searchFilters.checkIn,
    searchFilters.checkOut,
    hasUserDateFilters && roomTokenIds.length > 0
  );

  // Get calendar availability for visual display in date picker
  // Check next 90 days starting from today
  const calendarStartDate = useMemo(() => new Date(), []);
  const {
    availableDates: calendarAvailableDates,
    unavailableDates: calendarUnavailableDates,
    isLoading: isLoadingCalendarAvailability,
  } = useCalendarAvailability(
    roomTokenIds,
    calendarStartDate,
    90, // Check 90 days ahead
    roomTokenIds.length > 0 // Only enable when we have room types
  );

  // Show room types with availability status based on user's selected dates
  const roomTypesWithAvailability = useMemo(() => {
    if (!ponderRoomTypes) return [];

    return ponderRoomTypes.map((roomType: RoomTypeWithMeta_data) => {
      // If no dates selected, show all as available (user will check on booking page)
      // If dates selected, check if this room has availability
      const isAvailable = !hasUserDateFilters
        ? true
        : (availabilityMap.get(roomType.tokenId.toString()) ?? false);

      return {
        ...roomType,
        isAvailable,
      };
    });
  }, [ponderRoomTypes, hasUserDateFilters, availabilityMap]);

  // Count only available room types
  const availableRoomTypesCount = useMemo(() => {
    return roomTypesWithAvailability.filter((rt) => rt.isAvailable).length;
  }, [roomTypesWithAvailability]);

  // Calculate total room units (sum of totalSupply across all room types)
  const totalRoomUnits = useMemo(() => {
    return roomTypesWithAvailability.reduce((sum, rt) => sum + Number(rt.totalSupply || 0), 0);
  }, [roomTypesWithAvailability]);

  const data = propertyData as any;
  const ipfsHash = data?.ipfsMetadataHash;
  const { data: metadata } = usePropertyMetadata(ipfsHash);

  const isOwner = data?.hostWallet?.toLowerCase() === address?.toLowerCase();

  // Calculate display values
  const averageRating = Number(data?.averageRating || 0n) / 100;
  const totalReviews = Number(data?.totalReviewsReceived || 0n);
  const totalBookings = Number(data?.totalBookings || 0n);
  // Show total room types count, with available count separately
  const totalRoomTypesCount = roomTypesWithAvailability.length;

  // Format location
  const displayLocation = useMemo(() => {
    if (metadata?.city && metadata?.country) {
      return `${metadata.city}, ${metadata.country}`;
    }
    return metadata?.location || data?.location || "Unknown Location";
  }, [metadata, data]);

  const fullAddress = useMemo(() => {
    const parts = [metadata?.address, metadata?.city, metadata?.country].filter(Boolean);
    return parts.join(", ") || displayLocation;
  }, [metadata, displayLocation]);

  if (isLoadingProperty) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">{t("common.loading")}...</p>
        </div>
      </div>
    );
  }

  if (!propertyData || !propertyId) {
    return (
      <div className="container flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold">Property not found</h1>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="from-background to-muted/20 min-h-screen bg-gradient-to-b">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {isOwner && (
            <Button onClick={() => router.push(`/property/${propertyId}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Property
            </Button>
          )}
        </div>

        {/* Property Header */}
        <div className="mb-8">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {metadata?.propertyType || data.propertyType}
                </Badge>
                <Badge variant={data.isActive ? "default" : "secondary"}>
                  {data.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <h1 className="mb-3 text-3xl font-bold md:text-4xl">
                {metadata?.name || `Property #${propertyId.toString()}`}
              </h1>
              <div className="text-muted-foreground flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{displayLocation}</span>
                </div>
                {averageRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-foreground font-medium">{averageRating.toFixed(1)}</span>
                    <span>({totalReviews} reviews)</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  <span>
                    {totalRoomUnits} room{totalRoomUnits !== 1 ? "s" : ""}
                  </span>
                  {totalRoomTypesCount > 1 && (
                    <span className="text-xs">({totalRoomTypesCount} types)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Property Gallery */}
          <PropertyGallery
            images={metadata?.images || []}
            propertyName={metadata?.name || `Property #${propertyId.toString()}`}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            {metadata?.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    About this property
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {metadata.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {metadata?.amenities && metadata.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Amenities
                  </CardTitle>
                  <CardDescription>What this property offers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {metadata.amenities.map((amenity) => (
                      <div
                        key={amenity}
                        className="bg-muted/50 flex items-center gap-2 rounded-lg border p-3"
                      >
                        {getAmenityIcon(amenity)}
                        <span className="text-sm">{formatAmenityName(amenity)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* House Rules */}
            {metadata?.houseRules && metadata.houseRules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    House Rules
                  </CardTitle>
                  <CardDescription>Please follow these rules during your stay</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {metadata.houseRules.map((rule, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                        <span className="text-muted-foreground">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Room Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bed className="h-5 w-5" />
                  Room Types
                </CardTitle>
                <CardDescription>
                  {totalRoomTypesCount > 0
                    ? `${totalRoomTypesCount} room type${totalRoomTypesCount !== 1 ? "s" : ""} • ${totalRoomUnits} room${totalRoomUnits !== 1 ? "s" : ""} total`
                    : "No rooms configured"}
                </CardDescription>
                {/* Interactive date and guest selection */}
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <DateRangePicker
                        dateRange={dateRange}
                        onDateRangeChange={handleDateRangeChange}
                        placeholder="Select dates to check availability"
                        className="w-full"
                        availableDates={calendarAvailableDates}
                        unavailableDates={calendarUnavailableDates}
                        availabilityLoading={isLoadingCalendarAvailability}
                      />
                    </div>
                    <div className="w-full sm:w-40">
                      <GuestSelector
                        guests={searchFilters.guests}
                        onGuestsChange={handleGuestsChange}
                        className="w-full"
                      />
                    </div>
                  </div>
                  {/* Availability status indicator */}
                  {hasUserDateFilters && (
                    <div
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isLoadingAvailability
                          ? "bg-muted/50"
                          : availableRoomTypesCount > 0
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-red-500/10 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {isLoadingAvailability ? (
                        <>
                          <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                          <span>Checking availability...</span>
                        </>
                      ) : availableRoomTypesCount > 0 ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>
                            <strong>{availableRoomTypesCount}</strong> room type
                            {availableRoomTypesCount !== 1 ? "s" : ""} available for your dates
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          <span>No rooms available for selected dates</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingRoomTypes || (hasUserDateFilters && isLoadingAvailability) ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                  </div>
                ) : roomTypesWithAvailability.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bed className="text-muted-foreground/50 mb-2 h-12 w-12" />
                    <p className="text-muted-foreground">No room types configured</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {roomTypesWithAvailability.map((roomType) => (
                      <PonderRoomTypeCard
                        key={roomType.id}
                        roomType={roomType}
                        propertyId={propertyId!.toString()}
                        isAvailable={roomType.isAvailable}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Star className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
                    <p className="text-2xl font-bold">
                      {averageRating > 0 ? averageRating.toFixed(1) : "N/A"}
                    </p>
                    <p className="text-muted-foreground text-xs">Rating</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Users className="mx-auto mb-2 h-6 w-6 text-blue-500" />
                    <p className="text-2xl font-bold">{totalBookings}</p>
                    <p className="text-muted-foreground text-xs">Bookings</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Bed className="mx-auto mb-2 h-6 w-6 text-green-500" />
                    <p className="text-2xl font-bold">{totalRoomUnits}</p>
                    <p className="text-muted-foreground text-xs">Rooms</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Star className="mx-auto mb-2 h-6 w-6 text-purple-500" />
                    <p className="text-2xl font-bold">{totalReviews}</p>
                    <p className="text-muted-foreground text-xs">Reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-muted-foreground mb-1 text-sm font-medium">Full Address</p>
                  <p className="text-sm">{fullAddress}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1 text-sm font-medium">Property ID</p>
                  <p className="font-mono text-sm">{propertyId.toString()}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1 text-sm font-medium">Host</p>
                  <p className="font-mono text-xs">{formatAddress(data.hostWallet)}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1 text-sm font-medium">Listed On</p>
                  <p className="text-sm">
                    {new Date(Number(data.createdAt || 0n) * 1000).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {data.lastBookingTimestamp && Number(data.lastBookingTimestamp) > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground mb-1 text-sm font-medium">Last Booking</p>
                      <p className="text-sm">
                        {new Date(Number(data.lastBookingTimestamp) * 1000).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* IPFS Info */}
            {ipfsHash && ipfsHash !== "QmPlaceholder" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Blockchain Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs">IPFS Hash</p>
                    <p className="font-mono text-xs break-all">{ipfsHash}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Room type card that uses pre-loaded Ponder data with metadata
interface PonderRoomTypeCardProps {
  roomType: import("@/hooks/usePonderRoomTypes").RoomTypeWithMeta_data;
  propertyId: string;
  isAvailable?: boolean;
}

function PonderRoomTypeCard({ roomType, propertyId, isAvailable = true }: PonderRoomTypeCardProps) {
  const router = useRouter();
  const { address } = useAuth();
  const metadata = roomType.meta_data;

  // Get image URLs
  const imageUrls = useMemo(() => {
    if (!metadata?.images || metadata.images.length === 0) {
      return [];
    }
    return metadata.images.map((img) => getIPFSUrl(img));
  }, [metadata?.images]);

  const canBook = !!address && isAvailable;
  const pricePerNight = metadata?.pricePerNight || 0;
  const currency = metadata?.currency || "USD";
  const currencySymbol = currency === "EUR" ? "€" : "$";
  const maxSupply = Number(roomType.totalSupply || 0);
  const maxGuests = metadata?.maxGuests || Number(roomType.maxGuests || 0);
  const minStayNights = metadata?.minStayNights || 1;
  const maxStayNights = metadata?.maxStayNights || 30;

  return (
    <div className="bg-card overflow-hidden rounded-xl border transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        {/* Room Image */}
        <div className="relative h-48 w-full shrink-0 sm:h-auto sm:w-48">
          {imageUrls.length > 0 ? (
            <ImageCarousel
              images={imageUrls}
              alt={metadata?.name || roomType.name}
              aspectRatio="none"
              className="h-full w-full"
              showIndicators={imageUrls.length > 1}
              showArrows={imageUrls.length > 1}
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <ImageIcon className="text-muted-foreground/50 h-12 w-12" />
            </div>
          )}
        </div>

        {/* Room Details */}
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-semibold">{metadata?.name || roomType.name}</h4>
              {!isAvailable && (
                <Badge variant="destructive" className="text-xs">
                  Épuisé
                </Badge>
              )}
            </div>
            {metadata?.description && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {metadata.description}
              </p>
            )}
          </div>

          {/* Room Features */}
          <div className="text-muted-foreground mb-3 flex flex-wrap items-center gap-3 text-sm">
            {maxGuests > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {maxGuests} guest{maxGuests !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {minStayNights > 0 && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Min {minStayNights} night{minStayNights !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {maxStayNights > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Max {maxStayNights} nights</span>
              </div>
            )}
            {maxSupply > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>
                  {maxSupply} unit{maxSupply !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Room Amenities (compact) */}
          {metadata?.amenities && metadata.amenities.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {metadata.amenities.slice(0, 4).map((amenity) => (
                <Badge key={amenity} variant="outline" className="text-xs">
                  {formatAmenityName(amenity)}
                </Badge>
              ))}
              {metadata.amenities.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{metadata.amenities.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* Price and Book Button */}
          <div className="mt-auto flex items-end justify-between">
            <div>
              {pricePerNight > 0 ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">
                    {currencySymbol}
                    {pricePerNight}
                  </span>
                  <span className="text-muted-foreground text-sm">/ night</span>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Price on request</span>
              )}
            </div>
            <Button
              onClick={() => router.push(`/property/${propertyId}/book/${roomType.tokenId}`)}
              disabled={!canBook}
              size="sm"
              variant={!isAvailable ? "secondary" : "default"}
            >
              {!address ? "Connect Wallet" : !isAvailable ? "Épuisé" : "Book Now"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
