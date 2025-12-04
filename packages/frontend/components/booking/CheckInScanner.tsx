"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import { QrCode, Camera, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { usePonderBookings } from "@/hooks/usePonderBookings";
import { useAuth } from "@/lib/hooks/useAuth";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";

const ESCROW_ABI = [
  {
    inputs: [],
    name: "confirmStay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

interface ScannedData {
  type: string;
  propertyId: string;
  hostAddress: string;
  version: string;
}

interface MatchedBooking {
  id: string;
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
  escrowAddress?: string;
  roomName?: string;
}

export function CheckInScanner() {
  const { address } = useAuth();
  const [isScanning, setIsScanning] = React.useState(false);
  const [scannedData, setScannedData] = React.useState<ScannedData | null>(null);
  const [matchedBooking, setMatchedBooking] = React.useState<MatchedBooking | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch traveler's bookings
  const { bookings } = usePonderBookings({
    travelerAddress: address?.toLowerCase(),
  });

  // Confirm stay mutation
  const { writeContract, data: txHash, isPending, error: txError } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Handle QR scan from URL (when user clicks QR code link)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrData = params.get("data");

    if (qrData) {
      try {
        const parsed = JSON.parse(qrData) as ScannedData;
        handleQRScan(parsed);
      } catch {
        setError("Invalid QR code data");
      }
    }
  }, []);

  const handleQRScan = (data: ScannedData) => {
    setError(null);
    setScannedData(data);

    // Validate QR code type
    if (data.type !== "nomadnodes-checkin") {
      setError("Invalid QR code. Please scan a NomadNodes check-in QR code.");
      return;
    }

    // Find matching booking
    const now = Date.now() / 1000;
    const oneDayMs = 24 * 60 * 60;

    const matches = bookings?.filter((booking) => {
      const checkIn = Number(booking.checkInDate);
      const checkOut = Number(booking.checkOutDate);

      // Must be for this property
      if (booking.propertyId !== data.propertyId) return false;

      // Check-in must be within ±1 day of now (flexible for early/late arrivals)
      const isCheckInTime = Math.abs(now - checkIn) <= oneDayMs;

      // Or currently in the stay period
      const isDuringStay = now >= checkIn && now <= checkOut;

      return (isCheckInTime || isDuringStay) && booking.status !== "Cancelled";
    });

    if (!matches || matches.length === 0) {
      setError("No active booking found for this property. Make sure your check-in date is today.");
      return;
    }

    // Take the first match (should usually be only one)
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
      escrowAddress: booking.escrowAddress,
    });
  };

  const handleConfirmCheckIn = () => {
    if (!matchedBooking?.escrowAddress) return;

    writeContract({
      address: matchedBooking.escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "confirmStay",
    });
  };

  const handleOpenScanner = () => {
    setIsScanning(true);
    // In production, this would open camera scanner
    // For now, we'll use the link-based approach
  };

  const handleReset = () => {
    setScannedData(null);
    setMatchedBooking(null);
    setError(null);
    setIsScanning(false);
  };

  React.useEffect(() => {
    if (isSuccess) {
      toast.success("Check-in confirmed! Payment released to host.");
      handleReset();
    }
  }, [isSuccess]);

  React.useEffect(() => {
    if (txError) {
      const errorMsg = txError.message;
      if (errorMsg.includes("TooEarlyForAction")) {
        toast.error("Too early to check in. Wait 24h after check-in time.");
      } else {
        toast.error("Transaction failed. Please try again.");
      }
    }
  }, [txError]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Quick Check-In
          </CardTitle>
          <CardDescription>
            Scan the QR code at your property to confirm your arrival
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!scannedData && !error && (
            <Button onClick={handleOpenScanner} className="w-full" size="lg">
              <Camera className="mr-2 h-5 w-5" />
              Scan Check-In QR Code
            </Button>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {matchedBooking && !error && (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Booking found! Ready to check in.
                </AlertDescription>
              </Alert>

              <div className="bg-muted space-y-2 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Property ID:</span>
                  <span className="font-mono text-sm">{matchedBooking.propertyId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Check-in:</span>
                  <span className="text-sm">
                    {new Date(Number(matchedBooking.checkInDate) * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Check-out:</span>
                  <span className="text-sm">
                    {new Date(Number(matchedBooking.checkOutDate) * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleConfirmCheckIn}
                disabled={isPending || isTxLoading}
                className="w-full"
                size="lg"
              >
                {isPending || isTxLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming Check-In...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirm My Arrival
                  </>
                )}
              </Button>

              <Button onClick={handleReset} variant="outline" className="w-full">
                Cancel
              </Button>
            </div>
          )}

          {(error || scannedData) && !matchedBooking && (
            <Button onClick={handleReset} variant="outline" className="w-full">
              Try Again
            </Button>
          )}

          <div className="text-muted-foreground space-y-2 border-t pt-4 text-sm">
            <p className="font-medium">How to use:</p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>Find the check-in QR code at the property</li>
              <li>Click "Scan Check-In QR Code" or use camera</li>
              <li>Your booking will be automatically detected</li>
              <li>Confirm your arrival (available 24h after check-in time)</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
