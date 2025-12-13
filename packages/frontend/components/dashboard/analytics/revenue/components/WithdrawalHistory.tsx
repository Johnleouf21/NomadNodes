"use client";

import { CheckCircle2, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatUnits } from "viem";
import type { EscrowInfo } from "../types";
import type { PonderBooking } from "@/hooks/usePonderBookings";

interface WithdrawalHistoryProps {
  withdrawnEscrows: EscrowInfo[];
  paginatedHistory: EscrowInfo[];
  filteredCount: number;
  totalHistoryPages: number;
  uniquePropertyNames: string[];
  historySearch: string;
  historyPropertyFilter: string;
  historyCurrencyFilter: string;
  historyPage: number;
  onSearchChange: (value: string) => void;
  onPropertyFilterChange: (value: string) => void;
  onCurrencyFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  getPropertyInfo: (booking: PonderBooking) => { name: string };
  getRoomTypeInfo: (booking: PonderBooking) => { currency: "USD" | "EUR" };
}

export function WithdrawalHistory({
  withdrawnEscrows,
  paginatedHistory,
  filteredCount,
  totalHistoryPages,
  uniquePropertyNames,
  historySearch,
  historyPropertyFilter,
  historyCurrencyFilter,
  historyPage,
  onSearchChange,
  onPropertyFilterChange,
  onCurrencyFilterChange,
  onPageChange,
  onClearFilters,
  getPropertyInfo,
  getRoomTypeInfo,
}: WithdrawalHistoryProps) {
  if (withdrawnEscrows.length === 0) return null;

  const hasFilters =
    historySearch || historyPropertyFilter !== "all" || historyCurrencyFilter !== "all";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Withdrawal History
        </CardTitle>
        <CardDescription>
          Past withdrawals from completed bookings ({withdrawnEscrows.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by booking # or property..."
              value={historySearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Property Filter */}
          {uniquePropertyNames.length > 1 && (
            <Select value={historyPropertyFilter} onValueChange={onPropertyFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {uniquePropertyNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Currency Filter */}
          <Select value={historyCurrencyFilter} onValueChange={onCurrencyFilterChange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              <SelectItem value="USDC">USDC</SelectItem>
              <SelectItem value="EURC">EURC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        {hasFilters && (
          <p className="text-muted-foreground text-sm">
            Showing {filteredCount} of {withdrawnEscrows.length} withdrawals
          </p>
        )}

        {/* List */}
        <div className="space-y-3">
          {paginatedHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Search className="text-muted-foreground mb-4 h-8 w-8" />
              <p className="text-muted-foreground text-center">No withdrawals match your filters</p>
              <Button variant="link" onClick={onClearFilters} className="mt-2">
                Clear filters
              </Button>
            </div>
          ) : (
            paginatedHistory.map((info) => {
              const { name: propertyName } = getPropertyInfo(info.booking);
              const { currency } = getRoomTypeInfo(info.booking);
              const currencyLabel = currency === "EUR" ? "EURC" : "USDC";
              const hostAmount =
                info.amount && info.platformFee ? info.amount - info.platformFee : BigInt(0);
              const formattedAmount = Number(formatUnits(hostAmount, 6)).toFixed(2);

              return (
                <div
                  key={info.escrowAddress}
                  className="flex items-center justify-between rounded-lg bg-green-500/5 p-3"
                >
                  <div>
                    <p className="font-medium">{propertyName}</p>
                    <p className="text-muted-foreground text-xs">
                      Booking #{info.booking.bookingIndex}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formattedAmount} {currencyLabel}
                    </p>
                    <Badge variant="outline" className="text-xs text-green-600">
                      Withdrawn
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalHistoryPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-muted-foreground text-sm">
              Page {historyPage} of {totalHistoryPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, historyPage - 1))}
                disabled={historyPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalHistoryPages, historyPage + 1))}
                disabled={historyPage === totalHistoryPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
