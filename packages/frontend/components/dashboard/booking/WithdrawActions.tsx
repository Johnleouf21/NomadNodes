"use client";

import * as React from "react";
import { Wallet, Loader2, CheckCircle2, Banknote, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import { toast } from "sonner";
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
] as const;

const ERC20_ABI = [
  {
    inputs: [{ type: "address", name: "account" }],
    name: "balanceOf",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ type: "string", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// PaymentPreference enum: 0 = CRYPTO, 1 = FIAT
enum PaymentPreference {
  CRYPTO = 0,
  FIAT = 1,
}

interface WithdrawActionsProps {
  escrowAddress: string;
  onSuccess?: () => void;
}

export function WithdrawActions({ escrowAddress, onSuccess }: WithdrawActionsProps) {
  const { invalidateEscrows } = useInvalidateQueries();

  // Read escrow data
  const { data: escrowStatus } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "status",
  });

  const { data: isWithdrawn } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "withdrawn",
  });

  const { data: hostPreference } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "hostPreference",
  });

  const { data: amount } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "amount",
  });

  const { data: platformFee } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "platformFee",
  });

  const { data: tokenAddress } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "token",
  });

  // Get token symbol
  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { enabled: !!tokenAddress },
  });

  // Get escrow balance
  const { data: escrowBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [escrowAddress as `0x${string}`],
    query: { enabled: !!tokenAddress },
  });

  // Set preference mutation
  const {
    writeContract: setPreference,
    data: prefHash,
    isPending: isPrefPending,
  } = useWriteContract();
  const { isLoading: isPrefLoading, isSuccess: isPrefSuccess } = useWaitForTransactionReceipt({
    hash: prefHash,
  });

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

  // Calculate host amount
  const hostAmount = amount && platformFee ? amount - platformFee : BigInt(0);
  const formattedAmount = hostAmount ? formatUnits(hostAmount, 6) : "0";
  const formattedBalance = escrowBalance ? formatUnits(escrowBalance, 6) : "0";

  // Status: 1 = Completed
  const isCompleted = escrowStatus === 1;
  const canWithdraw = isCompleted && !isWithdrawn && hostPreference === PaymentPreference.CRYPTO;
  const hasFunds = escrowBalance && escrowBalance > BigInt(0);

  // Success effects with cache invalidation
  React.useEffect(() => {
    if (isPrefSuccess) {
      toast.success("Payment preference set to crypto!");
      // Invalidate cache to refresh UI
      invalidateEscrows(2000);
    }
  }, [isPrefSuccess, invalidateEscrows]);

  React.useEffect(() => {
    if (isWithdrawSuccess) {
      toast.success("Funds withdrawn successfully!");
      onSuccess?.();
      // Invalidate cache to refresh UI
      invalidateEscrows(3000);
    }
  }, [isWithdrawSuccess, onSuccess, invalidateEscrows]);

  const handleSetCryptoPreference = () => {
    setPreference({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "setPaymentPreference",
      args: [PaymentPreference.CRYPTO],
    });
  };

  const handleWithdraw = () => {
    withdraw({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "withdrawCrypto",
    });
  };

  // Don't show if not completed or already withdrawn
  if (!isCompleted || isWithdrawn || !hasFunds) {
    return null;
  }

  return (
    <Card className="border-green-500/20 bg-green-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-green-600" />
          Withdraw Payment
        </CardTitle>
        <CardDescription>Your payment is ready to be withdrawn</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="rounded-lg bg-white/50 p-4 dark:bg-black/20">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Available to withdraw</span>
            <Badge variant="outline" className="text-green-600">
              Ready
            </Badge>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-600">
              {Number(formattedAmount).toFixed(2)}
            </span>
            <span className="text-muted-foreground text-lg">{tokenSymbol || "USDC"}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Escrow balance: {Number(formattedBalance).toFixed(2)} {tokenSymbol || "USDC"}
          </p>
        </div>

        {/* Preference Selection or Withdraw */}
        {hostPreference !== PaymentPreference.CRYPTO ? (
          <div className="space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Set your payment preference to crypto to withdraw directly to your wallet.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleSetCryptoPreference}
                disabled={isPrefPending || isPrefLoading}
                className="w-full"
                variant="default"
              >
                {isPrefPending || isPrefLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Crypto (Wallet)
                  </>
                )}
              </Button>
              <Button variant="outline" disabled className="w-full">
                <Banknote className="mr-2 h-4 w-4" />
                Fiat (Coming Soon)
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleWithdraw}
            disabled={!canWithdraw || isWithdrawPending || isWithdrawLoading}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isWithdrawPending || isWithdrawLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Withdrawing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Withdraw to Wallet
              </>
            )}
          </Button>
        )}

        {/* Info */}
        <p className="text-muted-foreground text-center text-xs">
          Funds will be sent directly to your connected wallet
        </p>
      </CardContent>
    </Card>
  );
}
