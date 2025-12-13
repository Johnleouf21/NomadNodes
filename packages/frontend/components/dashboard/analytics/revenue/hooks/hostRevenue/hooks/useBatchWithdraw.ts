"use client";

/**
 * Hook to manage batch withdrawal
 */

import * as React from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { useInvalidateQueries } from "@/hooks/useInvalidateQueries";
import { ESCROW_ABI } from "../../../constants";
import type { EscrowInfo, BatchWithdrawState } from "../../../types";

interface UseBatchWithdrawReturn {
  batchWithdraw: BatchWithdrawState;
  batchModalOpen: boolean;
  setBatchModalOpen: (open: boolean) => void;
  isBatchWithdrawPending: boolean;
  isBatchWithdrawLoading: boolean;
  batchTotalAmount: bigint;
  handleStartBatchWithdraw: () => void;
  handleCancelBatchWithdraw: () => void;
  handleCloseBatchModal: () => void;
}

const INITIAL_BATCH_STATE: BatchWithdrawState = {
  isActive: false,
  escrows: [],
  currentIndex: 0,
  completed: [],
  failed: [],
  status: "idle",
};

/**
 * Manage batch withdrawal process
 */
export function useBatchWithdraw(batchReadyEscrows: EscrowInfo[]): UseBatchWithdrawReturn {
  const { invalidateEscrows } = useInvalidateQueries();

  const [batchWithdraw, setBatchWithdraw] = React.useState<BatchWithdrawState>(INITIAL_BATCH_STATE);
  const [batchModalOpen, setBatchModalOpen] = React.useState(false);

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
  } = useWaitForTransactionReceipt({ hash: batchWithdrawHash });

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

      invalidateEscrows(3000);
    }
  }, [
    batchWithdraw.status,
    batchWithdraw.isActive,
    batchWithdraw.completed.length,
    batchWithdraw.failed.length,
    invalidateEscrows,
  ]);

  // Calculate total amount for batch withdrawal
  const batchTotalAmount = React.useMemo(() => {
    return batchReadyEscrows.reduce((total, info) => {
      const hostAmount =
        info.amount && info.platformFee ? info.amount - info.platformFee : BigInt(0);
      return total + hostAmount;
    }, BigInt(0));
  }, [batchReadyEscrows]);

  // Handlers
  const handleStartBatchWithdraw = React.useCallback(() => {
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
  }, [batchReadyEscrows]);

  const handleCancelBatchWithdraw = React.useCallback(() => {
    setBatchWithdraw({
      ...INITIAL_BATCH_STATE,
      status: "cancelled",
    });
    setBatchModalOpen(false);
    resetBatchWithdraw();
  }, [resetBatchWithdraw]);

  const handleCloseBatchModal = React.useCallback(() => {
    setBatchWithdraw(INITIAL_BATCH_STATE);
    setBatchModalOpen(false);
  }, []);

  return {
    batchWithdraw,
    batchModalOpen,
    setBatchModalOpen,
    isBatchWithdrawPending,
    isBatchWithdrawLoading,
    batchTotalAmount,
    handleStartBatchWithdraw,
    handleCancelBatchWithdraw,
    handleCloseBatchModal,
  };
}
