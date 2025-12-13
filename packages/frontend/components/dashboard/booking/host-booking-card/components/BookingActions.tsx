"use client";

/**
 * Booking action buttons
 */

import {
  CheckCircle2,
  XCircle,
  Clock,
  LogIn,
  Loader2,
  MoreHorizontal,
  Eye,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate, copyToClipboard } from "../utils";

interface BookingActionsProps {
  bookingId: string;
  bookingStatus: string;
  checkInDate: string;
  checkOutDate: string;
  traveler: string;
  escrowAddress?: string | null;
  canConfirm: boolean;
  canCheckIn: boolean;
  canComplete: boolean;
  canCancel: boolean;
  showCheckInDisabled: boolean;
  showCompleteDisabled: boolean;
  isActionPending: boolean;
  onViewDetails: () => void;
  onConfirm?: () => void;
  onCheckIn?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * Primary and secondary action buttons
 */
export function BookingActions({
  bookingId,
  bookingStatus,
  checkInDate,
  checkOutDate,
  traveler,
  escrowAddress,
  canConfirm,
  canCheckIn,
  canComplete,
  canCancel,
  showCheckInDisabled,
  showCompleteDisabled,
  isActionPending,
  onViewDetails,
  onConfirm,
  onCheckIn,
  onComplete,
  onCancel,
}: BookingActionsProps) {
  return (
    <div className="mt-auto flex items-center justify-between border-t pt-3">
      {/* Primary Action */}
      <div className="flex items-center gap-2">
        {canConfirm && onConfirm && (
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isActionPending}
            className="gap-1.5 bg-[#0F4C5C] hover:bg-[#0F4C5C]/90"
          >
            {isActionPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirm
          </Button>
        )}
        {canCheckIn && onCheckIn && (
          <Button
            size="sm"
            onClick={onCheckIn}
            disabled={isActionPending}
            className="gap-1.5 bg-[#E36414] hover:bg-[#E36414]/90"
          >
            {isActionPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Check-in
          </Button>
        )}
        {showCheckInDisabled && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" disabled className="gap-1.5">
                  <Clock className="h-4 w-4" />
                  Check-in
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Available after 23:59 UTC on {formatDate(checkInDate)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {canComplete && onComplete && (
          <Button
            size="sm"
            onClick={onComplete}
            disabled={isActionPending}
            className="gap-1.5 bg-[#81B29A] hover:bg-[#81B29A]/90"
          >
            {isActionPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Complete
          </Button>
        )}
        {showCompleteDisabled && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" disabled className="gap-1.5">
                  <Clock className="h-4 w-4" />
                  Complete
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Available after {formatDate(checkOutDate)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {bookingStatus === "Completed" && (
          <Badge variant="outline" className="text-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        )}
        {bookingStatus === "Cancelled" && (
          <Badge variant="outline" className="text-red-600">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        )}
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onViewDetails} className="gap-1.5">
          <Eye className="h-4 w-4" />
          Details
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onViewDetails}>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyToClipboard(bookingId, "Booking ID")}>
              <Copy className="mr-2 h-4 w-4" />
              Copy booking ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyToClipboard(traveler, "Guest address")}>
              <Copy className="mr-2 h-4 w-4" />
              Copy guest address
            </DropdownMenuItem>
            {escrowAddress && (
              <DropdownMenuItem
                onClick={() =>
                  window.open(`https://sepolia.etherscan.io/address/${escrowAddress}`, "_blank")
                }
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View escrow on BaseScan
              </DropdownMenuItem>
            )}
            {canCancel && onCancel && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onCancel}
                  className="text-red-600 focus:bg-red-50 focus:text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel booking
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
