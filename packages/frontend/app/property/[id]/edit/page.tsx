"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  usePropertyById,
  usePropertyRoomTypes,
  usePropertyMetadata,
} from "@/lib/hooks/usePropertyNFT";
import { useAuth } from "@/lib/hooks/useAuth";
import { PropertyMetadataEditor } from "@/components/property/property-metadata-editor";
import { AddRoomTypeDialog } from "@/components/property/add-room-type-dialog";
import { PropertyCheckInQR } from "@/components/property/PropertyCheckInQR";
import { PropertyStatusCard, PropertyInfoCard, RoomTypesManagement } from "./components";

export default function PropertyEditPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { address } = useAuth();
  const propertyId = params.id ? BigInt(params.id as string) : undefined;
  const [showAddRoomDialog, setShowAddRoomDialog] = React.useState(false);

  // Fetch property data
  const { data: propertyData, isLoading: isLoadingProperty } = usePropertyById(propertyId);
  const {
    data: roomTypeIds,
    isLoading: isLoadingRoomTypes,
    refetch: refetchRoomTypes,
  } = usePropertyRoomTypes(propertyId);

  const data = propertyData as any;
  const ipfsHash = data?.ipfsMetadataHash;
  const { data: metadata } = usePropertyMetadata(ipfsHash);

  const isOwner = data?.hostWallet?.toLowerCase() === address?.toLowerCase();

  // Loading state
  if (isLoadingProperty) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}...</p>
      </div>
    );
  }

  // Not found
  if (!propertyData || !propertyId) {
    return (
      <div className="container flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold">Property not found</h1>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  // Unauthorized
  if (!isOwner) {
    return (
      <div className="container flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold">Unauthorized</h1>
        <p className="text-muted-foreground mb-6">You don't own this property</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Badge variant={data.isActive ? "default" : "secondary"}>
          {data.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">
          Edit {metadata?.name || `Property #${propertyId.toString()}`}
        </h1>
        <p className="text-muted-foreground">{metadata?.location || data.location}</p>
      </div>

      {/* Property Metadata Editor */}
      <div className="mb-6">
        <PropertyMetadataEditor
          propertyId={propertyId}
          currentMetadata={metadata || undefined}
          currentMetadataURI={ipfsHash}
        />
      </div>

      {/* Property Status & Info Grid */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <PropertyStatusCard propertyId={propertyId} isActive={Boolean(data.isActive)} />
        <PropertyInfoCard
          propertyType={data.propertyType}
          totalBookings={Number(data.totalBookings || 0n)}
          averageRating={Number(data.averageRating || 0n)}
          totalReviews={Number(data.totalReviewsReceived || 0n)}
        />
      </div>

      {/* Self Check-In QR Code */}
      <div className="mb-6">
        <PropertyCheckInQR
          propertyId={propertyId.toString()}
          propertyName={metadata?.name || `Property #${propertyId.toString()}`}
          hostAddress={address || ""}
        />
      </div>

      {/* Room Types Management */}
      <RoomTypesManagement
        roomTypeIds={(roomTypeIds as bigint[]) || []}
        propertyId={propertyId}
        isLoading={isLoadingRoomTypes}
        onAddRoomType={() => setShowAddRoomDialog(true)}
      />

      {/* Add Room Type Dialog */}
      {propertyId && (
        <AddRoomTypeDialog
          propertyId={propertyId}
          open={showAddRoomDialog}
          onOpenChange={setShowAddRoomDialog}
          onSuccess={() => refetchRoomTypes()}
        />
      )}
    </div>
  );
}
