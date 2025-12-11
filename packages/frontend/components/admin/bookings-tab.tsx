"use client";

import * as React from "react";
import {
  Calendar,
  RefreshCw,
  Loader2,
  User,
  Home,
  DollarSign,
  Clock,
  ExternalLink,
  Shield,
  BedDouble,
  Moon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  useBookingsByStatus,
  useAllEscrows,
  type RecentBooking,
  type EscrowData,
} from "@/lib/hooks/contracts/useAdminPlatform";

const BOOKING_STATUSES = ["Pending", "Confirmed", "CheckedIn", "Completed", "Cancelled"] as const;

export function BookingsMonitoringTab() {
  const [statusFilter, setStatusFilter] = React.useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: bookings, isLoading, refetch } = useBookingsByStatus(statusFilter);
  const { data: escrows, isLoading: isLoadingEscrows, refetch: refetchEscrows } = useAllEscrows();

  // Create a map of escrow addresses to escrow data
  const escrowMap = React.useMemo(() => {
    if (!escrows) return {};
    return escrows.reduce(
      (acc, e) => {
        acc[e.id.toLowerCase()] = e;
        return acc;
      },
      {} as Record<string, EscrowData>
    );
  }, [escrows]);

  // Filter bookings by search query
  const filteredBookings = React.useMemo(() => {
    if (!bookings) return [];
    if (!searchQuery) return bookings;
    const query = searchQuery.toLowerCase();
    return bookings.filter(
      (b) =>
        b.propertyId.includes(query) ||
        b.traveler.toLowerCase().includes(query) ||
        b.id.includes(query)
    );
  }, [bookings, searchQuery]);

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!bookings) return null;
    const totalValue = bookings.reduce((sum, b) => sum + Number(b.totalPrice) / 1e6, 0);
    const statusCounts = bookings.reduce(
      (acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return { totalValue, statusCounts, total: bookings.length };
  }, [bookings]);

  const handleRefresh = () => {
    refetch();
    refetchEscrows();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Completed":
        return "default";
      case "Cancelled":
        return "destructive";
      case "CheckedIn":
        return "outline";
      case "Confirmed":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500";
      case "Cancelled":
        return "bg-red-500";
      case "CheckedIn":
        return "bg-purple-500";
      case "Confirmed":
        return "bg-blue-500";
      case "Pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Calendar className="text-muted-foreground h-8 w-8" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Value</p>
                  <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Active Escrows</p>
                  <p className="text-2xl font-bold">{escrows?.length || 0}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">In Progress</p>
                  <p className="text-2xl font-bold">
                    {(stats.statusCounts["Pending"] || 0) +
                      (stats.statusCounts["Confirmed"] || 0) +
                      (stats.statusCounts["CheckedIn"] || 0)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <Input
            placeholder="Search by ID or traveler..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!statusFilter ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(undefined)}
            >
              All ({bookings?.length || 0})
            </Button>
            {BOOKING_STATUSES.map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="gap-1"
              >
                <div className={`h-2 w-2 rounded-full ${getStatusColor(status)}`} />
                {status}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Bookings List */}
      {isLoading || isLoadingEscrows ? (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      ) : !filteredBookings?.length ? (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center">
            <Calendar className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground">No bookings found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              escrow={
                booking.escrowAddress ? escrowMap[booking.escrowAddress.toLowerCase()] : undefined
              }
              getStatusBadgeVariant={getStatusBadgeVariant}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface BookingCardProps {
  booking: RecentBooking;
  escrow?: EscrowData;
  getStatusBadgeVariant: (status: string) => "default" | "secondary" | "destructive" | "outline";
}

function BookingCard({ booking, escrow, getStatusBadgeVariant }: BookingCardProps) {
  const checkIn = new Date(Number(booking.checkInDate) * 1000);
  const checkOut = new Date(Number(booking.checkOutDate) * 1000);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const created = new Date(Number(booking.createdAt) * 1000);
  const pricePerNight = Number(booking.totalPrice) / 1e6 / nights;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {/* Main Info */}
          <div className="flex items-start gap-4">
            <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">Booking #{booking.id.slice(0, 8)}</p>
                <Badge variant={getStatusBadgeVariant(booking.status)}>{booking.status}</Badge>
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-1.5">
                  <Home className="text-muted-foreground h-4 w-4" />
                  <span>Property #{booking.propertyId}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BedDouble className="text-muted-foreground h-4 w-4" />
                  <span>Room #{booking.roomTypeId}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="text-muted-foreground h-4 w-4" />
                  <span className="font-mono text-xs">
                    {booking.traveler.slice(0, 6)}...{booking.traveler.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span>{created.toLocaleDateString()}</span>
                </div>
              </div>

              {/* Stay Details */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span>
                    {checkIn.toLocaleDateString()} → {checkOut.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Moon className="text-muted-foreground h-4 w-4" />
                  <span>
                    {nights} night{nights !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Escrow Info */}
              {booking.escrowAddress && (
                <div className="mt-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-xs">Escrow:</span>
                  <span className="font-mono text-xs">
                    {booking.escrowAddress.slice(0, 8)}...{booking.escrowAddress.slice(-6)}
                  </span>
                  {escrow && (
                    <Badge variant="outline" className="text-xs">
                      ${(Number(escrow.price) / 1e6).toFixed(2)} locked
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Price Info */}
          <div className="flex flex-col items-end gap-1 text-right">
            <p className="text-xl font-bold">${(Number(booking.totalPrice) / 1e6).toFixed(2)}</p>
            <p className="text-muted-foreground text-xs">${pricePerNight.toFixed(2)}/night</p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <a href={`/property/${booking.propertyId}`} target="_blank">
                <ExternalLink className="mr-1 h-3 w-3" />
                View Property
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
