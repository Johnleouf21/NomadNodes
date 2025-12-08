"use client";

import * as React from "react";
import {
  Wallet,
  DollarSign,
  Loader2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import { toast } from "sonner";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import { useInvalidateQueries } from "@/hooks/useInvalidateQueries";

const ESCROW_ABI = [
  {
    inputs: [],
    name: "withdrawCrypto",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "autoReleaseToHost",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ type: "uint8", name: "_preference" }],
    name: "setPaymentPreference",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "status",
    outputs: [{ type: "uint8", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawn",
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "hostPreference",
    outputs: [{ type: "uint8", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "amount",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFee",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [{ type: "address", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "checkIn",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Escrow Status enum: 0 = Pending, 1 = Completed
enum EscrowStatus {
  Pending = 0,
  Completed = 1,
}

const ERC20_ABI = [
  {
    inputs: [{ type: "address", name: "account" }],
    name: "balanceOf",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// PaymentPreference enum: 0 = CRYPTO, 1 = FIAT
enum PaymentPreference {
  CRYPTO = 0,
  FIAT = 1,
}

interface HostRevenueProps {
  bookings: PonderBooking[];
  getPropertyInfo: (booking: PonderBooking) => { name: string; imageUrl?: string };
  getRoomTypeInfo: (booking: PonderBooking) => { name: string; currency: "USD" | "EUR" };
}

interface EscrowInfo {
  booking: PonderBooking;
  escrowAddress: string;
  status: number | undefined;
  withdrawn: boolean | undefined;
  amount: bigint | undefined;
  platformFee: bigint | undefined;
  balance: bigint | undefined;
  hostPreference: number | undefined;
  checkInTimestamp: bigint | undefined;
}

export function HostRevenue({ bookings, getPropertyInfo, getRoomTypeInfo }: HostRevenueProps) {
  const [withdrawingEscrow, setWithdrawingEscrow] = React.useState<string | null>(null);
  const [releasingEscrow, setReleasingEscrow] = React.useState<string | null>(null);
  const { invalidateEscrows } = useInvalidateQueries();

  // Filter bookings with escrow addresses where funds may be available
  // Include both CheckedIn (escrow may be completed) and Completed bookings
  const bookingsWithEscrow = React.useMemo(() => {
    return bookings.filter(
      (b) => (b.status === "Completed" || b.status === "CheckedIn") && b.escrowAddress
    );
  }, [bookings]);

  // Prepare contract read calls for all escrows
  const escrowContracts = React.useMemo(() => {
    const calls: {
      address: `0x${string}`;
      abi: typeof ESCROW_ABI;
      functionName: string;
    }[] = [];

    bookingsWithEscrow.forEach((booking) => {
      const address = booking.escrowAddress as `0x${string}`;
      calls.push(
        { address, abi: ESCROW_ABI, functionName: "status" },
        { address, abi: ESCROW_ABI, functionName: "withdrawn" },
        { address, abi: ESCROW_ABI, functionName: "amount" },
        { address, abi: ESCROW_ABI, functionName: "platformFee" },
        { address, abi: ESCROW_ABI, functionName: "hostPreference" },
        { address, abi: ESCROW_ABI, functionName: "token" },
        { address, abi: ESCROW_ABI, functionName: "checkIn" }
      );
    });

    return calls;
  }, [bookingsWithEscrow]);

  // Read all escrow data
  const { data: escrowData, isLoading: loadingEscrows } = useReadContracts({
    contracts: escrowContracts,
  });

  // Build balance read calls after we have token addresses
  const balanceContracts = React.useMemo(() => {
    if (!escrowData) return [];

    const calls: {
      address: `0x${string}`;
      abi: typeof ERC20_ABI;
      functionName: "balanceOf";
      args: [`0x${string}`];
    }[] = [];

    bookingsWithEscrow.forEach((booking, index) => {
      const tokenIndex = index * 7 + 5; // token is the 6th call (index 5) for each escrow, 7 calls per escrow
      const tokenResult = escrowData[tokenIndex];
      const tokenAddress = tokenResult?.result as `0x${string}` | undefined;

      if (tokenAddress) {
        calls.push({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [booking.escrowAddress as `0x${string}`],
        });
      }
    });

    return calls;
  }, [escrowData, bookingsWithEscrow]);

  // Read balances
  const { data: balanceData } = useReadContracts({
    contracts: balanceContracts,
    query: { enabled: balanceContracts.length > 0 },
  });

  // Process escrow information
  const escrowInfos: EscrowInfo[] = React.useMemo(() => {
    if (!escrowData) return [];

    return bookingsWithEscrow.map((booking, index) => {
      const baseIndex = index * 7; // 7 calls per escrow now
      return {
        booking,
        escrowAddress: booking.escrowAddress!,
        status: escrowData[baseIndex]?.result as number | undefined,
        withdrawn: escrowData[baseIndex + 1]?.result as boolean | undefined,
        amount: escrowData[baseIndex + 2]?.result as bigint | undefined,
        platformFee: escrowData[baseIndex + 3]?.result as bigint | undefined,
        hostPreference: escrowData[baseIndex + 4]?.result as number | undefined,
        balance: balanceData?.[index]?.result as bigint | undefined,
        checkInTimestamp: escrowData[baseIndex + 6]?.result as bigint | undefined,
      };
    });
  }, [escrowData, balanceData, bookingsWithEscrow]);

  // Filter escrows with pending withdrawals
  const pendingWithdrawals = React.useMemo(() => {
    return escrowInfos.filter((info) => {
      const hasBalance = info.balance && info.balance > BigInt(0);
      const notWithdrawn = !info.withdrawn;
      return hasBalance && notWithdrawn;
    });
  }, [escrowInfos]);

  // Calculate totals
  const totals = React.useMemo(() => {
    let pendingAmount = BigInt(0);
    let withdrawnAmount = BigInt(0);

    escrowInfos.forEach((info) => {
      const hostAmount =
        info.amount && info.platformFee ? info.amount - info.platformFee : BigInt(0);

      if (info.withdrawn) {
        withdrawnAmount += hostAmount;
      } else if (info.balance && info.balance > BigInt(0)) {
        pendingAmount += hostAmount;
      }
    });

    return {
      pending: Number(formatUnits(pendingAmount, 6)),
      withdrawn: Number(formatUnits(withdrawnAmount, 6)),
      total: Number(formatUnits(pendingAmount + withdrawnAmount, 6)),
    };
  }, [escrowInfos]);

  // Withdraw mutation
  const {
    writeContract: withdraw,
    data: withdrawHash,
    isPending: isWithdrawPending,
  } = useWriteContract();
  const { isLoading: isWithdrawLoading, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({
      hash: withdrawHash,
    });

  // Release mutation (autoReleaseToHost)
  const {
    writeContract: release,
    data: releaseHash,
    isPending: isReleasePending,
  } = useWriteContract();
  const { isLoading: isReleaseLoading, isSuccess: isReleaseSuccess } = useWaitForTransactionReceipt(
    {
      hash: releaseHash,
    }
  );

  // Set preference mutation
  const {
    writeContract: setPreference,
    data: prefHash,
    isPending: isPrefPending,
  } = useWriteContract();
  const { isLoading: isPrefLoading, isSuccess: isPrefSuccess } = useWaitForTransactionReceipt({
    hash: prefHash,
  });

  // Success effects with cache invalidation
  React.useEffect(() => {
    if (isWithdrawSuccess) {
      toast.success("Funds withdrawn successfully!");
      setWithdrawingEscrow(null);
      // Invalidate cache to refresh UI
      invalidateEscrows(3000);
    }
  }, [isWithdrawSuccess, invalidateEscrows]);

  React.useEffect(() => {
    if (isReleaseSuccess) {
      toast.success("Funds released! You can now withdraw.");
      setReleasingEscrow(null);
      // Invalidate cache to refresh UI
      invalidateEscrows(3000);
    }
  }, [isReleaseSuccess, invalidateEscrows]);

  React.useEffect(() => {
    if (isPrefSuccess) {
      toast.success("Payment preference set to crypto!");
      // Invalidate cache to refresh UI
      invalidateEscrows(2000);
    }
  }, [isPrefSuccess, invalidateEscrows]);

  const handleWithdraw = (escrowAddress: string) => {
    setWithdrawingEscrow(escrowAddress);
    withdraw({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "withdrawCrypto",
    });
  };

  const handleRelease = (escrowAddress: string) => {
    setReleasingEscrow(escrowAddress);
    release({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "autoReleaseToHost",
    });
  };

  const handleSetPreference = (escrowAddress: string) => {
    setPreference({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "setPaymentPreference",
      args: [PaymentPreference.CRYPTO],
    });
  };

  if (loadingEscrows) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${totals.pending.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">
              {pendingWithdrawals.length} escrow{pendingWithdrawals.length !== 1 ? "s" : ""} ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Already Withdrawn</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totals.withdrawn.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">Sent to your wallet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.total.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">From completed bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Withdrawals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Pending Withdrawals
          </CardTitle>
          <CardDescription>Funds ready to be withdrawn to your wallet</CardDescription>
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

                // Check if escrow is still Pending (needs release first)
                const isPending = info.status === EscrowStatus.Pending;
                const isCompleted = info.status === EscrowStatus.Completed;

                // Check if check-in day has passed (host can release after 23:59 UTC of check-in day)
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

                      {/* Step 1: Release funds if escrow is Pending */}
                      {isPending && canRelease && (
                        <Button
                          onClick={() => handleRelease(info.escrowAddress)}
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

                      {/* Step 1b: Can't release yet (before check-in day ends) */}
                      {isPending && !canRelease && (
                        <Button disabled variant="outline">
                          <Clock className="mr-2 h-4 w-4" />
                          Wait for check-in day
                        </Button>
                      )}

                      {/* Step 2: Set preference if needed */}
                      {needsPreference && (
                        <Button
                          onClick={() => handleSetPreference(info.escrowAddress)}
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

                      {/* Step 3: Withdraw */}
                      {canWithdraw && (
                        <Button
                          onClick={() => handleWithdraw(info.escrowAddress)}
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

              {/* Withdraw All Button */}
              {pendingWithdrawals.length > 1 &&
                pendingWithdrawals.every((p) => p.hostPreference === PaymentPreference.CRYPTO) && (
                  <Separator className="my-4" />
                )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Each withdrawal requires a separate transaction. Funds will be sent directly to
                  your connected wallet.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      {escrowInfos.filter((e) => e.withdrawn).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Withdrawal History
            </CardTitle>
            <CardDescription>Past withdrawals from completed bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {escrowInfos
                .filter((e) => e.withdrawn)
                .map((info) => {
                  const { name: propertyName } = getPropertyInfo(info.booking);
                  const { currency } = getRoomTypeInfo(info.booking);
                  const currencyLabel = currency === "EUR" ? "EURC" : "USDC";
                  const hostAmount =
                    info.amount && info.platformFee ? info.amount - info.platformFee : BigInt(0);
                  const formattedAmount = Number(formatUnits(hostAmount, 6)).toFixed(2);

                  return (
                    <div
                      key={info.escrowAddress}
                      className="flex items-center justify-between rounded-lg bg-green-500/5 p-3"
                    >
                      <div>
                        <p className="font-medium">{propertyName}</p>
                        <p className="text-muted-foreground text-xs">
                          Booking #{info.booking.bookingIndex}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formattedAmount} {currencyLabel}
                        </p>
                        <Badge variant="outline" className="text-xs text-green-600">
                          Withdrawn
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
