/**
 * Hook for minting SBTs (Soulbound Tokens)
 * Handles both TravelerSBT and HostSBT minting with sequential logic for 'both' role
 */

import * as React from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import type { UserRole } from "@/lib/store";
import type { Address } from "viem";

interface UseMintSBTOptions {
  role: UserRole;
  address: Address | undefined;
  hasTravelerSBT: boolean;
  hasHostSBT: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface MintSBTState {
  isIdle: boolean;
  isMinting: boolean;
  isSuccess: boolean;
  error: string | null;
  mintingStep: "idle" | "traveler" | "host" | "complete";
  travelerTxHash: `0x${string}` | undefined;
  hostTxHash: `0x${string}` | undefined;
  isTravelerSuccess: boolean;
  isHostSuccess: boolean;
}

export function useMintSBT({
  role,
  address,
  hasTravelerSBT,
  hasHostSBT,
  onSuccess,
  onError,
}: UseMintSBTOptions) {
  const [mintingStep, setMintingStep] = React.useState<"idle" | "traveler" | "host" | "complete">(
    "idle"
  );
  const [error, setError] = React.useState<string | null>(null);

  // Determine what needs to be minted
  const needsTravelerSBT = (role === "traveler" || role === "both") && !hasTravelerSBT;
  const needsHostSBT = (role === "host" || role === "both") && !hasHostSBT;

  // Traveler SBT minting
  const {
    writeContract: writeTravelerMint,
    data: travelerTxHash,
    isPending: isTravelerPending,
    error: travelerError,
    reset: resetTravelerMint,
  } = useWriteContract();

  const { isLoading: isTravelerTxLoading, isSuccess: isTravelerTxSuccess } =
    useWaitForTransactionReceipt({
      hash: travelerTxHash,
    });

  // Host SBT minting
  const {
    writeContract: writeHostMint,
    data: hostTxHash,
    isPending: isHostPending,
    error: hostError,
    reset: resetHostMint,
  } = useWriteContract();

  const { isLoading: isHostTxLoading, isSuccess: isHostTxSuccess } = useWaitForTransactionReceipt({
    hash: hostTxHash,
  });

  // Determine overall state
  const isMinting = isTravelerPending || isHostPending || isTravelerTxLoading || isHostTxLoading;
  const isSuccess = mintingStep === "complete";

  // Handle errors
  React.useEffect(() => {
    if (travelerError) {
      const errorMsg = travelerError.message || "Failed to mint Traveler SBT";
      setError(errorMsg);
      setMintingStep("idle");
      onError?.(errorMsg);
    }
  }, [travelerError, onError]);

  React.useEffect(() => {
    if (hostError) {
      const errorMsg = hostError.message || "Failed to mint Host SBT";
      setError(errorMsg);
      setMintingStep("idle");
      onError?.(errorMsg);
    }
  }, [hostError, onError]);

  // Sequential minting for 'both' role
  React.useEffect(() => {
    if (
      role === "both" &&
      isTravelerTxSuccess &&
      needsHostSBT &&
      !hostTxHash &&
      mintingStep === "traveler" &&
      address
    ) {
      // Traveler mint succeeded, now mint host
      setMintingStep("host");
      writeHostMint({
        ...CONTRACTS.hostSBT,
        functionName: "mint",
        args: [address],
        gas: 500000n, // Explicit gas limit
      });
    }
  }, [isTravelerTxSuccess, needsHostSBT, hostTxHash, address, role, writeHostMint, mintingStep]);

  // Mark as complete when done
  React.useEffect(() => {
    if (role === "both" && isTravelerTxSuccess && isHostTxSuccess) {
      setMintingStep("complete");
      onSuccess?.();
    } else if (role === "traveler" && isTravelerTxSuccess) {
      setMintingStep("complete");
      onSuccess?.();
    } else if (role === "host" && isHostTxSuccess) {
      setMintingStep("complete");
      onSuccess?.();
    }
  }, [isTravelerTxSuccess, isHostTxSuccess, role, onSuccess]);

  // Main mint function
  const mint = React.useCallback(() => {
    if (!address) {
      const errorMsg = "Wallet not connected";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setError(null);

    try {
      // Mint Traveler SBT first if needed
      if (needsTravelerSBT) {
        setMintingStep("traveler");
        writeTravelerMint({
          ...CONTRACTS.travelerSBT,
          functionName: "mint",
          args: [address],
          gas: 500000n, // Explicit gas limit
        });
      }
      // If only host SBT is needed
      else if (needsHostSBT) {
        setMintingStep("host");
        writeHostMint({
          ...CONTRACTS.hostSBT,
          functionName: "mint",
          args: [address],
          gas: 500000n, // Explicit gas limit
        });
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to mint SBT";
      setError(errorMsg);
      setMintingStep("idle");
      onError?.(errorMsg);
    }
  }, [address, needsTravelerSBT, needsHostSBT, writeTravelerMint, writeHostMint, onError]);

  // Reset function
  const reset = React.useCallback(() => {
    setMintingStep("idle");
    setError(null);
    resetTravelerMint();
    resetHostMint();
  }, [resetTravelerMint, resetHostMint]);

  const state: MintSBTState = {
    isIdle: mintingStep === "idle",
    isMinting,
    isSuccess,
    error,
    mintingStep,
    travelerTxHash,
    hostTxHash,
    isTravelerSuccess: isTravelerTxSuccess,
    isHostSuccess: isHostTxSuccess,
  };

  return {
    ...state,
    mint,
    reset,
    needsTravelerSBT,
    needsHostSBT,
  };
}
