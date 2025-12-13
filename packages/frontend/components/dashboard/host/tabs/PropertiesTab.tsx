"use client";

import * as React from "react";
import { Home, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyCardPonder } from "@/components/property/property-card-ponder";
import type { PonderProperty } from "@/hooks/usePonderProperties";

interface PropertiesTabProps {
  properties: PonderProperty[] | undefined;
  isLoading: boolean;
}

export function PropertiesTab({ properties, isLoading }: PropertiesTabProps) {
  const { t } = useTranslation();
  const router = useRouter();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12">
          <Loader2 className="text-muted-foreground mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground">{t("common.loading")}...</p>
        </CardContent>
      </Card>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12">
          <Home className="text-muted-foreground mb-4 h-16 w-16" />
          <p className="mb-2 text-xl font-semibold">{t("dashboard.no_properties")}</p>
          <p className="text-muted-foreground mb-6 text-center text-sm">
            Start hosting by adding your first property
          </p>
          <Button onClick={() => router.push("/host/create-property")}>
            <Plus className="mr-2 h-4 w-4" />
            {t("dashboard.add_property")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCardPonder key={property.id} property={property} />
      ))}
    </div>
  );
}
