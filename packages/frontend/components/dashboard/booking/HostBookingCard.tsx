"use client";

import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  LogIn,
  Loader2,
  MoreHorizontal,
  Eye,
  Calendar,
  User,
  DollarSign,
  ArrowRight,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { PonderBooking } from "@/hooks/usePonderBookings";

export interface HostBookingCardProps {
  booking: PonderBooking;
  propertyName: string;
  propertyImage?: string;
  roomTypeName?: string;
  currency?: "USD" | "EUR";
  onViewDetails: () => void;
  onConfirm?: () => void;
  onCheckIn?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  isActionPending?: boolean;
}

const statusConfig: Record<
  PonderBooking["status"],
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ElementType;
  }
> = {
  Pending: {
    label: "Pending",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10",
    icon: Clock,
  },
  Confirmed: {
    label: "Confirmed",
    color: "text-[#0F4C5C] dark:text-[#1A7A8A]",
    bgColor: "bg-[#0F4C5C]/10",
    icon: CheckCircle2,
  },
  CheckedIn: {
    label: "Checked In",
    color: "text-[#E36414] dark:text-[#E36414]",
    bgColor: "bg-[#E36414]/10",
    icon: LogIn,
  },
  Completed: {
    label: "Completed",
    color: "text-[#81B29A] dark:text-[#81B29A]",
    bgColor: "bg-[#81B29A]/10",
    icon: CheckCircle2,
  },
  Cancelled: {
    label: "Cancelled",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-500/10",
    icon: XCircle,
  },
};

function formatDate(timestamp: string): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysUntil(timestamp: string): { days: number; label: string; urgent: boolean } {
  const date = new Date(Number(timestamp) * 1000);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), label: `${Math.abs(diffDays)}d ago`, urgent: true };
  } else if (diffDays === 0) {
    return { days: 0, label: "Today", urgent: true };
  } else if (diffDays === 1) {
    return { days: 1, label: "Tomorrow", urgent: true };
  } else if (diffDays <= 3) {
    return { days: diffDays, label: `In ${diffDays} days`, urgent: true };
  } else {
    return { days: diffDays, label: `In ${diffDays} days`, urgent: false };
  }
}

function getNightsCount(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(Number(checkIn) * 1000);
  const checkOutDate = new Date(Number(checkOut) * 1000);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function HostBookingCard({
  booking,
  propertyName,
  propertyImage,
  roomTypeName,
  currency = "USD",
  onViewDetails,
  onConfirm,
  onCheckIn,
  onComplete,
  onCancel,
  isActionPending = false,
}: HostBookingCardProps) {
  const status = statusConfig[booking.status];
  const StatusIcon = status.icon;
  const checkInInfo = getDaysUntil(booking.checkInDate);
  const nights = getNightsCount(booking.checkInDate, booking.checkOutDate);
  const totalPrice = Number(booking.totalPrice) / 1e6; // Stablecoin has 6 decimals
  const currencyLabel = currency === "EUR" ? "EURC" : "USDC";

  // Date validation for actions
  const now = new Date();
  const checkInDate = new Date(Number(booking.checkInDate) * 1000);
  const checkOutDate = new Date(Number(booking.checkOutDate) * 1000);

  // Host can only mark check-in after 23:59 UTC of check-in day
  // (gives traveler the full day to check in themselves)
  const checkInDayEnd = new Date(checkInDate);
  checkInDayEnd.setUTCHours(23, 59, 59, 999);
  const isCheckInDayEnded = now > checkInDayEnd;

  const isCheckOutDateReached = now >= checkOutDate;

  const canConfirm = booking.status === "Pending";
  const canCheckIn = booking.status === "Confirmed" && isCheckInDayEnded;
  const canComplete = booking.status === "CheckedIn" && isCheckOutDateReached;
  const canCancel = booking.status === "Pending" || booking.status === "Confirmed";

  // Check if action should show disabled state (status matches but date not reached)
  const showCheckInDisabled = booking.status === "Confirmed" && !isCheckInDayEnded;
  const showCompleteDisabled = booking.status === "CheckedIn" && !isCheckOutDateReached;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex">
          {/* Property Image */}
          {propertyImage && (
            <div className="relative h-32 w-32 flex-shrink-0 sm:h-36 sm:w-36">
              <img src={propertyImage} alt={propertyName} className="h-full w-full object-cover" />
              {/* Urgency indicator */}
              {checkInInfo.urgent &&
                booking.status !== "Completed" &&
                booking.status !== "Cancelled" && (
                  <div className="absolute bottom-2 left-2">
                    <Badge
                      variant="secondary"
                      className={`${
                        checkInInfo.days <= 1 ? "bg-red-500 text-white" : "bg-yellow-500 text-white"
                      } text-xs`}
                    >
                      {checkInInfo.label}
                    </Badge>
                  </div>
                )}
            </div>
          )}

          {/* Content */}
          <div className="flex flex-1 flex-col p-4">
            {/* Header Row */}
            <div className="mb-2 flex items-start justify-between">
              <div className="flex-1">
                <h3 className="leading-tight font-semibold">{propertyName}</h3>
                {roomTypeName && (
                  <p className="text-primary mt-0.5 text-sm font-medium">{roomTypeName}</p>
                )}
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Booking #{booking.bookingIndex}
                </p>
              </div>
              <Badge className={`${status.bgColor} ${status.color} flex items-center gap-1`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>

            {/* Details Grid */}
            <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-muted-foreground">Check-in:</span>
                <span className="font-medium">{formatDate(booking.checkInDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowRight className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-muted-foreground">Check-out:</span>
                <span className="font-medium">{formatDate(booking.checkOutDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-muted-foreground">Guest:</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="font-mono text-xs hover:underline"
                        onClick={() => copyToClipboard(booking.traveler, "Guest address")}
                      >
                        {shortenAddress(booking.traveler)}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-mono text-xs">{booking.traveler}</p>
                      <p className="text-muted-foreground">Click to copy</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold">
                  {totalPrice.toFixed(2)} {currencyLabel}
                </span>
                <span className="text-muted-foreground text-xs">({nights} nights)</span>
              </div>
            </div>

            {/* Actions Row */}
            <div className="mt-auto flex items-center justify-between border-t pt-3">
              {/* Primary Action */}
              <div className="flex items-center gap-2">
                {canConfirm && onConfirm && (
                  <Button
                    size="sm"
                    onClick={onConfirm}
                    disabled={isActionPending}
                    className="gap-1.5 bg-[#0F4C5C] hover:bg-[#0F4C5C]/90"
                  >
                    {isActionPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Confirm
                  </Button>
                )}
                {canCheckIn && onCheckIn && (
                  <Button
                    size="sm"
                    onClick={onCheckIn}
                    disabled={isActionPending}
                    className="gap-1.5 bg-[#E36414] hover:bg-[#E36414]/90"
                  >
                    {isActionPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="h-4 w-4" />
                    )}
                    Check-in
                  </Button>
                )}
                {showCheckInDisabled && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" disabled className="gap-1.5">
                          <Clock className="h-4 w-4" />
                          Check-in
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Available after 23:59 UTC on {formatDate(booking.checkInDate)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {canComplete && onComplete && (
                  <Button
                    size="sm"
                    onClick={onComplete}
                    disabled={isActionPending}
                    className="gap-1.5 bg-[#81B29A] hover:bg-[#81B29A]/90"
                  >
                    {isActionPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Complete
                  </Button>
                )}
                {showCompleteDisabled && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" disabled className="gap-1.5">
                          <Clock className="h-4 w-4" />
                          Complete
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Available after {formatDate(booking.checkOutDate)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {booking.status === "Completed" && (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                )}
                {booking.status === "Cancelled" && (
                  <Badge variant="outline" className="text-red-600">
                    <XCircle className="mr-1 h-3 w-3" />
                    Cancelled
                  </Badge>
                )}
              </div>

              {/* Secondary Actions */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={onViewDetails} className="gap-1.5">
                  <Eye className="h-4 w-4" />
                  Details
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onViewDetails}>
                      <Eye className="mr-2 h-4 w-4" />
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyToClipboard(booking.id, "Booking ID")}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy booking ID
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => copyToClipboard(booking.traveler, "Guest address")}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy guest address
                    </DropdownMenuItem>
                    {booking.escrowAddress && (
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `https://sepolia.etherscan.io/address/${booking.escrowAddress}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View escrow on BaseScan
                      </DropdownMenuItem>
                    )}
                    {canCancel && onCancel && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={onCancel}
                          className="text-red-600 focus:bg-red-50 focus:text-red-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel booking
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
