"use client";

import * as React from "react";
import { MessageSquare, WifiOff, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

// Placeholder component - XMTP integration pending
// XMTP browser-sdk has WASM/WebWorker incompatibility with Next.js
export function MessagingCenter() {
  return (
    <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-lg border">
      {/* Conversation List */}
      <div className="flex w-full flex-col border-r md:w-80">
        {/* Header */}
        <div className="border-b p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <WifiOff className="h-3 w-3" />
              Coming Soon
            </Badge>
          </div>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input placeholder="Search conversations..." disabled className="pl-9" />
          </div>
        </div>

        {/* Empty Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-8 text-center">
            <MessageSquare className="text-muted-foreground/30 mx-auto mb-2 h-12 w-12" />
            <p className="text-muted-foreground text-sm">No conversations yet</p>
            <p className="text-muted-foreground mt-1 text-xs">Messaging will be available soon</p>
          </div>
        </ScrollArea>
      </div>

      {/* Message View - Coming Soon */}
      <div className="hidden flex-1 flex-col md:flex">
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <MessageSquare className="text-muted-foreground/30 mb-4 h-16 w-16" />
          <h3 className="mb-2 text-xl font-semibold">Messaging Coming Soon</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            End-to-end encrypted messaging with hosts and travelers will be available soon via XMTP
            protocol.
          </p>
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">In the meantime, you can:</p>
            <div className="flex flex-col gap-2">
              <Link href="/explore">
                <Button variant="outline">Browse Properties</Button>
              </Link>
              <Link href="/dashboard/traveler">
                <Button variant="outline">View My Bookings</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
