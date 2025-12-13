"use client";

/**
 * Traveler tiers card component
 */

import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierRow } from "./TierRow";
import type { PlatformStats } from "../types";

interface TravelerTiersCardProps {
  stats: PlatformStats | undefined;
}

export function TravelerTiersCard({ stats }: TravelerTiersCardProps) {
  const totalTravelers = stats?.users.totalTravelers || 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4" />
          Traveler Tiers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <TierRow
          label="Newcomer"
          value={stats?.users.travelersByTier?.newcomer || 0}
          total={totalTravelers}
        />
        <TierRow
          label="Regular"
          value={stats?.users.travelersByTier?.regular || 0}
          total={totalTravelers}
        />
        <TierRow
          label="Trusted"
          value={stats?.users.travelersByTier?.trusted || 0}
          total={totalTravelers}
        />
        <TierRow
          label="Elite"
          value={stats?.users.travelersByTier?.elite || 0}
          total={totalTravelers}
        />
      </CardContent>
    </Card>
  );
}
