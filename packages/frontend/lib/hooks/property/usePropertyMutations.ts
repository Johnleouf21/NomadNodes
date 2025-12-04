/**
 * Write hooks for Property contracts (PropertyRegistry + RoomTypeNFT) mutations
 */

import * as React from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

/**
 * Hook to activate/deactivate a property via PropertyRegistry
 */
export function useSetPropertyActive() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const setPropertyActive = React.useCallback(
    (propertyId: bigint, active: boolean) => {
      writeContract({
        ...CONTRACTS.propertyRegistry,
        functionName: "setPropertyActive",
        args: [propertyId, active],
      });
    },
    [writeContract]
  );

  return {
    setPropertyActive,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
  };
}

/**
 * Hook to update property metadata
 * Note: In the new architecture, property metadata is stored offchain (IPFS).
 * This hook is kept for backwards compatibility but does nothing.
 * @deprecated Use IPFS directly to update metadata
 */
export function useUpdateProperty() {
  const updateProperty = React.useCallback((_propertyId: bigint, _newIpfsHash: string) => {
    console.warn("useUpdateProperty is deprecated. Property metadata is stored offchain.");
  }, []);

  return {
    updateProperty,
    isPending: false,
    isSuccess: false,
    error: null,
  };
}

/**
 * Hook to activate/deactivate a room type via RoomTypeNFT
 */
export function useSetRoomTypeActive() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const setRoomTypeActive = React.useCallback(
    (tokenId: bigint, active: boolean) => {
      writeContract({
        ...CONTRACTS.roomTypeNFT,
        functionName: "setRoomTypeActive",
        args: [tokenId, active],
      });
    },
    [writeContract]
  );

  return {
    setRoomTypeActive,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
  };
}

/**
 * Hook to update room type settings (price and cleaning fee) via RoomTypeNFT
 */
export function useUpdateRoomTypeSettings() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const updateRoomTypeSettings = React.useCallback(
    (tokenId: bigint, pricePerNight: bigint, cleaningFee: bigint) => {
      writeContract({
        ...CONTRACTS.roomTypeNFT,
        functionName: "updateRoomTypeSettings",
        args: [tokenId, pricePerNight, cleaningFee],
      });
    },
    [writeContract]
  );

  return {
    updateRoomTypeSettings,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
  };
}

/**
 * Hook to increase room type supply via RoomTypeNFT
 */
export function useUpdateRoomTypeSupply() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const updateRoomTypeSupply = React.useCallback(
    (tokenId: bigint, newMaxSupply: bigint) => {
      writeContract({
        ...CONTRACTS.roomTypeNFT,
        functionName: "updateRoomTypeSupply",
        args: [tokenId, newMaxSupply],
      });
    },
    [writeContract]
  );

  return {
    updateRoomTypeSupply,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
  };
}

/**
 * Hook to delete a room type via RoomTypeNFT
 */
export function useDeleteRoomType() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const deleteRoomType = React.useCallback(
    (tokenId: bigint) => {
      writeContract({
        ...CONTRACTS.roomTypeNFT,
        functionName: "deleteRoomType",
        args: [tokenId],
      });
    },
    [writeContract]
  );

  return {
    deleteRoomType,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
  };
}

/**
 * Hook to update room type metadata (IPFS hash) via RoomTypeNFT
 */
export function useUpdateRoomTypeMetadata() {
  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const updateRoomTypeMetadata = React.useCallback(
    (tokenId: bigint, ipfsHash: string) => {
      writeContract({
        ...CONTRACTS.roomTypeNFT,
        functionName: "updateRoomTypeMetadata",
        args: [tokenId, ipfsHash],
      });
    },
    [writeContract]
  );

  return {
    updateRoomTypeMetadata,
    isPending: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error,
    txHash,
    reset,
  };
}

/**
 * @deprecated Use useUpdateRoomTypeMetadata instead
 */
export function useUpdateRoomType() {
  const { updateRoomTypeMetadata, isPending, isSuccess, error } = useUpdateRoomTypeMetadata();

  const updateRoomType = React.useCallback(
    (tokenId: bigint, newIpfsHash: string) => {
      updateRoomTypeMetadata(tokenId, newIpfsHash);
    },
    [updateRoomTypeMetadata]
  );

  return {
    updateRoomType,
    isPending,
    isSuccess,
    error,
  };
}
