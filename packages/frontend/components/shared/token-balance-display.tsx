"use client";

import * as React from "react";
import { Coins, RefreshCw, DollarSign, Euro } from "lucide-react";
import { useTokenBalances, formatTokenBalance } from "@/lib/hooks/useTokenBalances";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TokenBalanceDisplayProps {
  address: `0x${string}` | undefined;
  variant?: "compact" | "full" | "inline";
  showRefresh?: boolean;
  className?: string;
}

export function TokenBalanceDisplay({
  address,
  variant = "compact",
  showRefresh = false,
  className,
}: TokenBalanceDisplayProps) {
  const { usdc, eurc, isLoading, refetch } = useTokenBalances(address);

  // Don't render if no address or no balances configured
  if (!address) return null;
  if (!usdc && !eurc && !isLoading) return null;

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Skeleton className="h-6 w-20" />
      </div>
    );
  }

  // Inline variant - just shows balances in a row
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-3 text-sm", className)}>
        {usdc && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-green-600" />
            <span className="font-medium">{formatTokenBalance(usdc.formatted)}</span>
            <span className="text-muted-foreground text-xs">USDC</span>
          </div>
        )}
        {eurc && (
          <div className="flex items-center gap-1">
            <Euro className="h-3 w-3 text-blue-600" />
            <span className="font-medium">{formatTokenBalance(eurc.formatted)}</span>
            <span className="text-muted-foreground text-xs">EURC</span>
          </div>
        )}
      </div>
    );
  }

  // Compact variant - icon with tooltip
  if (variant === "compact") {
    const hasBalance =
      (usdc && parseFloat(usdc.formatted) > 0) || (eurc && parseFloat(eurc.formatted) > 0);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("relative", hasBalance && "text-green-600", className)}
            >
              <Coins className="h-4 w-4" />
              {hasBalance && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-3">
            <div className="space-y-2">
              <p className="text-muted-foreground mb-2 text-xs font-medium">Token Balances</p>
              {usdc && (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm">USDC</span>
                  </div>
                  <span className="font-mono font-medium">
                    {formatTokenBalance(usdc.formatted)}
                  </span>
                </div>
              )}
              {eurc && (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <Euro className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm">EURC</span>
                  </div>
                  <span className="font-mono font-medium">
                    {formatTokenBalance(eurc.formatted)}
                  </span>
                </div>
              )}
              {!usdc && !eurc && (
                <p className="text-muted-foreground text-sm">No stablecoins configured</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full variant - expanded card view
  return (
    <div className={cn("space-y-3 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">Stablecoin Balances</span>
        </div>
        {showRefresh && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {usdc && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">USDC</p>
                <p className="text-muted-foreground text-xs">USD Coin</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono font-medium">${formatTokenBalance(usdc.formatted)}</p>
            </div>
          </div>
        )}

        {eurc && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Euro className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">EURC</p>
                <p className="text-muted-foreground text-xs">Euro Coin</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono font-medium">€{formatTokenBalance(eurc.formatted)}</p>
            </div>
          </div>
        )}

        {!usdc && !eurc && (
          <p className="text-muted-foreground py-2 text-center text-sm">
            No stablecoins configured
          </p>
        )}
      </div>
    </div>
  );
}
