"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useHostRevenue } from "./hooks/useHostRevenue";
import { RevenueSummaryCards } from "./components/RevenueSummaryCards";
import { PendingWithdrawalsList } from "./components/PendingWithdrawalsList";
import { WithdrawalHistory } from "./components/WithdrawalHistory";
import { BatchWithdrawalModal } from "./components/BatchWithdrawalModal";
import type { HostRevenueProps } from "./types";

export function HostRevenue({ bookings, getPropertyInfo, getRoomTypeInfo }: HostRevenueProps) {
  const revenue = useHostRevenue({ bookings, getPropertyInfo, getRoomTypeInfo });

  if (revenue.loadingEscrows) {
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
      <RevenueSummaryCards
        totals={revenue.totals}
        pendingCount={revenue.pendingWithdrawals.length}
      />

      {/* Pending Withdrawals List */}
      <PendingWithdrawalsList
        pendingWithdrawals={revenue.pendingWithdrawals}
        batchReadyCount={revenue.batchReadyEscrows.length}
        getPropertyInfo={getPropertyInfo}
        getRoomTypeInfo={getRoomTypeInfo}
        onWithdraw={revenue.handleWithdraw}
        onRelease={revenue.handleRelease}
        onSetPreference={revenue.handleSetPreference}
        onStartBatchWithdraw={revenue.handleStartBatchWithdraw}
        withdrawingEscrow={revenue.withdrawingEscrow}
        releasingEscrow={revenue.releasingEscrow}
        isWithdrawPending={revenue.isWithdrawPending}
        isWithdrawLoading={revenue.isWithdrawLoading}
        isReleasePending={revenue.isReleasePending}
        isReleaseLoading={revenue.isReleaseLoading}
        isPrefPending={revenue.isPrefPending}
        isPrefLoading={revenue.isPrefLoading}
      />

      {/* Withdrawal History */}
      <WithdrawalHistory
        withdrawnEscrows={revenue.withdrawnEscrows}
        paginatedHistory={revenue.paginatedHistory}
        filteredCount={revenue.filteredWithdrawalHistory.length}
        totalHistoryPages={revenue.totalHistoryPages}
        uniquePropertyNames={revenue.uniquePropertyNames}
        historySearch={revenue.historySearch}
        historyPropertyFilter={revenue.historyPropertyFilter}
        historyCurrencyFilter={revenue.historyCurrencyFilter}
        historyPage={revenue.historyPage}
        onSearchChange={revenue.setHistorySearch}
        onPropertyFilterChange={revenue.setHistoryPropertyFilter}
        onCurrencyFilterChange={revenue.setHistoryCurrencyFilter}
        onPageChange={revenue.setHistoryPage}
        onClearFilters={revenue.clearHistoryFilters}
        getPropertyInfo={getPropertyInfo}
        getRoomTypeInfo={getRoomTypeInfo}
      />

      {/* Batch Withdrawal Modal */}
      <BatchWithdrawalModal
        open={revenue.batchModalOpen}
        onOpenChange={revenue.setBatchModalOpen}
        batchWithdraw={revenue.batchWithdraw}
        batchTotalAmount={revenue.batchTotalAmount}
        isBatchWithdrawPending={revenue.isBatchWithdrawPending}
        isBatchWithdrawLoading={revenue.isBatchWithdrawLoading}
        onCancel={revenue.handleCancelBatchWithdraw}
        onClose={revenue.handleCloseBatchModal}
        getPropertyInfo={getPropertyInfo}
      />
    </div>
  );
}
