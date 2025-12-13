"use client";

/**
 * Booking details grid
 */

import { Calendar, User, DollarSign, ArrowRight, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate, shortenAddress, copyToClipboard } from "../utils";

interface BookingDetailsProps {
  checkInDate: string;
  checkOutDate: string;
  traveler: string;
  totalPrice: number;
  currencyLabel: string;
  nights: number;
  travelerRating?: number;
  travelerReviewCount?: number;
  onTravelerRatingClick?: () => void;
}

/**
 * Grid displaying booking information
 */
export function BookingDetails({
  checkInDate,
  checkOutDate,
  traveler,
  totalPrice,
  currencyLabel,
  nights,
  travelerRating,
  travelerReviewCount,
  onTravelerRatingClick,
}: BookingDetailsProps) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      <div className="flex items-center gap-1.5">
        <Calendar className="text-muted-foreground h-3.5 w-3.5" />
        <span className="text-muted-foreground">Check-in:</span>
        <span className="font-medium">{formatDate(checkInDate)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <ArrowRight className="text-muted-foreground h-3.5 w-3.5" />
        <span className="text-muted-foreground">Check-out:</span>
        <span className="font-medium">{formatDate(checkOutDate)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <User className="text-muted-foreground h-3.5 w-3.5" />
        <span className="text-muted-foreground">Guest:</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="font-mono text-xs hover:underline"
                onClick={() => copyToClipboard(traveler, "Guest address")}
              >
                {shortenAddress(traveler)}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs">{traveler}</p>
              <p className="text-muted-foreground">Click to copy</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {travelerRating !== undefined && travelerRating > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTravelerRatingClick?.();
            }}
            className="hover:bg-muted ml-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors"
          >
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span className="text-xs font-medium">{travelerRating.toFixed(1)}</span>
            {travelerReviewCount !== undefined && travelerReviewCount > 0 && (
              <span className="text-muted-foreground text-xs">({travelerReviewCount})</span>
            )}
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <DollarSign className="text-muted-foreground h-3.5 w-3.5" />
        <span className="text-muted-foreground">Total:</span>
        <span className="font-semibold">
          {totalPrice.toFixed(2)} {currencyLabel}
        </span>
        <span className="text-muted-foreground text-xs">({nights} nights)</span>
      </div>
    </div>
  );
}
