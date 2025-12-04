"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { PropertyWithMetadata } from "@/hooks/usePonderPropertiesWithMetadata";

interface HostAnalyticsProps {
  bookings: PonderBooking[];
  properties: PropertyWithMetadata[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roomTypesMap: Map<string, any>;
  getPropertyInfo: (booking: PonderBooking) => { name: string; imageUrl?: string };
  getRoomTypeInfo: (booking: PonderBooking) => { name: string; currency: "USD" | "EUR" };
}

type TimePeriod = "7d" | "30d" | "90d" | "all";

export function HostAnalytics({
  bookings,
  properties,
  roomTypesMap: _roomTypesMap,
  getPropertyInfo,
  getRoomTypeInfo,
}: HostAnalyticsProps) {
  const [period, setPeriod] = React.useState<TimePeriod>("30d");

  // Filter bookings by period
  const filteredBookings = React.useMemo(() => {
    if (period === "all") return bookings;

    const now = Date.now();
    const periodMs = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    }[period];

    return bookings.filter((b) => {
      const createdAt = Number(b.createdAt) * 1000;
      return now - createdAt <= periodMs;
    });
  }, [bookings, period]);

  // Calculate revenue metrics
  const revenueMetrics = React.useMemo(() => {
    const completed = filteredBookings.filter((b) => b.status === "Completed");
    const totalRevenue = completed.reduce((sum, b) => sum + Number(b.totalPrice) / 1e6, 0);
    const platformFee = totalRevenue * 0.05;
    const netEarnings = totalRevenue - platformFee;

    // Calculate average booking value
    const avgBookingValue = completed.length > 0 ? totalRevenue / completed.length : 0;

    // Calculate by currency
    const byCurrency = completed.reduce(
      (acc, b) => {
        const currency = getRoomTypeInfo(b).currency;
        const amount = Number(b.totalPrice) / 1e6;
        if (currency === "EUR") {
          acc.EUR += amount;
        } else {
          acc.USD += amount;
        }
        return acc;
      },
      { USD: 0, EUR: 0 }
    );

    return {
      totalRevenue,
      platformFee,
      netEarnings,
      avgBookingValue,
      byCurrency,
      completedCount: completed.length,
    };
  }, [filteredBookings, getRoomTypeInfo]);

  // Calculate booking metrics
  const bookingMetrics = React.useMemo(() => {
    const total = filteredBookings.length;
    const pending = filteredBookings.filter((b) => b.status === "Pending").length;
    const confirmed = filteredBookings.filter((b) => b.status === "Confirmed").length;
    const checkedIn = filteredBookings.filter((b) => b.status === "CheckedIn").length;
    const completed = filteredBookings.filter((b) => b.status === "Completed").length;
    const cancelled = filteredBookings.filter((b) => b.status === "Cancelled").length;

    const conversionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";
    const cancellationRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : "0";

    return {
      total,
      pending,
      confirmed,
      checkedIn,
      completed,
      cancelled,
      conversionRate,
      cancellationRate,
    };
  }, [filteredBookings]);

  // Calculate property performance
  const propertyPerformance = React.useMemo(() => {
    const performance = new Map<
      string,
      { name: string; bookings: number; revenue: number; image?: string }
    >();

    filteredBookings.forEach((b) => {
      const propertyId = b.propertyId;
      const { name, imageUrl } = getPropertyInfo(b);
      const revenue = b.status === "Completed" ? Number(b.totalPrice) / 1e6 : 0;

      const existing = performance.get(propertyId);
      if (existing) {
        existing.bookings += 1;
        existing.revenue += revenue;
      } else {
        performance.set(propertyId, { name, bookings: 1, revenue, image: imageUrl });
      }
    });

    return Array.from(performance.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredBookings, getPropertyInfo]);

  // Upcoming check-ins (next 7 days)
  const upcomingCheckIns = React.useMemo(() => {
    const now = Date.now();
    const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;

    return bookings
      .filter((b) => {
        const checkIn = Number(b.checkInDate) * 1000;
        return (
          checkIn >= now &&
          checkIn <= weekFromNow &&
          (b.status === "Confirmed" || b.status === "Pending")
        );
      })
      .sort((a, b) => Number(a.checkInDate) - Number(b.checkInDate))
      .slice(0, 5);
  }, [bookings]);

  // Upcoming check-outs (next 7 days)
  const upcomingCheckOuts = React.useMemo(() => {
    const now = Date.now();
    const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;

    return bookings
      .filter((b) => {
        const checkOut = Number(b.checkOutDate) * 1000;
        return checkOut >= now && checkOut <= weekFromNow && b.status === "CheckedIn";
      })
      .sort((a, b) => Number(a.checkOutDate) - Number(b.checkOutDate))
      .slice(0, 5);
  }, [bookings]);

  // Calculate occupancy by month (simplified)
  const monthlyData = React.useMemo(() => {
    const months: { month: string; bookings: number; revenue: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = date.getTime();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();

      const monthBookings = bookings.filter((b) => {
        const checkIn = Number(b.checkInDate) * 1000;
        return checkIn >= monthStart && checkIn <= monthEnd;
      });

      const revenue = monthBookings
        .filter((b) => b.status === "Completed")
        .reduce((sum, b) => sum + Number(b.totalPrice) / 1e6, 0);

      months.push({
        month: date.toLocaleString("default", { month: "short" }),
        bookings: monthBookings.length,
        revenue,
      });
    }

    return months;
  }, [bookings]);

  const formatDate = (timestamp: string) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getDaysUntil = (timestamp: string) => {
    const days = Math.ceil((Number(timestamp) * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Overview</h2>
          <p className="text-muted-foreground">Track your performance and revenue</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueMetrics.totalRevenue.toFixed(2)}</div>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <span>stables</span>
              {revenueMetrics.byCurrency.USD > 0 && (
                <Badge variant="outline" className="text-xs">
                  {revenueMetrics.byCurrency.USD.toFixed(0)} USDC
                </Badge>
              )}
              {revenueMetrics.byCurrency.EUR > 0 && (
                <Badge variant="outline" className="text-xs">
                  {revenueMetrics.byCurrency.EUR.toFixed(0)} EURC
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {revenueMetrics.netEarnings.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">
              After {revenueMetrics.platformFee.toFixed(2)} platform fee (5%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Booking Value</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueMetrics.avgBookingValue.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">
              From {revenueMetrics.completedCount} completed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingMetrics.conversionRate}%</div>
            <p className="text-muted-foreground text-xs">
              {bookingMetrics.completed} completed of {bookingMetrics.total} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Booking Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Booking Status
            </CardTitle>
            <CardDescription>Distribution of booking statuses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                label: "Pending",
                count: bookingMetrics.pending,
                color: "bg-yellow-500",
                icon: Clock,
              },
              {
                label: "Confirmed",
                count: bookingMetrics.confirmed,
                color: "bg-blue-500",
                icon: CheckCircle2,
              },
              {
                label: "Checked In",
                count: bookingMetrics.checkedIn,
                color: "bg-purple-500",
                icon: Users,
              },
              {
                label: "Completed",
                count: bookingMetrics.completed,
                color: "bg-green-500",
                icon: CheckCircle2,
              },
              {
                label: "Cancelled",
                count: bookingMetrics.cancelled,
                color: "bg-red-500",
                icon: XCircle,
              },
            ].map((item) => {
              const percentage =
                bookingMetrics.total > 0 ? (item.count / bookingMetrics.total) * 100 : 0;
              const Icon = item.icon;
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${item.color.replace("bg-", "text-")}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">{item.count}</span>
                  </div>
                  <Progress value={percentage} className={`h-2 ${item.color}`} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Overview
            </CardTitle>
            <CardDescription>Bookings and revenue by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((month, i) => {
                const maxRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1);
                const percentage = (month.revenue / maxRevenue) * 100;
                return (
                  <div key={month.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{month.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">{month.bookings} bookings</span>
                        <span className="font-semibold">{month.revenue.toFixed(0)} stables</span>
                      </div>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Performance & Upcoming */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Property Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Performance
            </CardTitle>
            <CardDescription>Revenue by property</CardDescription>
          </CardHeader>
          <CardContent>
            {propertyPerformance.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">No bookings yet</p>
            ) : (
              <div className="space-y-4">
                {propertyPerformance.slice(0, 5).map((property, i) => (
                  <div key={property.id} className="flex items-center gap-3">
                    <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg">
                      {property.image ? (
                        <img
                          src={property.image}
                          alt={property.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Home className="text-muted-foreground h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{property.name}</p>
                      <p className="text-muted-foreground text-xs">{property.bookings} bookings</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{property.revenue.toFixed(2)}</p>
                      <p className="text-muted-foreground text-xs">stables</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
            <CardDescription>Check-ins and check-outs this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingCheckIns.length === 0 && upcomingCheckOuts.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">No upcoming events</p>
            ) : (
              <>
                {upcomingCheckIns.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                      Check-ins
                    </h4>
                    <div className="space-y-2">
                      {upcomingCheckIns.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 p-2"
                        >
                          <div>
                            <p className="text-sm font-medium">{getPropertyInfo(booking).name}</p>
                            <p className="text-muted-foreground text-xs">
                              {getRoomTypeInfo(booking).name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatDate(booking.checkInDate)}</p>
                            <p className="text-xs text-green-600">
                              {getDaysUntil(booking.checkInDate)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {upcomingCheckOuts.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <ArrowDownRight className="h-4 w-4 text-blue-500" />
                      Check-outs
                    </h4>
                    <div className="space-y-2">
                      {upcomingCheckOuts.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 p-2"
                        >
                          <div>
                            <p className="text-sm font-medium">{getPropertyInfo(booking).name}</p>
                            <p className="text-muted-foreground text-xs">
                              {getRoomTypeInfo(booking).name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatDate(booking.checkOutDate)}
                            </p>
                            <p className="text-xs text-blue-600">
                              {getDaysUntil(booking.checkOutDate)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Home className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground">Properties:</span>
              <span className="font-semibold">{properties.length}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground">Total Bookings:</span>
              <span className="font-semibold">{bookings.length}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-muted-foreground">Cancellation Rate:</span>
              <span className="font-semibold">{bookingMetrics.cancellationRate}%</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-muted-foreground">Currently Hosted:</span>
              <span className="font-semibold">{bookingMetrics.checkedIn}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
