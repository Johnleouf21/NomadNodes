"use client";

import { Home, BedDouble, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CheckInActions } from "../CheckInActions";
import { useHostBookingDetail } from "./useHostBookingDetail";
import {
  StatusCard,
  GuestInfo,
  StayDetails,
  PaymentDetails,
  EscrowContract,
  BookingReference,
  ActionButtons,
} from "./components";
import type { HostBookingDetailSheetProps } from "./types";

/**
 * Host booking detail sheet component
 */
export function HostBookingDetailSheet({
  booking,
  propertyName,
  propertyImage,
  roomTypeName,
  currency = "USD",
  open,
  onOpenChange,
  onConfirm,
  onCheckIn,
  onComplete,
  onCancel,
  onReviewClick,
  onMessage,
  isActionPending = false,
}: HostBookingDetailSheetProps) {
  const {
    copiedField,
    status,
    daysInfo,
    paymentBreakdown,
    actionAvailability,
    copyToClipboard,
    handleViewProperty,
    handleViewEscrow,
    handleViewGuest,
    handleMessage,
  } = useHostBookingDetail(booking, open, currency, onOpenChange);

  if (!booking || !status || !daysInfo || !paymentBreakdown || !actionAvailability) return null;

  const StatusIcon = status.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-left">Booking Details</SheetTitle>
          <SheetDescription className="text-left">
            Reservation #{booking.bookingIndex} for {propertyName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-1 pb-6">
          {/* Property Image & Status */}
          <div className="relative overflow-hidden rounded-lg">
            {propertyImage ? (
              <img src={propertyImage} alt={propertyName} className="h-40 w-full object-cover" />
            ) : (
              <div className="bg-muted flex h-40 w-full items-center justify-center">
                <Home className="text-muted-foreground/30 h-16 w-16" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <Badge className={`${status.bgColor} ${status.color} flex items-center gap-1 border`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            {daysInfo.isUrgent &&
              booking.status !== "Completed" &&
              booking.status !== "Cancelled" && (
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-red-500 text-white">{daysInfo.checkInLabel}</Badge>
                </div>
              )}
          </div>

          {/* Property Info */}
          <div>
            <h3 className="text-xl font-bold">{propertyName}</h3>
            {roomTypeName && (
              <div className="text-primary mt-1 flex items-center gap-2">
                <BedDouble className="h-4 w-4" />
                <span className="font-medium">{roomTypeName}</span>
              </div>
            )}
          </div>

          {/* Status Card */}
          <StatusCard status={status} bookingStatus={booking.status} />

          <Separator />

          {/* Guest Information */}
          <GuestInfo
            travelerAddress={booking.traveler}
            copiedField={copiedField}
            onCopy={copyToClipboard}
            onViewGuest={handleViewGuest}
          />

          {/* Stay Details */}
          <StayDetails
            checkInDate={booking.checkInDate}
            checkOutDate={booking.checkOutDate}
            daysInfo={daysInfo}
            bookingStatus={booking.status}
          />

          {/* Payment Details */}
          <PaymentDetails payment={paymentBreakdown} bookingStatus={booking.status} />

          {/* Check-in Actions */}
          {booking.escrowAddress && booking.status === "Confirmed" && (
            <CheckInActions
              escrowAddress={booking.escrowAddress}
              checkInDate={new Date(Number(booking.checkInDate) * 1000)}
              isTraveler={false}
              onSuccess={() => {
                toast.success("Payment released!");
              }}
            />
          )}

          {/* Escrow Contract */}
          {booking.escrowAddress && (
            <EscrowContract
              escrowAddress={booking.escrowAddress}
              copiedField={copiedField}
              onCopy={copyToClipboard}
              onViewEscrow={handleViewEscrow}
            />
          )}

          {/* Cancellation Policy */}
          {actionAvailability.canCancel && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">
                    Cancellation Policy
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Current refund rate: <strong>{paymentBreakdown.currentRefundPercent}%</strong>
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    If cancelled, guest receives{" "}
                    {(
                      ((paymentBreakdown.escrowTotal - paymentBreakdown.fee) *
                        paymentBreakdown.currentRefundPercent) /
                      100
                    ).toFixed(2)}{" "}
                    {paymentBreakdown.currencyLabel}, you receive{" "}
                    {(
                      ((paymentBreakdown.escrowTotal - paymentBreakdown.fee) *
                        (100 - paymentBreakdown.currentRefundPercent)) /
                      100
                    ).toFixed(2)}{" "}
                    {paymentBreakdown.currencyLabel}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Booking Reference */}
          <BookingReference booking={booking} copiedField={copiedField} onCopy={copyToClipboard} />

          <Separator />

          {/* Action Buttons */}
          <ActionButtons
            bookingStatus={booking.status}
            actions={actionAvailability}
            isActionPending={isActionPending}
            onConfirm={onConfirm}
            onCheckIn={onCheckIn}
            onComplete={onComplete}
            onCancel={onCancel}
            onReviewClick={onReviewClick}
            onViewProperty={handleViewProperty}
            onMessage={() => handleMessage(onMessage)}
            onOpenChange={onOpenChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
