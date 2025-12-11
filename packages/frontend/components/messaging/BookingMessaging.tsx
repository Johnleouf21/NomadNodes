"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, WifiOff, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface BookingMessagingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peerAddress: string;
  peerName?: string;
  bookingId: string;
  propertyName: string;
  isHost: boolean;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Placeholder component - XMTP integration pending
// XMTP browser-sdk has WASM/WebWorker incompatibility with Next.js
export function BookingMessaging({
  open,
  onOpenChange,
  peerAddress,
  peerName,
  bookingId,
  propertyName,
  isHost,
}: BookingMessagingProps) {
  const peerDisplayName = peerName || shortenAddress(peerAddress);
  const roleLabel = isHost ? "Guest" : "Host";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message {roleLabel}
          </SheetTitle>
          <SheetDescription>
            {propertyName} - Booking #{bookingId.slice(0, 8)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-1 flex-col overflow-hidden">
          {/* Peer Info */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{peerDisplayName}</p>
                <p className="text-muted-foreground text-xs">{roleLabel}</p>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              Coming Soon
            </Badge>
          </div>

          {/* Coming Soon State */}
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border p-6">
            <MessageSquare className="text-muted-foreground h-12 w-12" />
            <div className="text-center">
              <h3 className="font-semibold">Messaging Coming Soon</h3>
              <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                End-to-end encrypted messaging with your {roleLabel.toLowerCase()} will be available
                soon via XMTP protocol.
              </p>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>

          {/* Encryption Notice */}
          <p className="text-muted-foreground mt-4 text-center text-xs">
            Messages will be end-to-end encrypted via XMTP
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
