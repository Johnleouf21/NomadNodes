/**
 * Hook for fetching ERC20 token balances (USDC, EURC)
 */

import { useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

// Standard ERC20 ABI for balanceOf
const erc20BalanceOfAbi = [
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
] as const;

export interface TokenBalance {
  symbol: string;
  balance: bigint;
  formatted: string;
  decimals: number;
}

export interface TokenBalances {
  usdc: TokenBalance | null;
  eurc: TokenBalance | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useTokenBalances(address: `0x${string}` | undefined): TokenBalances {
  const usdcAddress = CONTRACT_ADDRESSES.usdc;
  const eurcAddress = CONTRACT_ADDRESSES.eurc;

  // Check if addresses are configured (not zero address)
  const isUsdcConfigured = usdcAddress !== "0x0000000000000000000000000000000000000000";
  const isEurcConfigured = eurcAddress !== "0x0000000000000000000000000000000000000000";

  const { data, isLoading, isError, refetch } = useReadContracts({
    contracts: [
      // USDC balance
      {
        address: usdcAddress,
        abi: erc20BalanceOfAbi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      // USDC decimals
      {
        address: usdcAddress,
        abi: erc20BalanceOfAbi,
        functionName: "decimals",
      },
      // EURC balance
      {
        address: eurcAddress,
        abi: erc20BalanceOfAbi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      // EURC decimals
      {
        address: eurcAddress,
        abi: erc20BalanceOfAbi,
        functionName: "decimals",
      },
    ],
    query: {
      enabled: !!address && (isUsdcConfigured || isEurcConfigured),
      staleTime: 60 * 1000, // Consider data fresh for 1 minute
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      refetchOnWindowFocus: false,
      // No automatic refetch - user can manually refresh or it updates on transactions
    },
  });

  // Parse results
  const usdcBalance = data?.[0]?.result as bigint | undefined;
  const usdcDecimals = (data?.[1]?.result as number | undefined) ?? 6;
  const eurcBalance = data?.[2]?.result as bigint | undefined;
  const eurcDecimals = (data?.[3]?.result as number | undefined) ?? 6;

  const usdc: TokenBalance | null =
    isUsdcConfigured && usdcBalance !== undefined
      ? {
          symbol: "USDC",
          balance: usdcBalance,
          formatted: formatUnits(usdcBalance, usdcDecimals),
          decimals: usdcDecimals,
        }
      : null;

  const eurc: TokenBalance | null =
    isEurcConfigured && eurcBalance !== undefined
      ? {
          symbol: "EURC",
          balance: eurcBalance,
          formatted: formatUnits(eurcBalance, eurcDecimals),
          decimals: eurcDecimals,
        }
      : null;

  return {
    usdc,
    eurc,
    isLoading,
    isError,
    refetch,
  };
}

/**
 * Format token balance for display
 * Shows 2 decimal places, or "< 0.01" for very small amounts
 */
export function formatTokenBalance(balance: string | undefined): string {
  if (!balance) return "0.00";

  const num = parseFloat(balance);
  if (num === 0) return "0.00";
  if (num < 0.01) return "< 0.01";
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toFixed(2);
}
