"use client";

import * as React from "react";
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  Star,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Home,
  User,
  Award,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { usePlatformStats, useRecentBookings } from "@/lib/hooks/contracts/useAdminPlatform";

interface PlatformOverviewTabProps {
  stats: ReturnType<typeof usePlatformStats>["data"];
  isLoading: boolean;
  pendingReviews: number;
  totalReviews: number;
}

export function PlatformOverviewTab({
  stats,
  isLoading,
  pendingReviews,
  totalReviews,
}: PlatformOverviewTabProps) {
  const { data: recentBookings, isLoading: isLoadingRecent } = useRecentBookings(5);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-12">
          <Loader2 className="text-muted-foreground mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground">Loading platform statistics...</p>
        </CardContent>
      </Card>
    );
  }

  const totalUsers = (stats?.users.totalHosts || 0) + (stats?.users.totalTravelers || 0);

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-muted-foreground text-xs">
                  {stats?.users.totalHosts || 0} hosts · {stats?.users.totalTravelers || 0}{" "}
                  travelers
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

      {/* Secondary Stats - 4 columns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Bookings by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Bookings Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatusRow label="Pending" value={stats?.bookings.pending || 0} color="bg-yellow-500" />
            <StatusRow
              label="Confirmed"
              value={stats?.bookings.confirmed || 0}
              color="bg-blue-500"
            />
            <StatusRow
              label="Checked In"
              value={stats?.bookings.checkedIn || 0}
              color="bg-purple-500"
            />
            <StatusRow
              label="Completed"
              value={stats?.bookings.completed || 0}
              color="bg-green-500"
            />
            <StatusRow
              label="Cancelled"
              value={stats?.bookings.cancelled || 0}
              color="bg-red-500"
            />
          </CardContent>
        </Card>

        {/* Host Tiers */}
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
              total={stats?.users.totalHosts || 1}
            />
            <TierRow
              label="Experienced"
              value={stats?.users.hostsByTier?.experienced || 0}
              total={stats?.users.totalHosts || 1}
            />
            <TierRow
              label="Pro"
              value={stats?.users.hostsByTier?.pro || 0}
              total={stats?.users.totalHosts || 1}
            />
            <TierRow
              label="SuperHost"
              value={stats?.users.hostsByTier?.superHost || 0}
              total={stats?.users.totalHosts || 1}
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

        {/* Traveler Tiers */}
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
              total={stats?.users.totalTravelers || 1}
            />
            <TierRow
              label="Regular"
              value={stats?.users.travelersByTier?.regular || 0}
              total={stats?.users.totalTravelers || 1}
            />
            <TierRow
              label="Trusted"
              value={stats?.users.travelersByTier?.trusted || 0}
              total={stats?.users.totalTravelers || 1}
            />
            <TierRow
              label="Elite"
              value={stats?.users.travelersByTier?.elite || 0}
              total={stats?.users.totalTravelers || 1}
            />
          </CardContent>
        </Card>

        {/* Moderation & Alerts */}
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
              <Badge variant={pendingReviews > 0 ? "destructive" : "secondary"}>
                {pendingReviews}
              </Badge>
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
      </div>

      {/* Revenue & Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Total Volume Processed</span>
              <span className="text-xl font-bold">
                ${(stats?.revenue.totalVolume || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Completed Transactions</span>
              <span className="font-medium">
                ${(stats?.revenue.totalCompleted || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Pending in Escrow</span>
              <span className="font-medium text-yellow-600">
                ${(stats?.revenue.pendingValue || 0).toLocaleString()}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Platform Fees (5%)</span>
              <span className="text-xl font-bold text-green-600">
                ${(stats?.revenue.platformFees || 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest bookings on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRecent ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !recentBookings?.length ? (
              <p className="text-muted-foreground py-4 text-center text-sm">No recent bookings</p>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Property #{booking.propertyId}</p>
                        <p className="text-muted-foreground text-xs">
                          {booking.traveler.slice(0, 6)}...{booking.traveler.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          booking.status === "Completed"
                            ? "default"
                            : booking.status === "Cancelled"
                              ? "destructive"
                              : booking.status === "CheckedIn"
                                ? "outline"
                                : "secondary"
                        }
                      >
                        {booking.status}
                      </Badge>
                      <p className="text-muted-foreground mt-1 text-xs">
                        ${(Number(booking.totalPrice) / 1e6).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function TierRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <Progress value={percentage} className="h-1.5" />
    </div>
  );
}
