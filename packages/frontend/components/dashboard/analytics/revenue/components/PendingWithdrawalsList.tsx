"use client";

import {
  Wallet,
  Loader2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  AlertCircle,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatUnits } from "viem";
import { EscrowStatus, PaymentPreference } from "../constants";
import type { EscrowInfo } from "../types";
import type { PonderBooking } from "@/hooks/usePonderBookings";

interface PendingWithdrawalsListProps {
  pendingWithdrawals: EscrowInfo[];
  batchReadyCount: number;
  getPropertyInfo: (booking: PonderBooking) => { name: string };
  getRoomTypeInfo: (booking: PonderBooking) => { name: string; currency: "USD" | "EUR" };
  onWithdraw: (escrowAddress: string) => void;
  onRelease: (escrowAddress: string) => void;
  onSetPreference: (escrowAddress: string) => void;
  onStartBatchWithdraw: () => void;
  withdrawingEscrow: string | null;
  releasingEscrow: string | null;
  isWithdrawPending: boolean;
  isWithdrawLoading: boolean;
  isReleasePending: boolean;
  isReleaseLoading: boolean;
  isPrefPending: boolean;
  isPrefLoading: boolean;
}

export function PendingWithdrawalsList({
  pendingWithdrawals,
  batchReadyCount,
  getPropertyInfo,
  getRoomTypeInfo,
  onWithdraw,
  onRelease,
  onSetPreference,
  onStartBatchWithdraw,
  withdrawingEscrow,
  releasingEscrow,
  isWithdrawPending,
  isWithdrawLoading,
  isReleasePending,
  isReleaseLoading,
  isPrefPending,
  isPrefLoading,
}: PendingWithdrawalsListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Pending Withdrawals
            </CardTitle>
            <CardDescription className="mt-1">
              Funds ready to be withdrawn to your wallet
            </CardDescription>
          </div>
          {batchReadyCount > 1 && (
            <Button onClick={onStartBatchWithdraw} className="bg-green-600 hover:bg-green-700">
              <Layers className="mr-2 h-4 w-4" />
              Withdraw All ({batchReadyCount})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {pendingWithdrawals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground text-center">No pending withdrawals</p>
            <p className="text-muted-foreground mt-1 text-center text-sm">
              All your earnings have been withdrawn
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingWithdrawals.map((info) => {
              const { name: propertyName } = getPropertyInfo(info.booking);
              const { name: roomName, currency } = getRoomTypeInfo(info.booking);
              const currencyLabel = currency === "EUR" ? "EURC" : "USDC";
              const hostAmount =
                info.amount && info.platformFee ? info.amount - info.platformFee : BigInt(0);
              const formattedAmount = Number(formatUnits(hostAmount, 6)).toFixed(2);

              const isPending = info.status === EscrowStatus.Pending;
              const isCompleted = info.status === EscrowStatus.Completed;

              const checkInMs = info.checkInTimestamp ? Number(info.checkInTimestamp) * 1000 : 0;
              const checkInDayEnd = new Date(checkInMs);
              checkInDayEnd.setUTCHours(23, 59, 59, 999);
              const canRelease = isPending && Date.now() > checkInDayEnd.getTime();

              const canWithdraw = isCompleted && info.hostPreference === PaymentPreference.CRYPTO;
              const needsPreference =
                isCompleted && info.hostPreference !== PaymentPreference.CRYPTO;

              const isReleasingThis =
                releasingEscrow === info.escrowAddress && (isReleasePending || isReleaseLoading);
              const isWithdrawingThis =
                withdrawingEscrow === info.escrowAddress &&
                (isWithdrawPending || isWithdrawLoading);
              const isSettingPref = isPrefPending || isPrefLoading;

              return (
                <div
                  key={info.escrowAddress}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{propertyName}</p>
                      <Badge variant="outline" className="text-xs">
                        {roomName}
                      </Badge>
                      {isPending && (
                        <Badge variant="secondary" className="text-xs">
                          Needs Release
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Booking #{info.booking.bookingIndex}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formattedAmount} {currencyLabel}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {isPending ? "Release funds first" : "Ready to withdraw"}
                      </p>
                    </div>

                    {isPending && canRelease && (
                      <Button
                        onClick={() => onRelease(info.escrowAddress)}
                        disabled={isReleasingThis}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isReleasingThis ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Releasing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Release Funds
                          </>
                        )}
                      </Button>
                    )}

                    {isPending && !canRelease && (
                      <Button disabled variant="outline">
                        <Clock className="mr-2 h-4 w-4" />
                        Wait for check-in day
                      </Button>
                    )}

                    {needsPreference && (
                      <Button
                        onClick={() => onSetPreference(info.escrowAddress)}
                        disabled={isSettingPref}
                        variant="outline"
                      >
                        {isSettingPref ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Setting...
                          </>
                        ) : (
                          <>
                            <Wallet className="mr-2 h-4 w-4" />
                            Enable Crypto
                          </>
                        )}
                      </Button>
                    )}

                    {canWithdraw && (
                      <Button
                        onClick={() => onWithdraw(info.escrowAddress)}
                        disabled={isWithdrawingThis}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isWithdrawingThis ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Withdrawing...
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            Withdraw
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {pendingWithdrawals.length > 1 &&
              pendingWithdrawals.every((p) => p.hostPreference === PaymentPreference.CRYPTO) && (
                <Separator className="my-4" />
              )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Each withdrawal requires a separate transaction. Funds will be sent directly to your
                connected wallet.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
