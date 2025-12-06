"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { usePropertyById, useRoomTypeById, usePropertyMetadata } from "@/lib/hooks/usePropertyNFT";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRoomTypeMetadata } from "@/lib/hooks/property/useIPFSMetadata";
import { useSearchStore } from "@/lib/store/useSearchStore";
import { useBookingStore } from "@/lib/store/useBookingStore";

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { address, hasTravelerSBT, isLoadingSBTs, isConnected } = useAuth();
  const { filters } = useSearchStore();
  const { resetBooking } = useBookingStore();

  const propertyId = params.id ? BigInt(params.id as string) : undefined;
  const tokenId = params.tokenId ? BigInt(params.tokenId as string) : undefined;

  // Reset booking store when entering the booking page to clear any previous booking data
  React.useEffect(() => {
    resetBooking();
  }, [resetBooking]);

  // Fetch property and room type data
  const { data: propertyData, isLoading: isLoadingProperty } = usePropertyById(propertyId);
  const { data: roomTypeData, isLoading: isLoadingRoomType } = useRoomTypeById(tokenId);

  const propertyInfo = propertyData as any;
  const roomInfo = roomTypeData as any;

  const propertyIpfsHash = propertyInfo?.ipfsMetadataHash;
  const { data: propertyMetadata } = usePropertyMetadata(propertyIpfsHash);

  // Fetch room type metadata from IPFS to get price and maxGuests
  const roomIpfsHash = roomInfo?.ipfsMetadataHash;
  const { data: roomMetadata, isLoading: isLoadingRoomMetadata } =
    useRoomTypeMetadata(roomIpfsHash);

  // Prevent owner from booking their own property
  const isOwner = propertyInfo?.hostWallet?.toLowerCase() === address?.toLowerCase();

  // Get search filters for initial values
  const initialCheckIn = filters.checkIn;
  const initialCheckOut = filters.checkOut;
  const initialGuests = filters.guests;

  // Loading state
  if (isLoadingProperty || isLoadingRoomType || isLoadingRoomMetadata || isLoadingSBTs) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (!propertyData || !roomTypeData || !propertyId || !tokenId) {
    return (
      <div className="container flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold">Property or Room Type not found</h1>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  // Check if user has Traveler SBT
  if (isConnected && !hasTravelerSBT) {
    return (
      <div className="container flex min-h-screen flex-col items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
              <UserCheck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle>Traveler Verification Required</CardTitle>
            <CardDescription>
              You need a Traveler SBT (Soulbound Token) to make bookings on NomadNodes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>What is a Traveler SBT?</AlertTitle>
              <AlertDescription>
                A Soulbound Token is a non-transferable NFT that verifies your identity as a trusted
                traveler. It helps build reputation in the NomadNodes ecosystem.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/onboarding">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Get Your Traveler SBT
                </Link>
              </Button>
              <Button variant="outline" onClick={() => router.push(`/property/${propertyId}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Property
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Owner check
  if (isOwner) {
    return (
      <div className="container flex min-h-screen flex-col items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Cannot Book Your Own Property</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You are the owner of this property and cannot make a booking.
            </p>
            <Button onClick={() => router.push(`/property/${propertyId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Property
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Room not active
  if (!roomInfo.isActive) {
    return (
      <div className="container flex min-h-screen flex-col items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Room Type Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This room type is currently not available for booking.
            </p>
            <Button onClick={() => router.push(`/property/${propertyId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Property
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Room deleted
  if (roomInfo.isDeleted) {
    return (
      <div className="container flex min-h-screen flex-col items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Room Type Deleted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">This room type has been deleted.</p>
            <Button onClick={() => router.push(`/property/${propertyId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Property
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const propertyName = propertyMetadata?.name || `Property #${propertyId.toString()}`;
  const location = propertyMetadata?.location || propertyInfo.location || "Unknown Location";
  const roomName = roomInfo.name || roomMetadata?.name || "Unknown Room";
  const maxSupply = Number(roomInfo.maxSupply || 0n);

  // Get price per night from room IPFS metadata (fallback to 0 if not set)
  const pricePerNight = roomMetadata?.pricePerNight || 0;
  const currency = roomMetadata?.currency || "USD";

  // Get max guests from room IPFS metadata or blockchain data
  const maxGuests = roomMetadata?.maxGuests || Number(roomInfo.maxGuests || 2n);

  // Get min/max stay nights
  const minStayNights = roomMetadata?.minStayNights || Number(roomInfo.minStayNights || 1n);
  const maxStayNights = roomMetadata?.maxStayNights || Number(roomInfo.maxStayNights || 30n);

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push(`/property/${propertyId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Property
        </Button>
      </div>

      {/* Property Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Book {roomName}</h1>
        <p className="text-muted-foreground">
          {propertyName} • {location}
        </p>
        {pricePerNight > 0 && (
          <p className="mt-2 text-lg font-semibold">
            {currency === "EUR" ? "€" : "$"}
            {pricePerNight.toFixed(2)}{" "}
            <span className="text-muted-foreground text-sm font-normal">per night</span>
          </p>
        )}
      </div>

      {/* Booking Flow */}
      <div className="mx-auto max-w-3xl">
        <BookingFlow
          tokenId={tokenId}
          propertyId={propertyId}
          propertyName={propertyName}
          roomName={roomName}
          location={location}
          maxSupply={maxSupply}
          pricePerNight={pricePerNight}
          hostAddress={propertyInfo.hostWallet}
          maxGuests={maxGuests}
          minStayNights={minStayNights}
          maxStayNights={maxStayNights}
          currency={currency}
          initialCheckIn={initialCheckIn}
          initialCheckOut={initialCheckOut}
          initialGuests={initialGuests}
        />
      </div>
    </div>
  );
}
