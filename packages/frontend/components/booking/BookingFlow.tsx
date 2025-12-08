"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAccount } from "wagmi";

// Steps
import { DateSelectionStep } from "./DateSelectionStep";
import { GuestsStep } from "./GuestsStep";
import { PaymentStep } from "./PaymentStep";
import { ReviewStep } from "./ReviewStep";

// Store
import { useBookingStore, BookingStep } from "@/lib/store/useBookingStore";

// Hooks
import { useBookingConfirmation } from "@/lib/hooks/useBookingConfirmation";
import { useInvalidateQueries } from "@/hooks/useInvalidateQueries";

interface BookingFlowProps {
  tokenId: bigint;
  propertyId: bigint;
  propertyName: string;
  roomName: string;
  location: string;
  maxSupply: number;
  pricePerNight: number;
  hostAddress: string;
  maxGuests?: number;
  minStayNights?: number;
  maxStayNights?: number;
  currency?: "USD" | "EUR";
  initialCheckIn?: Date | null;
  initialCheckOut?: Date | null;
  initialGuests?: number;
}

export function BookingFlow({
  tokenId,
  propertyId,
  propertyName,
  roomName,
  location,
  maxSupply,
  pricePerNight,
  hostAddress,
  maxGuests = 10,
  minStayNights = 1,
  maxStayNights = 30,
  currency = "USD",
  initialCheckIn,
  initialCheckOut,
  initialGuests = 1,
}: BookingFlowProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const {
    currentStep,
    setCurrentStep,
    bookingData,
    setBookingData,
    resetBooking,
    isProcessing,
    setIsProcessing,
  } = useBookingStore();
  const { invalidateAfterBooking } = useInvalidateQueries();

  // Booking confirmation hook
  const {
    status: bookingStatus,
    error: bookingError,
    escrowAddresses,
    confirmBooking,
    reset: resetBookingConfirmation,
  } = useBookingConfirmation();

  // Get primary escrow address (first one for single bookings)
  const escrowAddress = escrowAddresses?.[0];

  // Initialize booking data
  React.useEffect(() => {
    setBookingData({
      propertyId,
      propertyName,
      hostAddress: hostAddress as `0x${string}`,
      pricePerNight,
    });
  }, [propertyId, propertyName, hostAddress, pricePerNight, setBookingData]);

  // Check wallet connection
  React.useEffect(() => {
    if (!isConnected) {
      toast.error("Please connect your wallet to book", {
        action: {
          label: "Connect",
          onClick: () => {
            // Trigger wallet connection
            document.dispatchEvent(new CustomEvent("openConnectModal"));
          },
        },
      });
    }
  }, [isConnected]);

  // Show status updates as toasts
  React.useEffect(() => {
    if (bookingStatus === "fetching-quote") {
      toast.loading("Getting price quote...", { id: "booking-status" });
    } else if (bookingStatus === "approving") {
      toast.loading("Please approve the token spend in your wallet...", { id: "booking-status" });
    } else if (bookingStatus === "waiting-approval") {
      toast.loading("Waiting for approval confirmation...", { id: "booking-status" });
    } else if (bookingStatus === "creating-escrow") {
      toast.loading("Creating booking - please confirm in your wallet...", {
        id: "booking-status",
      });
    } else if (bookingStatus === "waiting-escrow") {
      toast.loading("Waiting for transaction confirmation...", { id: "booking-status" });
    } else if (bookingStatus === "success") {
      toast.success("Booking confirmed successfully!", {
        id: "booking-status",
        description: escrowAddress
          ? `Escrow: ${escrowAddress.slice(0, 8)}...${escrowAddress.slice(-6)}`
          : undefined,
      });
    } else if (bookingStatus === "dev-mode-success") {
      toast.success("Booking simulated (Dev Mode)", {
        id: "booking-status",
        description: "This is a test booking. No real transaction was made.",
      });
    } else if (bookingStatus === "error") {
      toast.error("Booking failed", {
        id: "booking-status",
        description: bookingError || "An unexpected error occurred",
      });
    }
  }, [bookingStatus, bookingError, escrowAddress]);

  // Handle booking success with cache invalidation
  React.useEffect(() => {
    if (bookingStatus === "success" || bookingStatus === "dev-mode-success") {
      // Invalidate cache to refresh UI across the app
      invalidateAfterBooking(3000);

      // Wait a bit then redirect
      const timer = setTimeout(() => {
        resetBooking();
        resetBookingConfirmation();
        router.push("/dashboard/traveler");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [bookingStatus, resetBooking, resetBookingConfirmation, router, invalidateAfterBooking]);

  // Calculate progress
  const progress = React.useMemo(() => {
    switch (currentStep) {
      case BookingStep.DATES:
        return 25;
      case BookingStep.GUESTS:
        return 50;
      case BookingStep.PAYMENT:
        return 75;
      case BookingStep.REVIEW:
        return 90;
      case BookingStep.CONFIRM:
        return 100;
      default:
        return 0;
    }
  }, [currentStep]);

  // Handle date selection
  const handleDateSelection = (checkIn: Date, checkOut: Date, totalNights: number) => {
    setBookingData({
      checkIn,
      checkOut,
      totalNights,
    });
    setCurrentStep(BookingStep.GUESTS);
  };

  // Handle guests selection
  const handleGuestsSelection = (guests: number, specialRequests: string) => {
    setBookingData({
      guests,
      specialRequests,
    });
    setCurrentStep(BookingStep.PAYMENT);
  };

  // Handle payment selection
  const handlePaymentSelection = (
    paymentToken: "USDC" | "EURC",
    totalAmount: number,
    platformFee: number
  ) => {
    setBookingData({
      paymentToken,
      totalAmount,
      platformFee,
    });
    setCurrentStep(BookingStep.REVIEW);
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!bookingData.checkIn || !bookingData.checkOut) {
      toast.error("Please select dates");
      return;
    }

    if (bookingData.rooms.length === 0) {
      toast.error("Please select at least one room");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await confirmBooking({
        rooms: bookingData.rooms,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        totalAmount: bookingData.totalAmount,
        paymentToken: bookingData.paymentToken,
        userAddress: address,
      });

      if (!result) {
        // Error is handled by the hook and shown via toast
        setIsProcessing(false);
      }
      // Success case is handled by useEffect watching bookingStatus
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to create booking", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setIsProcessing(false);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case BookingStep.DATES:
        return (
          <DateSelectionStep
            tokenId={tokenId}
            maxSupply={maxSupply}
            minStayNights={minStayNights}
            maxStayNights={maxStayNights}
            initialCheckIn={initialCheckIn}
            initialCheckOut={initialCheckOut}
            onNext={handleDateSelection}
          />
        );

      case BookingStep.GUESTS:
        return (
          <GuestsStep
            maxGuests={maxGuests}
            initialGuests={initialGuests}
            propertyId={propertyId}
            currentRoomTokenId={tokenId}
            currentRoomName={roomName}
            currentRoomPrice={pricePerNight}
            currentRoomCurrency={currency}
            checkIn={bookingData.checkIn}
            checkOut={bookingData.checkOut}
            totalNights={bookingData.totalNights}
            onNext={handleGuestsSelection}
            onBack={() => setCurrentStep(BookingStep.DATES)}
          />
        );

      case BookingStep.PAYMENT:
        return (
          <PaymentStep
            pricePerNight={pricePerNight}
            totalNights={bookingData.totalNights}
            onNext={handlePaymentSelection}
            onBack={() => setCurrentStep(BookingStep.GUESTS)}
          />
        );

      case BookingStep.REVIEW:
        return (
          <ReviewStep
            propertyName={propertyName}
            roomName={roomName}
            location={location}
            checkIn={bookingData.checkIn!}
            checkOut={bookingData.checkOut!}
            totalNights={bookingData.totalNights}
            guests={bookingData.guests}
            pricePerNight={pricePerNight}
            platformFee={bookingData.platformFee}
            totalAmount={bookingData.totalAmount}
            paymentToken={bookingData.paymentToken}
            specialRequests={bookingData.specialRequests}
            isProcessing={
              isProcessing ||
              (bookingStatus !== "idle" &&
                bookingStatus !== "error" &&
                bookingStatus !== "success" &&
                bookingStatus !== "dev-mode-success")
            }
            onConfirm={handleConfirmBooking}
            onBack={() => setCurrentStep(BookingStep.PAYMENT)}
          />
        );

      default:
        return null;
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Please connect your wallet to start booking
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Booking Progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span
                className={currentStep === BookingStep.DATES ? "text-primary font-semibold" : ""}
              >
                Dates
              </span>
              <span
                className={currentStep === BookingStep.GUESTS ? "text-primary font-semibold" : ""}
              >
                Guests
              </span>
              <span
                className={currentStep === BookingStep.PAYMENT ? "text-primary font-semibold" : ""}
              >
                Payment
              </span>
              <span
                className={currentStep === BookingStep.REVIEW ? "text-primary font-semibold" : ""}
              >
                Review
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      {renderStep()}
    </div>
  );
}
