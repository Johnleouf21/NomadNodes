"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { ImageUpload } from "@/components/ui/image-upload";

interface PropertyPhotosProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function PropertyPhotos({ data, onNext, onBack }: PropertyPhotosProps) {
  const { t } = useTranslation();
  const [images, setImages] = useState<string[]>(data.images || []);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (images.length === 0) {
      setError(t("property_creation.error_add_photo"));
      return;
    }
    onNext({ images });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("property_creation.photos_title")}</CardTitle>
        <CardDescription>{t("property_creation.photos_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div className="space-y-4">
          <ImageUpload
            images={images}
            onChange={(newImages) => {
              setImages(newImages);
              setError(null);
            }}
            maxImages={10}
            label={t("property_creation.click_upload")}
          />

          {images.length > 0 && (
            <p className="text-muted-foreground text-sm">
              {t("property_creation.cover_note") ||
                "The first image will be used as the cover photo"}
            </p>
          )}
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        {/* Actions */}
        <div className="flex justify-between gap-4 pt-4">
          <Button onClick={onBack} variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
          <Button onClick={handleNext} size="lg" disabled={images.length === 0}>
            {t("common.next")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
