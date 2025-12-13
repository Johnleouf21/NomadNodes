import * as React from "react";
import { useRouter } from "next/navigation";
import { useReadContract } from "wagmi";
import { toast } from "sonner";
import { ESCROW_ABI, statusConfig } from "./constants";
import { formatDate, getDaysInfo } from "./utils";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { ActionAvailability, PaymentBreakdown } from "./types";

/**
 * Custom hook for host booking detail logic
 */
export function useHostBookingDetail(
  booking: PonderBooking | null,
  open: boolean,
  currency: "USD" | "EUR",
  onOpenChange: (open: boolean) => void
) {
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

  // Calculate values
  const status = booking ? statusConfig[booking.status] : null;
  const daysInfo = booking ? getDaysInfo(booking.checkInDate, booking.checkOutDate) : null;
  const totalPrice = booking ? Number(booking.totalPrice) / 1e6 : 0;

  // Payment breakdown
  const paymentBreakdown: PaymentBreakdown | null = React.useMemo(() => {
    if (!booking) return null;
    const escrowTotal = escrowAmount !== undefined ? Number(escrowAmount) / 1e6 : totalPrice;
    const fee = platformFee !== undefined ? Number(platformFee) / 1e6 : totalPrice * 0.05;
    const hostReceives = escrowTotal - fee;
    const currentRefundPercent = refundPercentage !== undefined ? Number(refundPercentage) : 0;
    return { escrowTotal, fee, hostReceives, currentRefundPercent, currencyLabel };
  }, [booking, escrowAmount, platformFee, refundPercentage, totalPrice, currencyLabel]);

  // Action availability
  const actionAvailability: ActionAvailability | null = React.useMemo(() => {
    if (!booking) return null;

    const now = new Date();
    const checkInDate = new Date(Number(booking.checkInDate) * 1000);
    const checkOutDate = new Date(Number(booking.checkOutDate) * 1000);

    // Host can only mark check-in after 23:59 UTC of check-in day
    const checkInDayEnd = new Date(checkInDate);
    checkInDayEnd.setUTCHours(23, 59, 59, 999);
    const isCheckInDayEnded = now > checkInDayEnd;

    // Complete can only happen on or after the checkout date
    const isCheckOutDateReached = now >= checkOutDate;

    const canConfirm = booking.status === "Pending";
    const canCheckIn = booking.status === "Confirmed" && isCheckInDayEnded;
    const canComplete = booking.status === "CheckedIn" && isCheckOutDateReached;
    const canCancel = booking.status === "Pending" || booking.status === "Confirmed";

    const checkInDisabledReason =
      booking.status === "Confirmed" && !isCheckInDayEnded
        ? `Check-in available after 23:59 UTC on ${formatDate(booking.checkInDate)}`
        : null;
    const completeDisabledReason =
      booking.status === "CheckedIn" && !isCheckOutDateReached
        ? `Complete available after checkout on ${formatDate(booking.checkOutDate)}`
        : null;

    return {
      canConfirm,
      canCheckIn,
      canComplete,
      canCancel,
      checkInDisabledReason,
      completeDisabledReason,
    };
  }, [booking]);

  // Handlers
  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleViewProperty = () => {
    if (booking) {
      router.push(`/property/${booking.propertyId}`);
      onOpenChange(false);
    }
  };

  const handleViewEscrow = () => {
    if (booking?.escrowAddress) {
      window.open(`https://sepolia.etherscan.io/address/${booking.escrowAddress}`, "_blank");
    }
  };

  const handleViewGuest = () => {
    if (booking) {
      window.open(`https://sepolia.etherscan.io/address/${booking.traveler}`, "_blank");
    }
  };

  const handleMessage = (onMessage?: () => void) => {
    if (onMessage) {
      onMessage();
    } else {
      toast.info("Messaging feature coming soon!", {
        description: "You will be able to message guests directly.",
      });
    }
  };

  return {
    // State
    copiedField,
    status,
    daysInfo,
    paymentBreakdown,
    actionAvailability,

    // Actions
    copyToClipboard,
    handleViewProperty,
    handleViewEscrow,
    handleViewGuest,
    handleMessage,
  };
}
