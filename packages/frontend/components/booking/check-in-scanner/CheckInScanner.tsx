"use client";

/**
 * CheckInScanner - Main component for traveler check-in
 *
 * Refactored from a 472-line file into modular components and hooks.
 */

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePonderBookings } from "@/hooks/usePonderBookings";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCheckInState, useCheckInTransactions } from "./hooks";
import { ManualCheckInTab, QRCheckInTab } from "./components";
import { getEligibleBookings, findMatchingBookings } from "./utils";
import type { ScannedData } from "./types";

/**
 * Scanner component for traveler check-in via manual selection or QR code
 */
export function CheckInScanner() {
  const { address } = useAuth();

  // Fetch traveler's bookings
  const { bookings, refetch } = usePonderBookings({
    travelerAddress: address?.toLowerCase(),
  });

  // State management
  const {
    activeTab,
    setActiveTab,
    scannedData,
    setScannedData,
    matchedBooking,
    setMatchedBooking,
    selectedBookingId,
    setSelectedBookingId,
    error,
    setError,
    pendingBookingForCheckIn,
    setPendingBookingForCheckIn,
    handleReset,
    handleOpenScanner,
  } = useCheckInState();

  // Contract transactions
  const { handleConfirmCheckIn, isPending, isTxLoading, isCheckInPending, isCheckInLoading } =
    useCheckInTransactions({
      pendingBookingForCheckIn,
      setPendingBookingForCheckIn,
      setSelectedBookingId,
      onReset: handleReset,
      onRefetch: refetch,
    });

  // Get eligible bookings for check-in
  const eligibleBookings = React.useMemo(() => getEligibleBookings(bookings), [bookings]);

  // Handle QR scan
  const handleQRScan = React.useCallback(
    (data: ScannedData) => {
      setError(null);
      setScannedData(data);

      // Validate QR code type
      if (data.type !== "nomadnodes-checkin") {
        setError("Invalid QR code. Please scan a NomadNodes check-in QR code.");
        return;
      }

      // Find matching booking
      const matches = findMatchingBookings(bookings, data.propertyId);

      if (matches.length === 0) {
        setError(
          "No active booking found for this property. Make sure your check-in date is today."
        );
        return;
      }

      // Take the first match
      const booking = matches[0];

      if (!booking.escrowAddress) {
        setError("Booking found but escrow not initialized. Please contact support.");
        return;
      }

      setMatchedBooking({
        id: booking.id,
        propertyId: booking.propertyId,
        checkInDate: booking.checkInDate.toString(),
        checkOutDate: booking.checkOutDate.toString(),
        escrowAddress: booking.escrowAddress || undefined,
        tokenId: booking.tokenId,
        bookingIndex: booking.bookingIndex,
      });
    },
    [bookings, setError, setScannedData, setMatchedBooking]
  );

  // Handle QR scan from URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrData = params.get("data");

    if (qrData) {
      try {
        const parsed = JSON.parse(qrData) as ScannedData;
        handleQRScan(parsed);
        setActiveTab("qr");
      } catch {
        setError("Invalid QR code data");
      }
    }
  }, [handleQRScan, setActiveTab, setError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Confirm Check-In
        </CardTitle>
        <CardDescription>Confirm your arrival to release payment to the host</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="manual">My Bookings</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>

          <ManualCheckInTab
            eligibleBookings={eligibleBookings}
            selectedBookingId={selectedBookingId}
            isPending={isPending}
            isTxLoading={isTxLoading}
            isCheckInPending={isCheckInPending}
            isCheckInLoading={isCheckInLoading}
            onConfirmCheckIn={handleConfirmCheckIn}
          />

          <QRCheckInTab
            scannedData={scannedData}
            matchedBooking={matchedBooking}
            error={error}
            isPending={isPending}
            isTxLoading={isTxLoading}
            isCheckInPending={isCheckInPending}
            isCheckInLoading={isCheckInLoading}
            onOpenScanner={handleOpenScanner}
            onConfirmCheckIn={handleConfirmCheckIn}
            onReset={handleReset}
          />
        </Tabs>
      </CardContent>
    </Card>
  );
}
