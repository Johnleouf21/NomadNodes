"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useReadContract } from "wagmi";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  User,
  Wallet,
  ExternalLink,
  MessageSquare,
  XCircle,
  Clock,
  DollarSign,
  Home,
  Copy,
  Check,
  Shield,
  CheckCircle2,
  LogIn,
  ArrowRight,
  Hash,
  FileText,
  AlertTriangle,
  BedDouble,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import { CheckInActions } from "./CheckInActions";

// Escrow ABI for reading data
const ESCROW_ABI = [
  {
    inputs: [],
    name: "amount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFee",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRefundPercentage",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface HostBookingDetailSheetProps {
  booking: PonderBooking | null;
  propertyName: string;
  propertyImage?: string;
  roomTypeName?: string;
  currency?: "USD" | "EUR";
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    description: string;
    step: number;
  }
> = {
  Pending: {
    label: "Pending Confirmation",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10 border-yellow-500/30",
    icon: Clock,
    description: "Awaiting your confirmation. Please review and confirm this booking.",
    step: 1,
  },
  Confirmed: {
    label: "Confirmed",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/30",
    icon: CheckCircle2,
    description: "Booking confirmed. Guest will check in on the scheduled date.",
    step: 2,
  },
  CheckedIn: {
    label: "Guest Checked In",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/30",
    icon: LogIn,
    description: "Guest has arrived and checked in. Complete after their stay.",
    step: 3,
  },
  Completed: {
    label: "Completed",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-500/10 border-green-500/30",
    icon: CheckCircle2,
    description: "Stay completed. Payment has been released to you.",
    step: 4,
  },
  Cancelled: {
    label: "Cancelled",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-500/10 border-red-500/30",
    icon: XCircle,
    description: "This booking has been cancelled.",
    step: 0,
  },
};

function formatDate(timestamp: string): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(timestamp: string): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDaysInfo(
  checkInTimestamp: string,
  checkOutTimestamp: string
): {
  nights: number;
  daysUntilCheckIn: number;
  checkInLabel: string;
  isUrgent: boolean;
} {
  const checkIn = new Date(Number(checkInTimestamp) * 1000);
  const checkOut = new Date(Number(checkOutTimestamp) * 1000);
  const now = new Date();

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilCheckIn = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let checkInLabel = "";
  let isUrgent = false;

  if (daysUntilCheckIn < 0) {
    checkInLabel = `${Math.abs(daysUntilCheckIn)} days ago`;
  } else if (daysUntilCheckIn === 0) {
    checkInLabel = "Today";
    isUrgent = true;
  } else if (daysUntilCheckIn === 1) {
    checkInLabel = "Tomorrow";
    isUrgent = true;
  } else if (daysUntilCheckIn <= 3) {
    checkInLabel = `In ${daysUntilCheckIn} days`;
    isUrgent = true;
  } else {
    checkInLabel = `In ${daysUntilCheckIn} days`;
  }

  return { nights, daysUntilCheckIn, checkInLabel, isUrgent };
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function HostBookingDetailSheet({
  booking,
  propertyName,
  propertyImage,
  roomTypeName,
  currency = "USD",
  open,
  onOpenChange,
  onConfirm,
  onCheckIn,
  onComplete,
  onCancel,
  isActionPending = false,
}: HostBookingDetailSheetProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const currencyLabel = currency === "EUR" ? "EURC" : "USDC";

  // Read escrow data
  const { data: escrowAmount } = useReadContract({
    address: booking?.escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "amount",
    query: {
      enabled: !!booking?.escrowAddress && open,
    },
  });

  const { data: platformFee } = useReadContract({
    address: booking?.escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "platformFee",
    query: {
      enabled: !!booking?.escrowAddress && open,
    },
  });

  const { data: refundPercentage } = useReadContract({
    address: booking?.escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "getRefundPercentage",
    query: {
      enabled: !!booking?.escrowAddress && open,
    },
  });

  if (!booking) return null;

  const status = statusConfig[booking.status];
  const StatusIcon = status.icon;
  const daysInfo = getDaysInfo(booking.checkInDate, booking.checkOutDate);
  const totalPrice = Number(booking.totalPrice) / 1e6;

  // Calculate payment breakdown
  const escrowTotal = escrowAmount !== undefined ? Number(escrowAmount) / 1e6 : totalPrice;
  const fee = platformFee !== undefined ? Number(platformFee) / 1e6 : totalPrice * 0.05;
  const hostReceives = escrowTotal - fee;
  const currentRefundPercent = refundPercentage !== undefined ? Number(refundPercentage) : 0;

  // Actions availability
  const canConfirm = booking.status === "Pending";
  const canCheckIn = booking.status === "Confirmed";
  const canComplete = booking.status === "CheckedIn";
  const canCancel = booking.status === "Pending" || booking.status === "Confirmed";

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleViewProperty = () => {
    router.push(`/property/${booking.propertyId}`);
    onOpenChange(false);
  };

  const handleViewEscrow = () => {
    if (booking.escrowAddress) {
      window.open(`https://sepolia.etherscan.io/address/${booking.escrowAddress}`, "_blank");
    }
  };

  const handleViewGuest = () => {
    window.open(`https://sepolia.etherscan.io/address/${booking.traveler}`, "_blank");
  };

  const handleMessage = () => {
    toast.info("Messaging feature coming soon!", {
      description: "You will be able to message guests directly.",
    });
  };

  // Progress calculation
  const progressSteps = ["Pending", "Confirmed", "Checked In", "Completed"];
  const currentStep = booking.status === "Cancelled" ? 0 : status.step;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-left">Booking Details</SheetTitle>
          <SheetDescription className="text-left">
            Reservation #{booking.bookingIndex} for {propertyName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-1 pb-6">
          {/* Property Image & Status */}
          <div className="relative overflow-hidden rounded-lg">
            {propertyImage ? (
              <img src={propertyImage} alt={propertyName} className="h-40 w-full object-cover" />
            ) : (
              <div className="bg-muted flex h-40 w-full items-center justify-center">
                <Home className="text-muted-foreground/30 h-16 w-16" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <Badge className={`${status.bgColor} ${status.color} flex items-center gap-1 border`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            {daysInfo.isUrgent &&
              booking.status !== "Completed" &&
              booking.status !== "Cancelled" && (
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-red-500 text-white">{daysInfo.checkInLabel}</Badge>
                </div>
              )}
          </div>

          {/* Property Info */}
          <div>
            <h3 className="text-xl font-bold">{propertyName}</h3>
            {roomTypeName && (
              <div className="text-primary mt-1 flex items-center gap-2">
                <BedDouble className="h-4 w-4" />
                <span className="font-medium">{roomTypeName}</span>
              </div>
            )}
          </div>

          {/* Status Card with Action Required */}
          <div className={`rounded-lg border p-4 ${status.bgColor}`}>
            <div className="flex items-start gap-3">
              <StatusIcon className={`mt-0.5 h-5 w-5 ${status.color}`} />
              <div className="flex-1">
                <p className={`font-medium ${status.color}`}>{status.label}</p>
                <p className="text-muted-foreground mt-1 text-sm">{status.description}</p>
              </div>
            </div>

            {/* Progress Timeline */}
            {booking.status !== "Cancelled" && (
              <div className="mt-4">
                <div className="text-muted-foreground mb-2 flex justify-between text-xs">
                  {progressSteps.map((step, i) => (
                    <span
                      key={step}
                      className={i + 1 <= currentStep ? "text-primary font-medium" : ""}
                    >
                      {step}
                    </span>
                  ))}
                </div>
                <Progress value={(currentStep / 4) * 100} className="h-2" />
              </div>
            )}
          </div>

          <Separator />

          {/* Guest Information */}
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <User className="h-4 w-4" />
              Guest Information
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Wallet Address</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted rounded px-2 py-1 font-mono text-xs">
                    {shortenAddress(booking.traveler)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(booking.traveler, "guest")}
                  >
                    {copiedField === "guest" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <Button variant="link" size="sm" className="h-auto px-0" onClick={handleViewGuest}>
                <ExternalLink className="mr-1 h-3 w-3" />
                View on BaseScan
              </Button>
            </div>
          </div>

          {/* Dates & Duration */}
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <Calendar className="h-4 w-4" />
              Stay Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
                  Check-in
                </p>
                <p className="font-semibold">{formatDate(booking.checkInDate)}</p>
                <p className="text-muted-foreground text-xs">After 3:00 PM</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
                  Check-out
                </p>
                <p className="font-semibold">{formatDate(booking.checkOutDate)}</p>
                <p className="text-muted-foreground text-xs">Before 11:00 AM</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span>
                {daysInfo.nights} night{daysInfo.nights !== 1 ? "s" : ""}
              </span>
              {booking.status !== "Completed" && booking.status !== "Cancelled" && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className={daysInfo.isUrgent ? "font-medium text-red-500" : ""}>
                    {daysInfo.checkInLabel}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <DollarSign className="h-4 w-4" />
              Payment Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking total</span>
                <span>
                  {escrowTotal.toFixed(2)} {currencyLabel}
                </span>
              </div>
              <div className="text-muted-foreground flex justify-between">
                <span>Platform fee (5%)</span>
                <span>
                  -{fee.toFixed(2)} {currencyLabel}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-semibold">
                <span>Your earnings</span>
                <span className="text-green-600">
                  {hostReceives.toFixed(2)} {currencyLabel}
                </span>
              </div>
            </div>
            {booking.status === "Completed" && (
              <div className="mt-3 flex items-center gap-2 rounded bg-green-500/10 p-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Payment released to your wallet
              </div>
            )}
          </div>

          {/* Check-in Actions */}
          {booking.escrowAddress && booking.status === "Confirmed" && (
            <CheckInActions
              escrowAddress={booking.escrowAddress}
              checkInDate={new Date(Number(booking.checkInDate) * 1000)}
              isTraveler={false}
              onSuccess={() => {
                toast.success("Payment released!");
              }}
            />
          )}

          {/* Escrow Contract */}
          {booking.escrowAddress && (
            <div className="rounded-lg border p-4">
              <h4 className="mb-3 flex items-center gap-2 font-semibold">
                <Shield className="h-4 w-4" />
                Escrow Contract
              </h4>
              <p className="text-muted-foreground mb-3 text-xs">
                Funds are securely held in this smart contract until the stay is completed.
              </p>
              <div className="flex items-center gap-2">
                <code className="bg-muted flex-1 truncate rounded px-2 py-1.5 font-mono text-xs">
                  {booking.escrowAddress}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => copyToClipboard(booking.escrowAddress!, "escrow")}
                >
                  {copiedField === "escrow" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button variant="link" size="sm" className="mt-2 px-0" onClick={handleViewEscrow}>
                <ExternalLink className="mr-1 h-3 w-3" />
                View on BaseScan
              </Button>
            </div>
          )}

          {/* Cancellation Policy (only for cancelable bookings) */}
          {canCancel && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">
                    Cancellation Policy
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Current refund rate: <strong>{currentRefundPercent}%</strong>
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    If cancelled, guest receives{" "}
                    {(((escrowTotal - fee) * currentRefundPercent) / 100).toFixed(2)}{" "}
                    {currencyLabel}, you receive{" "}
                    {(((escrowTotal - fee) * (100 - currentRefundPercent)) / 100).toFixed(2)}{" "}
                    {currencyLabel}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Booking IDs */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Hash className="h-4 w-4" />
              Booking Reference
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Booking ID</span>
                <div className="flex items-center gap-1">
                  <code className="bg-muted rounded px-1.5 py-0.5 font-mono">
                    {booking.id.slice(0, 16)}...
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(booking.id, "bookingId")}
                  >
                    {copiedField === "bookingId" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token ID</span>
                <span className="font-mono">{booking.tokenId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Index</span>
                <span className="font-mono">{booking.bookingIndex}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDateTime(booking.createdAt)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Action based on status */}
            {canConfirm && onConfirm && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
                disabled={isActionPending}
              >
                {isActionPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Confirm Booking
              </Button>
            )}

            {canCheckIn && onCheckIn && (
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  onCheckIn();
                  onOpenChange(false);
                }}
                disabled={isActionPending}
              >
                {isActionPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Mark as Checked In
              </Button>
            )}

            {canComplete && onComplete && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => {
                  onComplete();
                  onOpenChange(false);
                }}
                disabled={isActionPending}
              >
                {isActionPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Complete & Release Payment
              </Button>
            )}

            {/* Secondary Actions */}
            <Button className="w-full" variant="outline" onClick={handleViewProperty}>
              <Home className="mr-2 h-4 w-4" />
              View Property
            </Button>

            <Button className="w-full" variant="outline" onClick={handleMessage}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Guest
            </Button>

            {/* Cancel Button */}
            {canCancel && onCancel && (
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => {
                  onCancel();
                  onOpenChange(false);
                }}
                disabled={isActionPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Booking
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
