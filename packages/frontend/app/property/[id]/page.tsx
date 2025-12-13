"use client";

import { useParams, useRouter } from "next/navigation";
import { MapPin, Star, Bed } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyGallery } from "@/components/property/property-gallery";
import { ReviewsModal } from "@/components/review";
import {
  usePropertyDetail,
  PropertyHeader,
  PropertySidebar,
  RoomTypesSection,
  PropertyDescription,
  PropertyAmenities,
  PropertyHouseRules,
} from "./components";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const propertyId = params.id ? BigInt(params.id as string) : undefined;

  const {
    propertyData,
    metadata,
    ipfsHash,
    roomTypesWithAvailability,
    propertyReviews,
    isOwner,
    displayLocation,
    fullAddress,
    averageRating,
    totalReviews,
    totalBookings,
    totalRoomUnits,
    totalRoomTypesCount,
    availableRoomTypesCount,
    isLoadingProperty,
    isLoadingRoomTypes,
    isLoadingAvailability,
    isLoadingCalendarAvailability,
    dateRange,
    handleDateRangeChange,
    hasUserDateFilters,
    calendarAvailableDates,
    calendarUnavailableDates,
    guests,
    handleGuestsChange,
    reviewsModalOpen,
    setReviewsModalOpen,
  } = usePropertyDetail(propertyId);

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
        <PropertyHeader propertyId={propertyId} isOwner={isOwner} />

        {/* Property Header */}
        <div className="mb-8">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {metadata?.propertyType || propertyData.propertyType}
                </Badge>
                <Badge variant={propertyData.isActive ? "default" : "secondary"}>
                  {propertyData.isActive ? "Active" : "Inactive"}
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
                  <button
                    onClick={() => setReviewsModalOpen(true)}
                    className="hover:bg-muted flex items-center gap-1 rounded-md px-2 py-1 transition-colors"
                  >
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-foreground font-medium">{averageRating.toFixed(1)}</span>
                    <span>({totalReviews} reviews)</span>
                  </button>
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
            {metadata?.description && <PropertyDescription description={metadata.description} />}

            {/* Amenities */}
            {metadata?.amenities && metadata.amenities.length > 0 && (
              <PropertyAmenities amenities={metadata.amenities} />
            )}

            {/* House Rules */}
            {metadata?.houseRules && metadata.houseRules.length > 0 && (
              <PropertyHouseRules houseRules={metadata.houseRules} />
            )}

            {/* Room Types */}
            <RoomTypesSection
              roomTypes={roomTypesWithAvailability}
              propertyId={propertyId}
              totalRoomUnits={totalRoomUnits}
              isLoading={isLoadingRoomTypes}
              isLoadingAvailability={isLoadingAvailability}
              hasUserDateFilters={hasUserDateFilters}
              availableRoomTypesCount={availableRoomTypesCount}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              guests={guests}
              onGuestsChange={handleGuestsChange}
              calendarAvailableDates={calendarAvailableDates}
              calendarUnavailableDates={calendarUnavailableDates}
              isLoadingCalendarAvailability={isLoadingCalendarAvailability}
            />
          </div>

          {/* Sidebar */}
          <PropertySidebar
            propertyId={propertyId}
            averageRating={averageRating}
            totalReviews={totalReviews}
            totalBookings={totalBookings}
            totalRoomUnits={totalRoomUnits}
            fullAddress={fullAddress}
            hostWallet={propertyData.hostWallet}
            createdAt={propertyData.createdAt}
            lastBookingTimestamp={propertyData.lastBookingTimestamp}
            ipfsHash={ipfsHash}
            onReviewsClick={() => setReviewsModalOpen(true)}
          />
        </div>
      </div>

      {/* Reviews Modal */}
      <ReviewsModal
        open={reviewsModalOpen}
        onOpenChange={setReviewsModalOpen}
        reviewsReceived={propertyReviews}
        reviewsGiven={[]}
        averageRating={averageRating}
        totalReviews={totalReviews}
      />
    </div>
  );
}
