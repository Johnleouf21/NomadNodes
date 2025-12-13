"use client";

import { User, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "../utils";

interface GuestInfoProps {
  travelerAddress: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  onViewGuest: () => void;
}

/**
 * Guest information section
 */
export function GuestInfo({ travelerAddress, copiedField, onCopy, onViewGuest }: GuestInfoProps) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="mb-3 flex items-center gap-2 font-semibold">
        <User className="h-4 w-4" />
        Guest Information
      </h4>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Wallet Address</span>
          <div className="flex items-center gap-2">
            <code className="bg-muted rounded px-2 py-1 font-mono text-xs">
              {shortenAddress(travelerAddress)}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onCopy(travelerAddress, "guest")}
            >
              {copiedField === "guest" ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        <Button variant="link" size="sm" className="h-auto px-0" onClick={onViewGuest}>
          <ExternalLink className="mr-1 h-3 w-3" />
          View on BaseScan
        </Button>
      </div>
    </div>
  );
}
