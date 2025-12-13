"use client";

/**
 * QR code check-in tab
 */

import { Camera, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TabsContent } from "@/components/ui/tabs";
import type { ScannedData, MatchedBooking } from "../types";

interface QRCheckInTabProps {
  scannedData: ScannedData | null;
  matchedBooking: MatchedBooking | null;
  error: string | null;
  isPending: boolean;
  isTxLoading: boolean;
  isCheckInPending: boolean;
  isCheckInLoading: boolean;
  onOpenScanner: () => void;
  onConfirmCheckIn: (booking: {
    escrowAddress?: string | null;
    tokenId: string;
    bookingIndex: string;
  }) => void;
  onReset: () => void;
}

/**
 * Tab content for QR code scanning
 */
export function QRCheckInTab({
  scannedData,
  matchedBooking,
  error,
  isPending,
  isTxLoading,
  isCheckInPending,
  isCheckInLoading,
  onOpenScanner,
  onConfirmCheckIn,
  onReset,
}: QRCheckInTabProps) {
  const isProcessing = isPending || isTxLoading || isCheckInPending || isCheckInLoading;

  return (
    <TabsContent value="qr" className="space-y-4">
      {!scannedData && !error && (
        <Button onClick={onOpenScanner} className="w-full" size="lg">
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
            onClick={() => onConfirmCheckIn(matchedBooking)}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
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

          <Button onClick={onReset} variant="outline" className="w-full">
            Cancel
          </Button>
        </div>
      )}

      {(error || scannedData) && !matchedBooking && (
        <Button onClick={onReset} variant="outline" className="w-full">
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
  );
}
