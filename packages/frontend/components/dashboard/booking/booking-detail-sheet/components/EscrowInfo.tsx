"use client";

import { Wallet, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EscrowInfoProps {
  escrowAddress: string;
  copied: boolean;
  onCopy: (address: string) => void;
  onViewEscrow: () => void;
}

/**
 * Escrow contract information display
 */
export function EscrowInfo({ escrowAddress, copied, onCopy, onViewEscrow }: EscrowInfoProps) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="mb-3 flex items-center gap-2 font-semibold">
        <Wallet className="h-4 w-4" />
        Escrow Contract
      </h4>
      <p className="text-muted-foreground mb-2 text-xs">
        Your funds are securely held in a smart contract until your stay is completed.
      </p>
      <div className="flex items-center gap-2">
        <code className="bg-muted flex-1 truncate rounded px-2 py-1.5 font-mono text-xs">
          {escrowAddress}
        </code>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => onCopy(escrowAddress)}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <Button variant="link" size="sm" className="mt-2 px-0" onClick={onViewEscrow}>
        <ExternalLink className="mr-1 h-3 w-3" />
        View on BaseScan
      </Button>
    </div>
  );
}
