"use client";

import * as React from "react";
import {
  Calendar,
  Users,
  CreditCard,
  MapPin,
  Home,
  CheckCircle2,
  Loader2,
  BedDouble,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useBookingStore, type BookingRoom } from "@/lib/store/useBookingStore";
import Link from "next/link";

interface ReviewStepProps {
  propertyName: string;
  roomName: string; // Legacy single room
  location: string;
  checkIn: Date;
  checkOut: Date;
  totalNights: number;
  guests: number;
  pricePerNight: number; // Legacy single room price
  platformFee: number;
  totalAmount: number;
  paymentToken: "USDC" | "EURC";
  specialRequests?: string;
  isProcessing: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

export function ReviewStep({
  propertyName,
  roomName,
  location,
  checkIn,
  checkOut,
  totalNights,
  guests,
  pricePerNight,
  platformFee,
  totalAmount,
  paymentToken,
  specialRequests,
  isProcessing,
  onConfirm,
  onBack,
}: ReviewStepProps) {
  const { bookingData } = useBookingStore();
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [agreedToCancellation, setAgreedToCancellation] = React.useState(false);

  const canConfirm = agreedToTerms && agreedToCancellation && !isProcessing;

  // Get rooms from store or create legacy single room
  const rooms: BookingRoom[] =
    bookingData.rooms.length > 0
      ? bookingData.rooms
      : [
          {
            tokenId: 0n,
            roomName,
            pricePerNight,
            maxGuests: guests,
            quantity: 1,
            currency: paymentToken === "EURC" ? "EUR" : "USD",
          },
        ];

  const currencySymbol = paymentToken === "EURC" ? "€" : "$";
  const totalRooms = rooms.reduce((sum, r) => sum + r.quantity, 0);

  // Calculate subtotal from rooms
  const subtotal = rooms.reduce(
    (sum, room) => sum + room.pricePerNight * room.quantity * totalNights,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Review Your Booking
        </CardTitle>
        <CardDescription>Please review all details before confirming</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Details */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <Home className="text-muted-foreground mt-1 h-5 w-5" />
            <div className="flex-1">
              <h3 className="font-semibold">{propertyName}</h3>
              <div className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                <MapPin className="h-3.5 w-3.5" />
                <span>{location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rooms Selected */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BedDouble className="text-muted-foreground h-5 w-5" />
            <h3 className="font-semibold">
              Rooms Selected
              <Badge variant="secondary" className="ml-2">
                {totalRooms} {totalRooms === 1 ? "room" : "rooms"}
              </Badge>
            </h3>
          </div>

          <div className="space-y-2 rounded-lg border p-3">
            {rooms.map((room, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{room.roomName}</span>
                  {room.quantity > 1 && (
                    <Badge variant="outline" className="text-xs">
                      × {room.quantity}
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground">
                  {currencySymbol}
                  {room.pricePerNight.toFixed(2)}/night
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Details */}
        <div className="space-y-4">
          <h3 className="font-semibold">Booking Details</h3>

          <div className="space-y-3">
            {/* Dates */}
            <div className="flex items-start gap-3">
              <Calendar className="text-muted-foreground mt-1 h-5 w-5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Check-in</span>
                  <span className="font-medium">{format(checkIn, "EEE, MMM d, yyyy")}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Check-out</span>
                  <span className="font-medium">{format(checkOut, "EEE, MMM d, yyyy")}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Total nights</span>
                  <Badge variant="secondary">{totalNights}</Badge>
                </div>
              </div>
            </div>

            {/* Guests */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="text-muted-foreground h-5 w-5" />
                <span className="text-muted-foreground text-sm">Guests</span>
              </div>
              <span className="font-medium">{guests}</span>
            </div>
          </div>
        </div>

        {/* Special Requests */}
        {specialRequests && (
          <div className="space-y-2">
            <h3 className="font-semibold">Special Requests</h3>
            <p className="text-muted-foreground text-sm">{specialRequests}</p>
          </div>
        )}

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <h3 className="font-semibold">Price Summary</h3>

          <div className="bg-muted/50 space-y-2 rounded-lg p-4">
            {/* Room breakdown */}
            {rooms.map((room, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {room.roomName} {room.quantity > 1 && `× ${room.quantity}`} ({totalNights}{" "}
                  {totalNights === 1 ? "night" : "nights"})
                </span>
                <span className="font-medium">
                  {currencySymbol}
                  {(room.pricePerNight * room.quantity * totalNights).toFixed(2)}
                </span>
              </div>
            ))}

            {rooms.length > 1 && (
              <>
                <Separator className="my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {currencySymbol}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform fee (5%)</span>
              <span className="font-medium">
                {currencySymbol}
                {platformFee.toFixed(2)}
              </span>
            </div>

            <Separator className="my-2" />

            <div className="flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {currencySymbol}
                  {totalAmount.toFixed(2)}
                </p>
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Paid in {paymentToken}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Cancellation Policy Summary */}
        <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/50">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Cancellation Policy
          </h4>
          <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
            <li>
              • <strong>More than 30 days</strong> before check-in: Full refund
            </li>
            <li>
              • <strong>14-30 days</strong> before check-in: 50% refund
            </li>
            <li>
              • <strong>Less than 14 days</strong> before check-in: No refund
            </li>
          </ul>
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-4">
          <h3 className="font-semibold">Terms and Conditions</h3>

          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <Label htmlFor="terms" className="cursor-pointer text-sm leading-relaxed">
                I agree to the platform's{" "}
                <Link href="/terms" className="text-primary underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="cancellation"
                checked={agreedToCancellation}
                onCheckedChange={(checked) => setAgreedToCancellation(checked as boolean)}
              />
              <Label htmlFor="cancellation" className="cursor-pointer text-sm leading-relaxed">
                I understand the cancellation policy and that funds will be held in escrow until
                check-in
              </Label>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900 dark:bg-orange-950/50">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-orange-600 dark:text-orange-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Escrow Protection
              </p>
              <p className="text-xs text-orange-800 dark:text-orange-200">
                Your payment will be securely held in a smart contract escrow. Funds are only
                released to the host after you check in. You can cancel before check-in according to
                the cancellation policy.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} disabled={isProcessing}>
            Back to Payment
          </Button>
          <Button onClick={onConfirm} disabled={!canConfirm} className="min-w-[140px]">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm Booking
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
