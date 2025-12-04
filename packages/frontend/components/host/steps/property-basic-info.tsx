"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, Home, Building2, Mountain, Castle } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface PropertyBasicInfoProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isFirstStep: boolean;
}

export function PropertyBasicInfo({ data, onNext }: PropertyBasicInfoProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: data.name || "",
    description: data.description || "",
    propertyType: data.propertyType || "apartment",
  });

  const propertyTypes = [
    { value: "hotel", label: t("property_creation.hotel"), icon: Building2 },
    { value: "villa", label: t("property_creation.villa"), icon: Castle },
    { value: "apartment", label: t("property_creation.apartment"), icon: Home },
    { value: "cabin", label: t("property_creation.cabin"), icon: Mountain },
  ];

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 5) {
      newErrors.name = t("property_creation.error_name_required");
    }

    if (!formData.description || formData.description.trim().length < 20) {
      newErrors.description = t("property_creation.error_description_required");
    }

    if (!formData.propertyType) {
      newErrors.propertyType = t("property_creation.error_type_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext(formData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("property_creation.step_basic")}</CardTitle>
        <CardDescription>{t("property_creation.step_basic_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            {t("property_creation.property_name")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder={t("property_creation.property_name_placeholder")}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            {t("property_creation.property_description")}{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder={t("property_creation.description_placeholder")}
            rows={6}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={errors.description ? "border-destructive" : ""}
          />
          {errors.description && <p className="text-destructive text-sm">{errors.description}</p>}
          <p className="text-muted-foreground text-xs">
            {formData.description.length}/500 {t("property_creation.characters")}
          </p>
        </div>

        {/* Property Type */}
        <div className="space-y-3">
          <Label>
            {t("property_creation.property_type_label")} <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.propertyType}
            onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {propertyTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <label
                    key={type.value}
                    htmlFor={type.value}
                    className={`relative flex cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                      formData.propertyType === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                    <div className="flex flex-1 items-start gap-3">
                      <Icon
                        className={`h-6 w-6 ${formData.propertyType === type.value ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{type.label}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </RadioGroup>
          {errors.propertyType && <p className="text-destructive text-sm">{errors.propertyType}</p>}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <Button onClick={handleNext} size="lg">
            {t("common.next")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
