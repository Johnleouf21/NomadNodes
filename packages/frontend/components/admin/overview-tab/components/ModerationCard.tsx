"use client";

/**
 * Moderation card component
 */

import { AlertTriangle, Clock, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { PlatformStats } from "../types";

interface ModerationCardProps {
  stats: PlatformStats | undefined;
  pendingReviews: number;
  totalReviews: number;
}

export function ModerationCard({ stats, pendingReviews, totalReviews }: ModerationCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4" />
          Moderation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-yellow-500" />
            Pending Reviews
          </span>
          <Badge variant={pendingReviews > 0 ? "destructive" : "secondary"}>{pendingReviews}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <Star className="text-primary h-4 w-4" />
            Total Reviews
          </span>
          <span className="font-medium">{stats?.reviews?.total || totalReviews}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Suspended Hosts
          </span>
          <Badge variant={stats?.users.suspendedHosts ? "destructive" : "outline"}>
            {stats?.users.suspendedHosts || 0}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Suspended Travelers
          </span>
          <Badge variant={stats?.users.suspendedTravelers ? "destructive" : "outline"}>
            {stats?.users.suspendedTravelers || 0}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
