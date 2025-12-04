"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Rocket,
  MapPin,
  Home,
  Image as ImageIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { useCreateProperty } from "@/lib/hooks/usePropertyNFT";
import type { PropertyMetadata, RoomTypeData } from "@/lib/hooks/usePropertyNFT";

interface PropertyReviewProps {
  data: Partial<PropertyMetadata>;
  roomTypes: RoomTypeData[];
  onBack: () => void;
  isLastStep: boolean;
}

export function PropertyReview({ data, roomTypes, onBack }: PropertyReviewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [published, setPublished] = useState(false);

  const { createProperty, step, error, isCreating, isSuccess, currentRoomIndex, totalRooms } =
    useCreateProperty({
      onSuccess: (propertyId) => {
        setPublished(true);
      },
      onError: (error) => {
        console.error("Failed to create property:", error);
      },
    });

  const handlePublish = () => {
    // Create property metadata
    const metadata: PropertyMetadata = {
      name: data.name || "",
      description: data.description || "",
      propertyType: (data.propertyType as any) || "apartment",
      location: data.location || "",
      country: data.country || "",
      city: data.city || "",
      address: data.address || "",
      images: data.images || [],
      amenities: data.amenities || [],
      houseRules: data.houseRules || [],
    };

    createProperty(metadata, roomTypes);
  };

  if (published || isSuccess) {
    return (
      <Card className="border-green-500/50">
        <CardContent className="flex flex-col items-center gap-6 py-12">
          <div className="rounded-full bg-green-500/10 p-6">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <div className="text-center">
            <h3 className="mb-2 text-2xl font-bold">{t("property_creation.property_published")}</h3>
            <p className="text-muted-foreground">{t("property_creation.property_live")}</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => router.push("/dashboard/host")}>
              {t("property_creation.go_dashboard")}
            </Button>
            <Button variant="outline" onClick={() => router.push("/explore")}>
              {t("property_creation.view_property")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-6 w-6" />
          {t("property_creation.review_publish")}
        </CardTitle>
        <CardDescription>{t("property_creation.review_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{t("property_creation.basic_information")}</h3>
          <div className="bg-muted space-y-2 rounded-lg p-4">
            <div>
              <p className="text-muted-foreground text-sm">
                {t("property_creation.property_name")}
              </p>
              <p className="font-medium">{data.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">{t("property_creation.type")}</p>
              <Badge variant="secondary">{data.propertyType}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {t("property_creation.property_description")}
              </p>
              <p className="text-sm">{data.description}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Location */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5" />
            {t("property_creation.step_location")}
          </h3>
          <div className="bg-muted rounded-lg p-4">
            <p className="font-medium">
              {data.city}, {data.country}
            </p>
            <p className="text-muted-foreground text-sm">{data.address}</p>
          </div>
        </div>

        <Separator />

        {/* Amenities */}
        {data.amenities && data.amenities.length > 0 && (
          <>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{t("property_creation.step_amenities")}</h3>
              <div className="flex flex-wrap gap-2">
                {data.amenities.map((amenity) => (
                  <Badge key={amenity} variant="outline">
                    {amenity.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Room Types */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Home className="h-5 w-5" />
            {t("property_creation.step_rooms")} ({roomTypes.length})
          </h3>
          <div className="space-y-2">
            {roomTypes.map((room, index) => (
              <div key={index} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{room.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {room.maxSupply} {t("property_creation.units")} • {room.maxGuests}{" "}
                      {t("hero.guests")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {room.pricePerNight} {room.currency === "EUR" ? "€" : "$"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t("property_creation.per_night")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Photos */}
        {data.images && data.images.length > 0 && (
          <>
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <ImageIcon className="h-5 w-5" />
                {t("property_creation.step_photos")} ({data.images.length})
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {data.images.slice(0, 6).map((image, index) => (
                  <div key={index} className="aspect-video overflow-hidden rounded-lg">
                    <img
                      src={image}
                      alt={`Property ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Blockchain Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{t("common.confirm")}:</strong> {t("property_creation.blockchain_warning")}
          </AlertDescription>
        </Alert>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Transaction Status */}
        {isCreating && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              {step === "uploading" && t("property_creation.uploading_ipfs")}
              {step === "creating" && t("property_creation.creating_blockchain")}
              {step === "adding_rooms" &&
                t("property_creation.adding_rooms")
                  .replace("{current}", (currentRoomIndex + 1).toString())
                  .replace("{total}", totalRooms.toString())}
              <br />
              <span className="text-muted-foreground text-xs">
                {t("property_creation.confirm_wallet")}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-between gap-4 pt-4">
          <Button onClick={onBack} variant="outline" size="lg" disabled={isCreating}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
          <Button onClick={handlePublish} size="lg" disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("property_creation.publishing")}
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                {t("property_creation.publish_property")}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
