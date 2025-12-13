"use client";

import { Star, Users, Bed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatAddress } from "@/lib/utils";
import type { PropertySidebarProps } from "./types";

/**
 * Property sidebar with stats, details, and IPFS info
 */
export function PropertySidebar({
  propertyId,
  averageRating,
  totalReviews,
  totalBookings,
  totalRoomUnits,
  fullAddress,
  hostWallet,
  createdAt,
  lastBookingTimestamp,
  ipfsHash,
  onReviewsClick,
}: PropertySidebarProps) {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onReviewsClick}
              className="bg-muted/50 hover:bg-muted rounded-lg p-4 text-center transition-colors"
            >
              <Star className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
              <p className="text-2xl font-bold">
                {averageRating > 0 ? averageRating.toFixed(1) : "N/A"}
              </p>
              <p className="text-muted-foreground text-xs">Rating</p>
            </button>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Users className="mx-auto mb-2 h-6 w-6 text-blue-500" />
              <p className="text-2xl font-bold">{totalBookings}</p>
              <p className="text-muted-foreground text-xs">Bookings</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Bed className="mx-auto mb-2 h-6 w-6 text-green-500" />
              <p className="text-2xl font-bold">{totalRoomUnits}</p>
              <p className="text-muted-foreground text-xs">Rooms</p>
            </div>
            <button
              onClick={onReviewsClick}
              className="bg-muted/50 hover:bg-muted rounded-lg p-4 text-center transition-colors"
            >
              <Star className="mx-auto mb-2 h-6 w-6 text-purple-500" />
              <p className="text-2xl font-bold">{totalReviews}</p>
              <p className="text-muted-foreground text-xs">Reviews</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground mb-1 text-sm font-medium">Full Address</p>
            <p className="text-sm">{fullAddress}</p>
          </div>
          <Separator />
          <div>
            <p className="text-muted-foreground mb-1 text-sm font-medium">Property ID</p>
            <p className="font-mono text-sm">{propertyId.toString()}</p>
          </div>
          <Separator />
          <div>
            <p className="text-muted-foreground mb-1 text-sm font-medium">Host</p>
            <p className="font-mono text-xs">{formatAddress(hostWallet)}</p>
          </div>
          <Separator />
          <div>
            <p className="text-muted-foreground mb-1 text-sm font-medium">Listed On</p>
            <p className="text-sm">
              {new Date(Number(createdAt || 0n) * 1000).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {lastBookingTimestamp && Number(lastBookingTimestamp) > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">Last Booking</p>
                <p className="text-sm">
                  {new Date(Number(lastBookingTimestamp) * 1000).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* IPFS Info */}
      {ipfsHash && ipfsHash !== "QmPlaceholder" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Blockchain Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs">IPFS Hash</p>
              <p className="font-mono text-xs break-all">{ipfsHash}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
