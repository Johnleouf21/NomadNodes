"use client";

/**
 * Main stats grid component (4 top-level stats cards)
 */

import { Users, Building2, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PlatformStats } from "../types";

interface MainStatsGridProps {
  stats: PlatformStats | undefined;
}

export function MainStatsGrid({ stats }: MainStatsGridProps) {
  const totalUsers = (stats?.users.totalHosts || 0) + (stats?.users.totalTravelers || 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Users</p>
              <p className="text-2xl font-bold">{totalUsers}</p>
              <p className="text-muted-foreground text-xs">
                {stats?.users.totalHosts || 0} hosts · {stats?.users.totalTravelers || 0} travelers
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Properties</p>
              <p className="text-2xl font-bold">{stats?.properties.total || 0}</p>
              <p className="text-muted-foreground text-xs">
                {stats?.properties.active || 0} active · {stats?.properties.roomTypes || 0} room
                types
              </p>
            </div>
            <Building2 className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Bookings</p>
              <p className="text-2xl font-bold">{stats?.bookings.total || 0}</p>
              <p className="text-muted-foreground text-xs">
                {stats?.bookings.completed || 0} completed · {stats?.bookings.cancelled || 0}{" "}
                cancelled
              </p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Volume</p>
              <p className="text-2xl font-bold">
                ${(stats?.revenue.totalVolume || 0).toLocaleString()}
              </p>
              <p className="text-muted-foreground text-xs">
                Platform fees: ${(stats?.revenue.platformFees || 0).toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
