"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PropertyCreationStepper } from "@/components/host/property-creation-stepper";
import { PropertyBasicInfo } from "@/components/host/steps/property-basic-info";
import { PropertyLocation } from "@/components/host/steps/property-location";
import { PropertyAmenities } from "@/components/host/steps/property-amenities";
import { PropertyRoomTypes } from "@/components/host/steps/property-room-types";
import { PropertyPhotos } from "@/components/host/steps/property-photos";
import { PropertyReview } from "@/components/host/steps/property-review";
import { useTranslation } from "@/lib/hooks/useTranslation";
import type { PropertyMetadata, RoomTypeData } from "@/lib/hooks/usePropertyNFT";

export default function CreatePropertyPage() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [propertyData, setPropertyData] = useState<Partial<PropertyMetadata>>({
    images: [],
    amenities: [],
    houseRules: [],
  });
  const [roomTypes, setRoomTypes] = useState<RoomTypeData[]>([]);

  const steps = [
    {
      title: t("property_creation.step_basic"),
      description: t("property_creation.step_basic_desc"),
      component: PropertyBasicInfo,
    },
    {
      title: t("property_creation.step_location"),
      description: t("property_creation.step_location_desc"),
      component: PropertyLocation,
    },
    {
      title: t("property_creation.step_amenities"),
      description: t("property_creation.step_amenities_desc"),
      component: PropertyAmenities,
    },
    {
      title: t("property_creation.step_rooms"),
      description: t("property_creation.step_rooms_desc"),
      component: PropertyRoomTypes,
    },
    {
      title: t("property_creation.step_photos"),
      description: t("property_creation.step_photos_desc"),
      component: PropertyPhotos,
    },
    {
      title: t("property_creation.step_review"),
      description: t("property_creation.step_review_desc"),
      component: PropertyReview,
    },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  const handleNext = (data: any) => {
    setPropertyData((prev) => ({ ...prev, ...data }));
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <ProtectedRoute requireSBT="host">
      <div className="bg-muted/30 min-h-screen">
        <div className="container max-w-5xl px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">{t("property_creation.title")}</h1>
            <p className="text-muted-foreground">{t("property_creation.subtitle")}</p>
          </div>

          {/* Stepper */}
          <PropertyCreationStepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />

          {/* Step Content */}
          <div className="mt-8">
            <CurrentStepComponent
              data={propertyData}
              roomTypes={roomTypes}
              onNext={handleNext}
              onBack={handleBack}
              onRoomTypesChange={setRoomTypes}
              isFirstStep={currentStep === 0}
              isLastStep={currentStep === steps.length - 1}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
