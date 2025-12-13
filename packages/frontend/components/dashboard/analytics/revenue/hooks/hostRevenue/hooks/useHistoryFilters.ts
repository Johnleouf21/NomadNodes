"use client";

/**
 * Hook to manage withdrawal history filters
 */

import * as React from "react";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { EscrowInfo } from "../../../types";
import { ITEMS_PER_PAGE } from "../../../constants";

interface UseHistoryFiltersProps {
  withdrawnEscrows: EscrowInfo[];
  getPropertyInfo: (booking: PonderBooking) => { name: string; imageUrl?: string };
  getRoomTypeInfo: (booking: PonderBooking) => { name: string; currency: "USD" | "EUR" };
}

interface UseHistoryFiltersReturn {
  // Filter state
  historySearch: string;
  setHistorySearch: (search: string) => void;
  historyPropertyFilter: string;
  setHistoryPropertyFilter: (filter: string) => void;
  historyCurrencyFilter: string;
  setHistoryCurrencyFilter: (filter: string) => void;
  historyPage: number;
  setHistoryPage: (page: number) => void;
  clearHistoryFilters: () => void;

  // Computed values
  uniquePropertyNames: string[];
  filteredWithdrawalHistory: EscrowInfo[];
  paginatedHistory: EscrowInfo[];
  totalHistoryPages: number;
}

/**
 * Manage withdrawal history filters and pagination
 */
export function useHistoryFilters({
  withdrawnEscrows,
  getPropertyInfo,
  getRoomTypeInfo,
}: UseHistoryFiltersProps): UseHistoryFiltersReturn {
  // Filter state
  const [historySearch, setHistorySearch] = React.useState("");
  const [historyPropertyFilter, setHistoryPropertyFilter] = React.useState<string>("all");
  const [historyCurrencyFilter, setHistoryCurrencyFilter] = React.useState<string>("all");
  const [historyPage, setHistoryPage] = React.useState(1);

  // Get unique property names for filter dropdown
  const uniquePropertyNames = React.useMemo(() => {
    const names = new Set<string>();
    withdrawnEscrows.forEach((info) => {
      const { name } = getPropertyInfo(info.booking);
      names.add(name);
    });
    return Array.from(names).sort();
  }, [withdrawnEscrows, getPropertyInfo]);

  // Filter withdrawal history
  const filteredWithdrawalHistory = React.useMemo(() => {
    let filtered = withdrawnEscrows;

    if (historySearch) {
      const searchLower = historySearch.toLowerCase();
      filtered = filtered.filter(
        (info) =>
          info.booking.bookingIndex.toString().includes(searchLower) ||
          getPropertyInfo(info.booking).name.toLowerCase().includes(searchLower)
      );
    }

    if (historyPropertyFilter !== "all") {
      filtered = filtered.filter((info) => {
        const { name } = getPropertyInfo(info.booking);
        return name === historyPropertyFilter;
      });
    }

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

  const clearHistoryFilters = React.useCallback(() => {
    setHistorySearch("");
    setHistoryPropertyFilter("all");
    setHistoryCurrencyFilter("all");
  }, []);

  return {
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
  };
}
