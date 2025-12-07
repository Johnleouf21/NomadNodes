"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import {
  QrCode,
  Camera,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePonderBookings, type PonderBooking } from "@/hooks/usePonderBookings";
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

// Get bookings that are eligible for check-in today
function getEligibleBookings(bookings: PonderBooking[] | undefined): PonderBooking[] {
  if (!bookings) return [];

  const now = Date.now() / 1000;
  const todayStart = Math.floor(new Date().setUTCHours(0, 0, 0, 0) / 1000);
  const todayEnd = todayStart + 24 * 60 * 60 - 1; // 23:59:59 today

  return bookings.filter((booking) => {
    const checkIn = Number(booking.checkInDate);
    const checkOut = Number(booking.checkOutDate);

    // Booking must be confirmed or checked-in (not pending, cancelled, or completed)
    if (booking.status === "Cancelled" || booking.status === "Completed") return false;

    // Check-in date is today
    const isCheckInToday = checkIn >= todayStart && checkIn <= todayEnd;

    // Or currently in the stay period (already checked in but not completed)
    const isDuringStay = now >= checkIn && now <= checkOut;

    return isCheckInToday || isDuringStay;
  });
}

export function CheckInScanner() {
  const { address } = useAuth();
  const [activeTab, setActiveTab] = React.useState("manual");
  const [isScanning, setIsScanning] = React.useState(false);
  const [scannedData, setScannedData] = React.useState<ScannedData | null>(null);
  const [matchedBooking, setMatchedBooking] = React.useState<MatchedBooking | null>(null);
  const [selectedBookingId, setSelectedBookingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch traveler's bookings
  const { bookings, refetch } = usePonderBookings({
    travelerAddress: address?.toLowerCase(),
  });

  // Get eligible bookings for check-in
  const eligibleBookings = React.useMemo(() => getEligibleBookings(bookings), [bookings]);

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
        setActiveTab("qr");
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

  const handleConfirmCheckIn = (escrowAddress: string) => {
    writeContract({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "confirmStay",
    });
    setSelectedBookingId(escrowAddress);
  };

  const handleOpenScanner = () => {
    setIsScanning(true);
    // In production, this would open camera scanner
    // For now, we'll use the link-based approach
  };

  const handleReset = () => {
    setScannedData(null);
    setMatchedBooking(null);
    setSelectedBookingId(null);
    setError(null);
    setIsScanning(false);
  };

  React.useEffect(() => {
    if (isSuccess) {
      toast.success("Check-in confirmed! Payment will be released to host.");
      handleReset();
      refetch();
    }
  }, [isSuccess, refetch]);

  React.useEffect(() => {
    if (txError) {
      const errorMsg = txError.message;
      if (errorMsg.includes("TooEarlyForAction")) {
        toast.error("Too early to check in. Please wait until check-in time.");
      } else if (errorMsg.includes("OnlyGuest")) {
        toast.error("Only the booking guest can confirm check-in.");
      } else {
        toast.error("Transaction failed. Please try again.");
      }
      setSelectedBookingId(null);
    }
  }, [txError]);

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

          {/* Manual Check-in Tab */}
          <TabsContent value="manual" className="space-y-4">
            {eligibleBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="text-muted-foreground/50 mb-4 h-12 w-12" />
                <p className="text-muted-foreground mb-2">No bookings to check in today</p>
                <p className="text-muted-foreground text-sm">
                  Check-in will be available on your booking date
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {eligibleBookings.map((booking) => {
                  const checkIn = new Date(Number(booking.checkInDate) * 1000);
                  const checkOut = new Date(Number(booking.checkOutDate) * 1000);
                  const isConfirming =
                    selectedBookingId === booking.escrowAddress && (isPending || isTxLoading);
                  const isAlreadyCheckedIn = booking.status === "CheckedIn";

                  return (
                    <div
                      key={booking.id}
                      className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <p className="font-semibold">Property #{booking.propertyId}</p>
                          <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {checkIn.toLocaleDateString()} - {checkOut.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Badge
                          className={
                            isAlreadyCheckedIn
                              ? "border-purple-500/30 bg-purple-500/10 text-purple-700"
                              : "border-blue-500/30 bg-blue-500/10 text-blue-700"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>

                      {isAlreadyCheckedIn ? (
                        <div className="bg-muted/50 flex items-center gap-2 rounded-md p-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Already checked in</span>
                        </div>
                      ) : booking.escrowAddress ? (
                        <Button
                          onClick={() => handleConfirmCheckIn(booking.escrowAddress!)}
                          disabled={isConfirming}
                          className="w-full"
                          size="sm"
                        >
                          {isConfirming ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Confirming...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Confirm My Arrival
                            </>
                          )}
                        </Button>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          Escrow not available for this booking
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-muted-foreground border-t pt-4 text-sm">
              <p>
                <Clock className="mr-1 inline h-3.5 w-3.5" />
                You can confirm your arrival on the day of your check-in.
              </p>
            </div>
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qr" className="space-y-4">
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
                  onClick={() => handleConfirmCheckIn(matchedBooking.escrowAddress!)}
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
                <li>Confirm your arrival</li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
