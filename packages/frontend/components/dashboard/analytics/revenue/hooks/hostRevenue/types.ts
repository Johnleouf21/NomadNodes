/**
 * Types for useHostRevenue hook
 */

import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { EscrowInfo, BatchWithdrawState, RevenueTotals } from "../../types";

/**
 * Options for useHostRevenue hook
 */
export interface UseHostRevenueOptions {
  bookings: PonderBooking[];
  getPropertyInfo: (booking: PonderBooking) => { name: string; imageUrl?: string };
  getRoomTypeInfo: (booking: PonderBooking) => { name: string; currency: "USD" | "EUR" };
}

/**
 * History filter state
 */
export interface HistoryFilterState {
  historySearch: string;
  historyPropertyFilter: string;
  historyCurrencyFilter: string;
  historyPage: number;
}

/**
 * Return type for useHostRevenue
 */
export interface UseHostRevenueReturn {
  // Loading
  loadingEscrows: boolean;

  // Data
  totals: RevenueTotals;
  pendingWithdrawals: EscrowInfo[];
  withdrawnEscrows: EscrowInfo[];
  uniquePropertyNames: string[];
  filteredWithdrawalHistory: EscrowInfo[];
  paginatedHistory: EscrowInfo[];
  totalHistoryPages: number;
  batchReadyEscrows: EscrowInfo[];
  batchTotalAmount: bigint;

  // History filters
  historySearch: string;
  setHistorySearch: (search: string) => void;
  historyPropertyFilter: string;
  setHistoryPropertyFilter: (filter: string) => void;
  historyCurrencyFilter: string;
  setHistoryCurrencyFilter: (filter: string) => void;
  historyPage: number;
  setHistoryPage: (page: number) => void;
  clearHistoryFilters: () => void;

  // Batch withdrawal
  batchWithdraw: BatchWithdrawState;
  batchModalOpen: boolean;
  setBatchModalOpen: (open: boolean) => void;
  isBatchWithdrawPending: boolean;
  isBatchWithdrawLoading: boolean;

  // Single withdrawal states
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
  handleStartBatchWithdraw: () => void;
  handleCancelBatchWithdraw: () => void;
  handleCloseBatchModal: () => void;

  // Utils
  getPropertyInfo: (booking: PonderBooking) => { name: string; imageUrl?: string };
  getRoomTypeInfo: (booking: PonderBooking) => { name: string; currency: "USD" | "EUR" };
}

// Re-export types
export type { EscrowInfo, BatchWithdrawState, RevenueTotals };
