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
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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

const ITEMS_PER_PAGE = 10;

// Batch withdrawal state interface
interface BatchWithdrawState {
  isActive: boolean;
  escrows: EscrowInfo[];
  currentIndex: number;
  completed: string[];
  failed: string[];
  status: "idle" | "processing" | "waiting" | "done" | "cancelled";
}

export function HostRevenue({ bookings, getPropertyInfo, getRoomTypeInfo }: HostRevenueProps) {
  const [withdrawingEscrow, setWithdrawingEscrow] = React.useState<string | null>(null);
  const [releasingEscrow, setReleasingEscrow] = React.useState<string | null>(null);
  const { invalidateEscrows } = useInvalidateQueries();

  // Withdrawal history filters state
  const [historySearch, setHistorySearch] = React.useState("");
  const [historyPropertyFilter, setHistoryPropertyFilter] = React.useState<string>("all");
  const [historyCurrencyFilter, setHistoryCurrencyFilter] = React.useState<string>("all");
  const [historyPage, setHistoryPage] = React.useState(1);

  // Batch withdrawal state
  const [batchWithdraw, setBatchWithdraw] = React.useState<BatchWithdrawState>({
    isActive: false,
    escrows: [],
    currentIndex: 0,
    completed: [],
    failed: [],
    status: "idle",
  });
  const [batchModalOpen, setBatchModalOpen] = React.useState(false);

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

  // Get withdrawn escrows for history
  const withdrawnEscrows = React.useMemo(() => {
    return escrowInfos.filter((e) => e.withdrawn);
  }, [escrowInfos]);

  // Get unique property names for filter dropdown
  const uniquePropertyNames = React.useMemo(() => {
    const names = new Set<string>();
    withdrawnEscrows.forEach((info) => {
      const { name } = getPropertyInfo(info.booking);
      names.add(name);
    });
    return Array.from(names).sort();
  }, [withdrawnEscrows, getPropertyInfo]);

  // Filter and paginate withdrawal history
  const filteredWithdrawalHistory = React.useMemo(() => {
    let filtered = withdrawnEscrows;

    // Filter by search (booking number)
    if (historySearch) {
      const searchLower = historySearch.toLowerCase();
      filtered = filtered.filter(
        (info) =>
          info.booking.bookingIndex.toString().includes(searchLower) ||
          getPropertyInfo(info.booking).name.toLowerCase().includes(searchLower)
      );
    }

    // Filter by property
    if (historyPropertyFilter !== "all") {
      filtered = filtered.filter((info) => {
        const { name } = getPropertyInfo(info.booking);
        return name === historyPropertyFilter;
      });
    }

    // Filter by currency
    if (historyCurrencyFilter !== "all") {
      filtered = filtered.filter((info) => {
        const { currency } = getRoomTypeInfo(info.booking);
        const currencyLabel = currency === "EUR" ? "EURC" : "USDC";
        return currencyLabel === historyCurrencyFilter;
      });
    }

    return filtered;
  }, [
    withdrawnEscrows,
    historySearch,
    historyPropertyFilter,
    historyCurrencyFilter,
    getPropertyInfo,
    getRoomTypeInfo,
  ]);

  // Paginate
  const paginatedHistory = React.useMemo(() => {
    const startIndex = (historyPage - 1) * ITEMS_PER_PAGE;
    return filteredWithdrawalHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredWithdrawalHistory, historyPage]);

  const totalHistoryPages = Math.ceil(filteredWithdrawalHistory.length / ITEMS_PER_PAGE);

  // Reset page when filters change
  React.useEffect(() => {
    setHistoryPage(1);
  }, [historySearch, historyPropertyFilter, historyCurrencyFilter]);

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

  // Batch withdraw mutation
  const {
    writeContract: batchWithdrawCall,
    data: batchWithdrawHash,
    isPending: isBatchWithdrawPending,
    reset: resetBatchWithdraw,
  } = useWriteContract();
  const {
    isLoading: isBatchWithdrawLoading,
    isSuccess: isBatchWithdrawSuccess,
    isError: isBatchWithdrawError,
  } = useWaitForTransactionReceipt({
    hash: batchWithdrawHash,
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

  // Batch withdraw success effect
  React.useEffect(() => {
    if (isBatchWithdrawSuccess && batchWithdraw.isActive) {
      const currentEscrow = batchWithdraw.escrows[batchWithdraw.currentIndex];

      setBatchWithdraw((prev) => ({
        ...prev,
        completed: [...prev.completed, currentEscrow.escrowAddress],
        currentIndex: prev.currentIndex + 1,
        status: prev.currentIndex + 1 >= prev.escrows.length ? "done" : "idle",
      }));

      // Reset the mutation for the next withdrawal
      resetBatchWithdraw();
    }
  }, [
    isBatchWithdrawSuccess,
    batchWithdraw.isActive,
    batchWithdraw.currentIndex,
    batchWithdraw.escrows,
    resetBatchWithdraw,
  ]);

  // Batch withdraw error effect
  React.useEffect(() => {
    if (isBatchWithdrawError && batchWithdraw.isActive) {
      const currentEscrow = batchWithdraw.escrows[batchWithdraw.currentIndex];

      setBatchWithdraw((prev) => ({
        ...prev,
        failed: [...prev.failed, currentEscrow.escrowAddress],
        currentIndex: prev.currentIndex + 1,
        status: prev.currentIndex + 1 >= prev.escrows.length ? "done" : "idle",
      }));

      // Reset the mutation for the next withdrawal
      resetBatchWithdraw();
    }
  }, [
    isBatchWithdrawError,
    batchWithdraw.isActive,
    batchWithdraw.currentIndex,
    batchWithdraw.escrows,
    resetBatchWithdraw,
  ]);

  // Auto-process next batch withdrawal
  React.useEffect(() => {
    if (
      batchWithdraw.isActive &&
      batchWithdraw.status === "idle" &&
      batchWithdraw.currentIndex < batchWithdraw.escrows.length
    ) {
      const currentEscrow = batchWithdraw.escrows[batchWithdraw.currentIndex];

      setBatchWithdraw((prev) => ({ ...prev, status: "processing" }));

      batchWithdrawCall({
        address: currentEscrow.escrowAddress as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "withdrawCrypto",
      });
    }
  }, [
    batchWithdraw.isActive,
    batchWithdraw.status,
    batchWithdraw.currentIndex,
    batchWithdraw.escrows,
    batchWithdrawCall,
  ]);

  // Batch done - show summary and invalidate
  React.useEffect(() => {
    if (batchWithdraw.status === "done" && batchWithdraw.isActive) {
      const { completed, failed } = batchWithdraw;

      if (completed.length > 0) {
        toast.success(
          `Successfully withdrew from ${completed.length} escrow${completed.length > 1 ? "s" : ""}!`
        );
      }
      if (failed.length > 0) {
        toast.error(
          `Failed to withdraw from ${failed.length} escrow${failed.length > 1 ? "s" : ""}`
        );
      }

      // Invalidate cache to refresh UI
      invalidateEscrows(3000);
    }
  }, [
    batchWithdraw.status,
    batchWithdraw.isActive,
    batchWithdraw.completed.length,
    batchWithdraw.failed.length,
    invalidateEscrows,
  ]);

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

  // Get escrows ready for batch withdrawal (completed with crypto preference)
  const batchReadyEscrows = React.useMemo(() => {
    return pendingWithdrawals.filter(
      (info) =>
        info.status === EscrowStatus.Completed && info.hostPreference === PaymentPreference.CRYPTO
    );
  }, [pendingWithdrawals]);

  // Start batch withdrawal
  const handleStartBatchWithdraw = () => {
    if (batchReadyEscrows.length === 0) return;

    setBatchWithdraw({
      isActive: true,
      escrows: batchReadyEscrows,
      currentIndex: 0,
      completed: [],
      failed: [],
      status: "idle",
    });
    setBatchModalOpen(true);
  };

  // Cancel batch withdrawal
  const handleCancelBatchWithdraw = () => {
    setBatchWithdraw({
      isActive: false,
      escrows: [],
      currentIndex: 0,
      completed: [],
      failed: [],
      status: "cancelled",
    });
    setBatchModalOpen(false);
    resetBatchWithdraw();
  };

  // Close batch modal (after completion)
  const handleCloseBatchModal = () => {
    setBatchWithdraw({
      isActive: false,
      escrows: [],
      currentIndex: 0,
      completed: [],
      failed: [],
      status: "idle",
    });
    setBatchModalOpen(false);
  };

  // Calculate total amount for batch withdrawal
  const batchTotalAmount = React.useMemo(() => {
    return batchReadyEscrows.reduce((total, info) => {
      const hostAmount =
        info.amount && info.platformFee ? info.amount - info.platformFee : BigInt(0);
      return total + hostAmount;
    }, BigInt(0));
  }, [batchReadyEscrows]);

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
            {batchReadyEscrows.length > 1 && (
              <Button
                onClick={handleStartBatchWithdraw}
                className="bg-green-600 hover:bg-green-700"
              >
                <Layers className="mr-2 h-4 w-4" />
                Withdraw All ({batchReadyEscrows.length})
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
      {withdrawnEscrows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Withdrawal History
            </CardTitle>
            <CardDescription>
              Past withdrawals from completed bookings ({withdrawnEscrows.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search by booking # or property..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Property Filter */}
              {uniquePropertyNames.length > 1 && (
                <Select value={historyPropertyFilter} onValueChange={setHistoryPropertyFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {uniquePropertyNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Currency Filter */}
              <Select value={historyCurrencyFilter} onValueChange={setHistoryCurrencyFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="EURC">EURC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            {(historySearch ||
              historyPropertyFilter !== "all" ||
              historyCurrencyFilter !== "all") && (
              <p className="text-muted-foreground text-sm">
                Showing {filteredWithdrawalHistory.length} of {withdrawnEscrows.length} withdrawals
              </p>
            )}

            {/* List */}
            <div className="space-y-3">
              {paginatedHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Search className="text-muted-foreground mb-4 h-8 w-8" />
                  <p className="text-muted-foreground text-center">
                    No withdrawals match your filters
                  </p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setHistorySearch("");
                      setHistoryPropertyFilter("all");
                      setHistoryCurrencyFilter("all");
                    }}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                paginatedHistory.map((info) => {
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
                })
              )}
            </div>

            {/* Pagination */}
            {totalHistoryPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-muted-foreground text-sm">
                  Page {historyPage} of {totalHistoryPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                    disabled={historyPage === totalHistoryPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Batch Withdrawal Modal */}
      <Dialog
        open={batchModalOpen}
        onOpenChange={(open) => !open && batchWithdraw.status === "done" && handleCloseBatchModal()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Batch Withdrawal
            </DialogTitle>
            <DialogDescription>
              {batchWithdraw.status === "done"
                ? "Batch withdrawal complete!"
                : `Withdrawing from ${batchWithdraw.escrows.length} escrow${batchWithdraw.escrows.length > 1 ? "s" : ""}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Total Amount */}
            <div className="rounded-lg bg-green-500/10 p-4 text-center">
              <p className="text-muted-foreground text-sm">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">
                ${Number(formatUnits(batchTotalAmount, 6)).toFixed(2)}
              </p>
            </div>

            {/* Progress */}
            {batchWithdraw.isActive && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {batchWithdraw.completed.length + batchWithdraw.failed.length} /{" "}
                    {batchWithdraw.escrows.length}
                  </span>
                </div>
                <Progress
                  value={
                    ((batchWithdraw.completed.length + batchWithdraw.failed.length) /
                      batchWithdraw.escrows.length) *
                    100
                  }
                  className="h-2"
                />
              </div>
            )}

            {/* Current Transaction */}
            {batchWithdraw.isActive &&
              batchWithdraw.status !== "done" &&
              batchWithdraw.currentIndex < batchWithdraw.escrows.length && (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    {(isBatchWithdrawPending || isBatchWithdrawLoading) && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {
                          getPropertyInfo(batchWithdraw.escrows[batchWithdraw.currentIndex].booking)
                            .name
                        }
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {isBatchWithdrawPending
                          ? "Waiting for confirmation..."
                          : "Processing transaction..."}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {batchWithdraw.currentIndex + 1} of {batchWithdraw.escrows.length}
                    </Badge>
                  </div>
                </div>
              )}

            {/* Completed List */}
            {(batchWithdraw.completed.length > 0 || batchWithdraw.failed.length > 0) && (
              <div className="max-h-[200px] space-y-2 overflow-y-auto">
                {batchWithdraw.escrows.map((escrow, index) => {
                  const isCompleted = batchWithdraw.completed.includes(escrow.escrowAddress);
                  const isFailed = batchWithdraw.failed.includes(escrow.escrowAddress);
                  const isPending =
                    index === batchWithdraw.currentIndex && !isCompleted && !isFailed;
                  const isWaiting = index > batchWithdraw.currentIndex;

                  if (isWaiting) return null;

                  const { name: propertyName } = getPropertyInfo(escrow.booking);
                  const hostAmount =
                    escrow.amount && escrow.platformFee
                      ? escrow.amount - escrow.platformFee
                      : BigInt(0);

                  return (
                    <div
                      key={escrow.escrowAddress}
                      className={`flex items-center justify-between rounded-lg p-2 text-sm ${
                        isCompleted
                          ? "bg-green-500/10"
                          : isFailed
                            ? "bg-red-500/10"
                            : "bg-blue-500/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {isFailed && <X className="h-4 w-4 text-red-500" />}
                        {isPending && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                        <span
                          className={
                            isCompleted ? "text-green-700" : isFailed ? "text-red-700" : ""
                          }
                        >
                          {propertyName}
                        </span>
                      </div>
                      <span
                        className={`font-medium ${isCompleted ? "text-green-600" : isFailed ? "text-red-600" : ""}`}
                      >
                        ${Number(formatUnits(hostAmount, 6)).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary when done */}
            {batchWithdraw.status === "done" && (
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {batchWithdraw.completed.length}
                  </p>
                  <p className="text-muted-foreground text-xs">Successful</p>
                </div>
                {batchWithdraw.failed.length > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{batchWithdraw.failed.length}</p>
                    <p className="text-muted-foreground text-xs">Failed</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {batchWithdraw.status === "done" ? (
                <Button onClick={handleCloseBatchModal} className="w-full">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Done
                </Button>
              ) : (
                <Button
                  onClick={handleCancelBatchWithdraw}
                  variant="outline"
                  className="w-full"
                  disabled={isBatchWithdrawLoading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>

            {/* Info */}
            {batchWithdraw.status !== "done" && (
              <p className="text-muted-foreground text-center text-xs">
                Please confirm each transaction in your wallet. Do not close this window.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
