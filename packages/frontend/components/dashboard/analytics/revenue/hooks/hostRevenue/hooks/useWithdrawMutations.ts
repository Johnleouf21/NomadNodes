"use client";

/**
 * Hook to manage withdrawal mutations
 */

import * as React from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { useInvalidateQueries } from "@/hooks/useInvalidateQueries";
import { ESCROW_ABI, PaymentPreference } from "../../../constants";

interface UseWithdrawMutationsReturn {
  // Single withdrawal
  withdrawingEscrow: string | null;
  releasingEscrow: string | null;
  isWithdrawPending: boolean;
  isWithdrawLoading: boolean;
  isReleasePending: boolean;
  isReleaseLoading: boolean;
  isPrefPending: boolean;
  isPrefLoading: boolean;

  // Handlers
  handleWithdraw: (escrowAddress: string) => void;
  handleRelease: (escrowAddress: string) => void;
  handleSetPreference: (escrowAddress: string) => void;
}

/**
 * Manage single withdrawal mutations
 */
export function useWithdrawMutations(): UseWithdrawMutationsReturn {
  const [withdrawingEscrow, setWithdrawingEscrow] = React.useState<string | null>(null);
  const [releasingEscrow, setReleasingEscrow] = React.useState<string | null>(null);
  const { invalidateEscrows } = useInvalidateQueries();

  // Withdraw mutation
  const {
    writeContract: withdraw,
    data: withdrawHash,
    isPending: isWithdrawPending,
  } = useWriteContract();
  const { isLoading: isWithdrawLoading, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawHash });

  // Release mutation
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

  // Success effects
  React.useEffect(() => {
    if (isWithdrawSuccess) {
      toast.success("Funds withdrawn successfully!");
      setWithdrawingEscrow(null);
      invalidateEscrows(3000);
    }
  }, [isWithdrawSuccess, invalidateEscrows]);

  React.useEffect(() => {
    if (isReleaseSuccess) {
      toast.success("Funds released! You can now withdraw.");
      setReleasingEscrow(null);
      invalidateEscrows(3000);
    }
  }, [isReleaseSuccess, invalidateEscrows]);

  React.useEffect(() => {
    if (isPrefSuccess) {
      toast.success("Payment preference set to crypto!");
      invalidateEscrows(2000);
    }
  }, [isPrefSuccess, invalidateEscrows]);

  // Handlers
  const handleWithdraw = React.useCallback(
    (escrowAddress: string) => {
      setWithdrawingEscrow(escrowAddress);
      withdraw({
        address: escrowAddress as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "withdrawCrypto",
      });
    },
    [withdraw]
  );

  const handleRelease = React.useCallback(
    (escrowAddress: string) => {
      setReleasingEscrow(escrowAddress);
      release({
        address: escrowAddress as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "autoReleaseToHost",
      });
    },
    [release]
  );

  const handleSetPreference = React.useCallback(
    (escrowAddress: string) => {
      setPreference({
        address: escrowAddress as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "setPaymentPreference",
        args: [PaymentPreference.CRYPTO],
      });
    },
    [setPreference]
  );

  return {
    withdrawingEscrow,
    releasingEscrow,
    isWithdrawPending,
    isWithdrawLoading,
    isReleasePending,
    isReleaseLoading,
    isPrefPending,
    isPrefLoading,
    handleWithdraw,
    handleRelease,
    handleSetPreference,
  };
}
