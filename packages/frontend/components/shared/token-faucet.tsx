"use client";

import * as React from "react";
import { Droplets, DollarSign, Euro, Loader2, RefreshCw } from "lucide-react";
import { useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { cn } from "@/lib/utils";

// MockERC20 ABI for faucet functionality
const mockERC20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "canClaim",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "FAUCET_AMOUNT",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface TokenFaucetProps {
  address: `0x${string}` | undefined;
  variant?: "compact" | "full";
  className?: string;
}

interface TokenInfo {
  symbol: string;
  balance: bigint;
  formatted: string;
  decimals: number;
  canClaim: boolean;
  contractAddress: `0x${string}`;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

function formatBalance(balance: string | undefined): string {
  if (!balance) return "0.00";
  const num = parseFloat(balance);
  if (num === 0) return "0.00";
  if (num < 0.01) return "< 0.01";
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toFixed(2);
}

export function TokenFaucet({ address, variant = "compact", className }: TokenFaucetProps) {
  const [claimingToken, setClaimingToken] = React.useState<string | null>(null);

  const usdcAddress = CONTRACT_ADDRESSES.usdc;
  const eurcAddress = CONTRACT_ADDRESSES.eurc;

  // Check if addresses are configured
  const isUsdcConfigured = usdcAddress !== "0x0000000000000000000000000000000000000000";
  const isEurcConfigured = eurcAddress !== "0x0000000000000000000000000000000000000000";

  // Read all token data
  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      // USDC balance
      {
        address: usdcAddress,
        abi: mockERC20Abi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      // USDC decimals
      { address: usdcAddress, abi: mockERC20Abi, functionName: "decimals" },
      // USDC canClaim
      {
        address: usdcAddress,
        abi: mockERC20Abi,
        functionName: "canClaim",
        args: address ? [address] : undefined,
      },
      // EURC balance
      {
        address: eurcAddress,
        abi: mockERC20Abi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      // EURC decimals
      { address: eurcAddress, abi: mockERC20Abi, functionName: "decimals" },
      // EURC canClaim
      {
        address: eurcAddress,
        abi: mockERC20Abi,
        functionName: "canClaim",
        args: address ? [address] : undefined,
      },
    ],
    query: {
      enabled: !!address && (isUsdcConfigured || isEurcConfigured),
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    },
  });

  // Write contract for faucet
  const { writeContract, data: txHash, isPending: isWritePending, reset } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Refetch after successful claim
  React.useEffect(() => {
    if (isConfirmed) {
      refetch();
      setClaimingToken(null);
      reset();
    }
  }, [isConfirmed, refetch, reset]);

  // Parse results
  const usdcBalance = data?.[0]?.result as bigint | undefined;
  const usdcDecimals = (data?.[1]?.result as number | undefined) ?? 6;
  const usdcCanClaim = (data?.[2]?.result as boolean | undefined) ?? false;
  const eurcBalance = data?.[3]?.result as bigint | undefined;
  const eurcDecimals = (data?.[4]?.result as number | undefined) ?? 6;
  const eurcCanClaim = (data?.[5]?.result as boolean | undefined) ?? false;

  // Build token info
  const tokens: TokenInfo[] = [];

  if (isUsdcConfigured && usdcBalance !== undefined) {
    tokens.push({
      symbol: "USDC",
      balance: usdcBalance,
      formatted: formatUnits(usdcBalance, usdcDecimals),
      decimals: usdcDecimals,
      canClaim: usdcCanClaim,
      contractAddress: usdcAddress,
      icon: <DollarSign className="h-4 w-4" />,
      colorClass: "text-green-600 dark:text-green-400",
      bgClass: "bg-green-100 dark:bg-green-900",
    });
  }

  if (isEurcConfigured && eurcBalance !== undefined) {
    tokens.push({
      symbol: "EURC",
      balance: eurcBalance,
      formatted: formatUnits(eurcBalance, eurcDecimals),
      decimals: eurcDecimals,
      canClaim: eurcCanClaim,
      contractAddress: eurcAddress,
      icon: <Euro className="h-4 w-4" />,
      colorClass: "text-blue-600 dark:text-blue-400",
      bgClass: "bg-blue-100 dark:bg-blue-900",
    });
  }

  // Don't render if no address or no tokens configured
  if (!address) return null;
  if (tokens.length === 0 && !isLoading) return null;

  const handleClaim = (token: TokenInfo) => {
    setClaimingToken(token.symbol);
    writeContract({
      address: token.contractAddress,
      abi: mockERC20Abi,
      functionName: "faucet",
    });
  };

  const anyCanClaim = tokens.some((t) => t.canClaim);
  const isClaiming = isWritePending || isConfirming;

  // Shared content for both variants
  const renderTokenList = () => (
    <div className="space-y-3">
      {tokens.map((token) => (
        <div key={token.symbol} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  token.bgClass
                )}
              >
                <span className={token.colorClass}>{token.icon}</span>
              </div>
              <div>
                <p className="font-medium">{token.symbol}</p>
                <p className="text-muted-foreground text-xs">
                  Balance: {formatBalance(token.formatted)}
                </p>
              </div>
            </div>
          </div>

          {token.canClaim ? (
            <Button
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => handleClaim(token)}
              disabled={isClaiming}
            >
              {isClaiming && claimingToken === token.symbol ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  {isConfirming ? "Confirming..." : "Claiming..."}
                </>
              ) : (
                <>
                  <Droplets className="mr-2 h-3 w-3" />
                  Claim 10,000 {token.symbol}
                </>
              )}
            </Button>
          ) : (
            <p className="text-muted-foreground py-1 text-center text-xs">
              Already claimed from faucet
            </p>
          )}
        </div>
      ))}

      {tokens.length === 0 && (
        <p className="text-muted-foreground py-2 text-center text-sm">No mock tokens configured</p>
      )}
    </div>
  );

  // Full variant - card view for mobile
  if (variant === "full") {
    // Don't show if no tokens can be claimed
    if (!anyCanClaim && tokens.length > 0) return null;

    return (
      <div className={cn("space-y-3 rounded-lg border p-3", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Token Faucet</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
        ) : (
          renderTokenList()
        )}

        <p className="text-muted-foreground text-center text-xs">
          Test tokens for MVP - claim once per wallet
        </p>
      </div>
    );
  }

  // Compact variant - popover button for desktop
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", anyCanClaim && "text-purple-600", className)}
        >
          <Droplets className="h-4 w-4" />
          {anyCanClaim && (
            <span className="absolute -top-1 -right-1 h-2 w-2 animate-pulse rounded-full bg-purple-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-72 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Token Faucet</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          ) : (
            renderTokenList()
          )}

          <p className="text-muted-foreground text-center text-xs">
            Test tokens for MVP - claim once per wallet
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
