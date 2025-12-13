/**
 * Hook for booking detail actions and state
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { BookingDetailData } from "../types";
import { ETHERSCAN_BASE_URL } from "../constants";

interface UseBookingActionsParams {
  booking: BookingDetailData | null;
  onOpenChange: (open: boolean) => void;
  onMessage?: () => void;
}

interface UseBookingActionsResult {
  copied: boolean;
  copyAddress: (address: string) => Promise<void>;
  handleViewProperty: () => void;
  handleViewEscrow: () => void;
  handleMessage: () => void;
  daysUntilCheckIn: number;
  currencyLabel: string;
}

export function useBookingActions({
  booking,
  onOpenChange,
  onMessage,
}: UseBookingActionsParams): UseBookingActionsResult {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);

  // Calculate days until check-in
  const daysUntilCheckIn = React.useMemo(() => {
    if (!booking) return 0;
    return Math.ceil((booking.checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }, [booking]);

  // Currency label
  const currencyLabel = booking?.currency === "EUR" ? "EURC" : "USDC";

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewProperty = () => {
    if (booking) {
      router.push(`/property/${booking.propertyId}`);
      onOpenChange(false);
    }
  };

  const handleViewEscrow = () => {
    if (booking?.escrowAddress) {
      window.open(`${ETHERSCAN_BASE_URL}/${booking.escrowAddress}`, "_blank");
    }
  };

  const handleMessage = () => {
    if (onMessage) {
      onMessage();
    } else {
      toast.info("Messaging feature coming soon!", {
        description: "You will be able to message the host directly.",
      });
    }
  };

  return {
    copied,
    copyAddress,
    handleViewProperty,
    handleViewEscrow,
    handleMessage,
    daysUntilCheckIn,
    currencyLabel,
  };
}
