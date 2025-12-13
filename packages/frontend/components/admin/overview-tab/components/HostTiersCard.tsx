"use client";

/**
 * Host tiers card component
 */

import { Home, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TierRow } from "./TierRow";
import type { PlatformStats } from "../types";

interface HostTiersCardProps {
  stats: PlatformStats | undefined;
}

export function HostTiersCard({ stats }: HostTiersCardProps) {
  const totalHosts = stats?.users.totalHosts || 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Home className="h-4 w-4" />
          Host Tiers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <TierRow
          label="Newcomer"
          value={stats?.users.hostsByTier?.newcomer || 0}
          total={totalHosts}
        />
        <TierRow
          label="Experienced"
          value={stats?.users.hostsByTier?.experienced || 0}
          total={totalHosts}
        />
        <TierRow label="Pro" value={stats?.users.hostsByTier?.pro || 0} total={totalHosts} />
        <TierRow
          label="SuperHost"
          value={stats?.users.hostsByTier?.superHost || 0}
          total={totalHosts}
        />
        <Separator />
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1">
            <Award className="h-3 w-3 text-yellow-500" />
            SuperHosts
          </span>
          <Badge variant="secondary">{stats?.users.superHosts || 0}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
