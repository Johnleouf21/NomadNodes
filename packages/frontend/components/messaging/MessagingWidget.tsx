"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquare, WifiOff } from "lucide-react";
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

// Placeholder component - XMTP integration pending
// XMTP browser-sdk has WASM/WebWorker incompatibility with Next.js
export function MessagingWidget() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Messages</span>
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            <WifiOff className="h-3 w-3" />
            Coming Soon
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="p-4 text-center">
          <MessageSquare className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
          <p className="text-muted-foreground mb-3 text-sm">Messaging feature coming soon</p>
          <p className="text-muted-foreground text-xs">End-to-end encrypted messaging via XMTP</p>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer justify-center">
          <Link href="/messages" className="w-full text-center">
            View messages
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
