"use client";

/**
 * Main useHostRevenue hook
 * Composes all sub-hooks for host revenue management
 */

import { useEscrowReads } from "./hooks/useEscrowReads";
import { useHistoryFilters } from "./hooks/useHistoryFilters";
import { useWithdrawMutations } from "./hooks/useWithdrawMutations";
import { useBatchWithdraw } from "./hooks/useBatchWithdraw";
import type { UseHostRevenueOptions, UseHostRevenueReturn } from "./types";

/**
 * Main hook for host revenue management
 */
export function useHostRevenue({
  bookings,
  getPropertyInfo,
  getRoomTypeInfo,
}: UseHostRevenueOptions): UseHostRevenueReturn {
  // Read escrow contract data
  const { pendingWithdrawals, withdrawnEscrows, totals, batchReadyEscrows, loadingEscrows } =
    useEscrowReads(bookings);

  // History filters
  const {
    historySearch,
    setHistorySearch,
    historyPropertyFilter,
    setHistoryPropertyFilter,
    historyCurrencyFilter,
    setHistoryCurrencyFilter,
    historyPage,
    setHistoryPage,
    clearHistoryFilters,
    uniquePropertyNames,
    filteredWithdrawalHistory,
    paginatedHistory,
    totalHistoryPages,
  } = useHistoryFilters({
    withdrawnEscrows,
    getPropertyInfo,
    getRoomTypeInfo,
  });

  // Withdrawal mutations
  const {
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
  } = useWithdrawMutations();

  // Batch withdrawal
  const {
    batchWithdraw,
    batchModalOpen,
    setBatchModalOpen,
    isBatchWithdrawPending,
    isBatchWithdrawLoading,
    batchTotalAmount,
    handleStartBatchWithdraw,
    handleCancelBatchWithdraw,
    handleCloseBatchModal,
  } = useBatchWithdraw(batchReadyEscrows);

  return {
    // Loading
    loadingEscrows,

    // Data
    totals,
    pendingWithdrawals,
    withdrawnEscrows,
    uniquePropertyNames,
    filteredWithdrawalHistory,
    paginatedHistory,
    totalHistoryPages,
    batchReadyEscrows,
    batchTotalAmount,

    // History filters
    historySearch,
    setHistorySearch,
    historyPropertyFilter,
    setHistoryPropertyFilter,
    historyCurrencyFilter,
    setHistoryCurrencyFilter,
    historyPage,
    setHistoryPage,
    clearHistoryFilters,

    // Batch withdrawal
    batchWithdraw,
    batchModalOpen,
    setBatchModalOpen,
    isBatchWithdrawPending,
    isBatchWithdrawLoading,

    // Single withdrawal states
    withdrawingEscrow,
    releasingEscrow,
    isWithdrawPending,
    isWithdrawLoading,
    isReleasePending,
    isReleaseLoading,
    isPrefPending,
    isPrefLoading,

    // Handlers
    handleWithdraw,
    handleRelease,
    handleSetPreference,
    handleStartBatchWithdraw,
    handleCancelBatchWithdraw,
    handleCloseBatchModal,

    // Utils
    getPropertyInfo,
    getRoomTypeInfo,
  };
}
