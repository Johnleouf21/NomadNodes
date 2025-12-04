"use client";

import * as React from "react";
import { CreditCard, DollarSign, Euro, Wallet, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useBookingStore } from "@/lib/store/useBookingStore";
import { useTokenBalances } from "@/lib/hooks/useTokenBalances";
import { useAccount } from "wagmi";

interface PaymentStepProps {
  pricePerNight: number; // Legacy single room price
  totalNights: number;
  onNext: (paymentToken: "USDC" | "EURC", totalAmount: number, platformFee: number) => void;
  onBack: () => void;
}

const PLATFORM_FEE_PERCENTAGE = 0.05; // 5%

export function PaymentStep({ pricePerNight, totalNights, onNext, onBack }: PaymentStepProps) {
  const { address } = useAccount();
  const { bookingData } = useBookingStore();
  const { usdc, eurc, isLoading: isLoadingBalances } = useTokenBalances(address);

  // Determine currency from selected rooms (use first room's currency or default USD)
  const roomCurrency = bookingData.rooms.length > 0 ? bookingData.rooms[0].currency : "USD";

  // Default payment token based on room currency
  const [paymentToken, setPaymentToken] = React.useState<"USDC" | "EURC">(
    roomCurrency === "EUR" ? "EURC" : "USDC"
  );

  // Calculate costs from store's rooms or legacy single price
  const { subtotal, roomBreakdown } = React.useMemo(() => {
    if (bookingData.rooms.length > 0) {
      const breakdown = bookingData.rooms.map((room) => ({
        name: room.roomName,
        quantity: room.quantity,
        pricePerNight: room.pricePerNight,
        total: room.pricePerNight * room.quantity * totalNights,
      }));
      const total = breakdown.reduce((sum, item) => sum + item.total, 0);
      return { subtotal: total, roomBreakdown: breakdown };
    }
    return {
      subtotal: pricePerNight * totalNights,
      roomBreakdown: [
        { name: "Room", quantity: 1, pricePerNight, total: pricePerNight * totalNights },
      ],
    };
  }, [bookingData.rooms, pricePerNight, totalNights]);

  const platformFee = subtotal * PLATFORM_FEE_PERCENTAGE;
  const totalAmount = subtotal + platformFee;

  // Helper to get formatted balance as number
  const getBalanceAsNumber = (token: typeof usdc | typeof eurc): number => {
    if (!token) return 0;
    return parseFloat(token.formatted);
  };

  // Check if user has sufficient balance
  const selectedBalance = paymentToken === "USDC" ? usdc : eurc;
  const selectedBalanceFormatted = getBalanceAsNumber(selectedBalance);
  const hasSufficientBalance = selectedBalanceFormatted >= totalAmount;
  const currencySymbol = paymentToken === "EURC" ? "€" : "$";

  const handleNext = () => {
    onNext(paymentToken, totalAmount, platformFee);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
        <CardDescription>Review the cost and select your payment method</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Breakdown */}
        <div className="bg-muted/50 space-y-3 rounded-lg border p-4">
          <h3 className="font-semibold">Price Breakdown</h3>

          <div className="space-y-2">
            {/* Room details */}
            {roomBreakdown.map((room, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {room.name} {room.quantity > 1 && `× ${room.quantity}`} ({currencySymbol}
                  {room.pricePerNight.toFixed(2)}/night × {totalNights}{" "}
                  {totalNights === 1 ? "night" : "nights"})
                </span>
                <span className="font-medium">
                  {currencySymbol}
                  {room.total.toFixed(2)}
                </span>
              </div>
            ))}

            {roomBreakdown.length > 1 && (
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
              <span className="text-muted-foreground">
                Platform fee ({(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}%)
              </span>
              <span className="font-medium">
                {currencySymbol}
                {platformFee.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span>
                {currencySymbol}
                {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Balance */}
        {address && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Wallet className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">Your {paymentToken} Balance</span>
            </div>
            <span className={cn("font-medium", !hasSufficientBalance && "text-red-600")}>
              {isLoadingBalances ? "..." : `${selectedBalanceFormatted.toFixed(2)} ${paymentToken}`}
            </span>
          </div>
        )}

        {/* Insufficient Balance Warning */}
        {address && !isLoadingBalances && !hasSufficientBalance && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Insufficient {paymentToken} balance. You need {totalAmount.toFixed(2)} {paymentToken}{" "}
              but only have {selectedBalanceFormatted.toFixed(2)} {paymentToken}.
            </AlertDescription>
          </Alert>
        )}

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <Label className="text-base">Select Payment Token</Label>

          <RadioGroup
            value={paymentToken}
            onValueChange={(value) => setPaymentToken(value as "USDC" | "EURC")}
          >
            {/* USDC Option */}
            <div
              className={cn(
                "flex cursor-pointer items-center space-x-4 rounded-lg border p-4 transition-all",
                paymentToken === "USDC"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:bg-muted/50"
              )}
              onClick={() => setPaymentToken("USDC")}
            >
              <RadioGroupItem value="USDC" id="usdc" />
              <div className="flex flex-1 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
                    <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <Label htmlFor="usdc" className="cursor-pointer text-base font-semibold">
                      USD Coin (USDC)
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Balance:{" "}
                      {isLoadingBalances ? "..." : `${getBalanceAsNumber(usdc).toFixed(2)} USDC`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{totalAmount.toFixed(2)} USDC</p>
                  <p className="text-muted-foreground text-sm">≈ ${totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* EURC Option */}
            <div
              className={cn(
                "flex cursor-pointer items-center space-x-4 rounded-lg border p-4 transition-all",
                paymentToken === "EURC"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:bg-muted/50"
              )}
              onClick={() => setPaymentToken("EURC")}
            >
              <RadioGroupItem value="EURC" id="eurc" />
              <div className="flex flex-1 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950">
                    <Euro className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <Label htmlFor="eurc" className="cursor-pointer text-base font-semibold">
                      Euro Coin (EURC)
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Balance:{" "}
                      {isLoadingBalances ? "..." : `${getBalanceAsNumber(eurc).toFixed(2)} EURC`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{totalAmount.toFixed(2)} EURC</p>
                  <p className="text-muted-foreground text-sm">≈ €{totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Payment Notice */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/50">
          <div className="flex items-start gap-2">
            <CreditCard className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Secure Payment via Smart Contract
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Your payment will be held in escrow and only released to the host after check-in.
                You'll need to approve the {paymentToken} transfer in your wallet.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back to Guests
          </Button>
          <Button onClick={handleNext} disabled={!hasSufficientBalance && !!address}>
            Review Booking
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
