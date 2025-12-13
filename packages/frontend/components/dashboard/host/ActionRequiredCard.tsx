"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, LogIn, Star, ChevronDown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { PonderBooking } from "@/hooks/usePonderBookings";
import type { PendingActions, PropertyInfo } from "./types";

interface ActionRequiredCardProps {
  pendingActions: PendingActions;
  getPropertyInfo: (booking: PonderBooking) => PropertyInfo;
  onOpenDetails: (booking: PonderBooking) => void;
  onCheckIn: (booking: PonderBooking) => void;
  onComplete: (booking: PonderBooking) => void;
  onReview: (booking: PonderBooking) => void;
  isActionPending: (bookingId: string) => boolean;
}

export function ActionRequiredCard({
  pendingActions,
  getPropertyInfo,
  onOpenDetails,
  onCheckIn,
  onComplete,
  onReview,
  isActionPending,
}: ActionRequiredCardProps) {
  if (pendingActions.total === 0) return null;

  return (
    <Card className="mb-8 border-yellow-500/50 bg-yellow-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="h-5 w-5" />
          Action Required
          <Badge
            variant="secondary"
            className="ml-auto bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
          >
            {pendingActions.total} pending
          </Badge>
        </CardTitle>
        <CardDescription>Complete these actions to keep your hosting on track</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Bookings to Confirm */}
        {pendingActions.toConfirm.length > 0 && (
          <ActionSection
            icon={<CheckCircle2 className="h-4 w-4 text-yellow-500" />}
            title="Confirm Bookings"
            count={pendingActions.toConfirm.length}
            badgeClassName="bg-yellow-500"
            bookings={pendingActions.toConfirm}
            getPropertyInfo={getPropertyInfo}
            renderAction={(booking) => (
              <Button
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700"
                onClick={() => onOpenDetails(booking)}
              >
                Confirm
              </Button>
            )}
          />
        )}

        {/* Bookings to Check-In */}
        {pendingActions.toCheckIn.length > 0 && (
          <ActionSection
            icon={<LogIn className="h-4 w-4 text-blue-500" />}
            title="Ready for Check-In"
            count={pendingActions.toCheckIn.length}
            badgeClassName="bg-blue-500"
            bookings={pendingActions.toCheckIn}
            getPropertyInfo={getPropertyInfo}
            renderSubtitle={(booking) =>
              `Check-in: ${new Date(Number(booking.checkInDate) * 1000).toLocaleDateString()}`
            }
            renderAction={(booking) => (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => onCheckIn(booking)}
                disabled={isActionPending(booking.id)}
              >
                {isActionPending(booking.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Check-In"
                )}
              </Button>
            )}
          />
        )}

        {/* Bookings to Complete */}
        {pendingActions.toComplete.length > 0 && (
          <ActionSection
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            title="Ready to Complete"
            count={pendingActions.toComplete.length}
            badgeClassName="bg-green-500"
            bookings={pendingActions.toComplete}
            getPropertyInfo={getPropertyInfo}
            renderSubtitle={(booking) =>
              `Check-out: ${new Date(Number(booking.checkOutDate) * 1000).toLocaleDateString()}`
            }
            renderAction={(booking) => (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onComplete(booking)}
                disabled={isActionPending(booking.id)}
              >
                {isActionPending(booking.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Complete"
                )}
              </Button>
            )}
          />
        )}

        {/* Reviews to Leave */}
        {pendingActions.toReview.length > 0 && (
          <ActionSection
            icon={<Star className="h-4 w-4 text-yellow-500" />}
            title="Leave a Review"
            count={pendingActions.toReview.length}
            badgeClassName="bg-yellow-500"
            bookings={pendingActions.toReview}
            getPropertyInfo={getPropertyInfo}
            renderSubtitle={(booking) =>
              `Traveler: ${booking.traveler.slice(0, 8)}...${booking.traveler.slice(-6)}`
            }
            renderAction={(booking) => (
              <Button size="sm" variant="outline" onClick={() => onReview(booking)}>
                <Star className="mr-1 h-3 w-3" />
                Review
              </Button>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface ActionSectionProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  badgeClassName: string;
  bookings: PonderBooking[];
  getPropertyInfo: (booking: PonderBooking) => PropertyInfo;
  renderSubtitle?: (booking: PonderBooking) => string;
  renderAction: (booking: PonderBooking) => React.ReactNode;
}

function ActionSection({
  icon,
  title,
  count,
  badgeClassName,
  bookings,
  getPropertyInfo,
  renderSubtitle,
  renderAction,
}: ActionSectionProps) {
  return (
    <Collapsible defaultOpen className="rounded-lg border">
      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between p-3 transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${badgeClassName} px-2 py-0.5 text-xs text-white`}>{count}</Badge>
          <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <div className="space-y-2 pt-2">
          {bookings.slice(0, 5).map((booking) => {
            const { name } = getPropertyInfo(booking);
            return (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border bg-white/50 p-3 dark:bg-gray-800/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{name}</p>
                  <p className="text-muted-foreground text-sm">
                    {renderSubtitle
                      ? renderSubtitle(booking)
                      : `${booking.traveler.slice(0, 8)}...${booking.traveler.slice(-6)}`}
                  </p>
                </div>
                {renderAction(booking)}
              </div>
            );
          })}
          {bookings.length > 5 && (
            <p className="text-muted-foreground pt-1 text-center text-sm">
              +{bookings.length - 5} more
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
