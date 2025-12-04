"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface PropertyLocationProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function PropertyLocation({ data, onNext, onBack }: PropertyLocationProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    country: data.country || "",
    city: data.city || "",
    address: data.address || "",
    location: data.location || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.country || formData.country.trim().length < 2) {
      newErrors.country = t("property_creation.error_country_required");
    }

    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = t("property_creation.error_city_required");
    }

    if (!formData.address || formData.address.trim().length < 5) {
      newErrors.address = t("property_creation.error_address_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      const location = `${formData.city}, ${formData.country}`;
      onNext({ ...formData, location });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("property_creation.step_location")}</CardTitle>
        <CardDescription>{t("property_creation.step_location_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">
            {t("property_creation.country")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="country"
            placeholder={t("property_creation.country_placeholder")}
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className={errors.country ? "border-destructive" : ""}
          />
          {errors.country && <p className="text-destructive text-sm">{errors.country}</p>}
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">
            {t("property_creation.city")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            placeholder={t("property_creation.city_placeholder")}
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className={errors.city ? "border-destructive" : ""}
          />
          {errors.city && <p className="text-destructive text-sm">{errors.city}</p>}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">
            {t("property_creation.street_address")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="address"
            placeholder={t("property_creation.address_placeholder")}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className={errors.address ? "border-destructive" : ""}
          />
          {errors.address && <p className="text-destructive text-sm">{errors.address}</p>}
          <p className="text-muted-foreground text-xs">
            <MapPin className="mr-1 inline h-3 w-3" />
            {t("property_creation.address_privacy")}
          </p>
        </div>

        {/* Preview */}
        {formData.city && formData.country && (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-muted-foreground text-sm font-medium">
              {t("property_creation.location_display")}
            </p>
            <p className="text-lg font-semibold">
              {formData.city}, {formData.country}
            </p>
          </div>
        )}

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
