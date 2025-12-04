"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowRight,
  ArrowLeft,
  Wifi,
  Car,
  Coffee,
  Waves,
  Wind,
  Utensils,
  Tv,
  Dumbbell,
} from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface PropertyAmenitiesProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function PropertyAmenities({ data, onNext, onBack }: PropertyAmenitiesProps) {
  const { t } = useTranslation();
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(data.amenities || []);
  const [selectedRules, setSelectedRules] = useState<string[]>(data.houseRules || []);

  const amenitiesList = [
    { id: "wifi", label: t("property_creation.wifi"), icon: Wifi },
    { id: "parking", label: t("property_creation.parking"), icon: Car },
    { id: "kitchen", label: t("property_creation.kitchen"), icon: Utensils },
    { id: "pool", label: t("property_creation.pool"), icon: Waves },
    { id: "ac", label: t("property_creation.ac"), icon: Wind },
    { id: "breakfast", label: t("property_creation.breakfast"), icon: Coffee },
    { id: "tv", label: t("property_creation.tv"), icon: Tv },
    { id: "gym", label: t("property_creation.gym"), icon: Dumbbell },
  ];

  const houseRulesList = [
    { id: "no_smoking", label: t("property_creation.no_smoking") },
    { id: "no_pets", label: t("property_creation.no_pets") },
    { id: "no_parties", label: t("property_creation.no_parties") },
    { id: "quiet_hours", label: t("property_creation.quiet_hours") },
  ];

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]
    );
  };

  const toggleRule = (ruleId: string) => {
    setSelectedRules((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    );
  };

  const handleNext = () => {
    onNext({
      amenities: selectedAmenities,
      houseRules: selectedRules,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("property_creation.step_amenities")}</CardTitle>
        <CardDescription>{t("property_creation.step_amenities_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Amenities */}
        <div className="space-y-4">
          <div>
            <Label className="text-base">{t("property_creation.amenities_question")}</Label>
            <p className="text-muted-foreground text-sm">{t("property_creation.select_all")}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {amenitiesList.map((amenity) => {
              const Icon = amenity.icon;
              const isSelected = selectedAmenities.includes(amenity.id);

              return (
                <label
                  key={amenity.id}
                  htmlFor={amenity.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Checkbox
                    id={amenity.id}
                    checked={isSelected}
                    onCheckedChange={() => toggleAmenity(amenity.id)}
                  />
                  <Icon
                    className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span className="text-sm font-medium">{amenity.label}</span>
                </label>
              );
            })}
          </div>

          {selectedAmenities.length === 0 && (
            <p className="text-muted-foreground text-sm">{t("property_creation.no_amenities")}</p>
          )}
        </div>

        {/* House Rules */}
        <div className="space-y-4">
          <div>
            <Label className="text-base">{t("property_creation.house_rules")}</Label>
            <p className="text-muted-foreground text-sm">
              {t("property_creation.house_rules_desc")}
            </p>
          </div>

          <div className="space-y-3">
            {houseRulesList.map((rule) => (
              <label
                key={rule.id}
                htmlFor={rule.id}
                className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors"
              >
                <Checkbox
                  id={rule.id}
                  checked={selectedRules.includes(rule.id)}
                  onCheckedChange={() => toggleRule(rule.id)}
                />
                <span className="text-sm">{rule.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-4 pt-4">
          <Button onClick={onBack} variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
          <Button onClick={handleNext} size="lg">
            {t("common.next")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
