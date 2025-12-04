/**
 * Hooks for managing room types (RoomTypeNFT contract)
 *
 * Note: Most room type management functions are now in usePropertyMutations.ts:
 * - useSetRoomTypeActive
 * - useUpdateRoomTypeSettings (pricePerNight, cleaningFee)
 * - useUpdateRoomTypeSupply
 * - useDeleteRoomType
 *
 * This file contains additional room type management hooks.
 */

import * as React from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { CONTRACTS } from "@/lib/contracts";
import { uploadRoomTypeMetadataToIPFS } from "@/lib/utils/ipfs";
import type { RoomTypeData } from "./types";

/**
 * Hook to add a new room type to a property via RoomTypeNFT
 */
export function useAddRoomType() {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<Error | null>(null);

  const {
    writeContractAsync,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const reset = React.useCallback(() => {
    setUploadError(null);
    setIsUploading(false);
    resetWrite();
  }, [resetWrite]);

  const addRoomType = React.useCallback(
    async (propertyId: bigint, roomData: RoomTypeData) => {
      try {
        setIsUploading(true);
        setUploadError(null);

        // Upload metadata to IPFS first
        const ipfsHash = await uploadRoomTypeMetadataToIPFS(roomData);

        // Convert price to 6 decimals (USDC/EURC format)
        const priceInUnits = parseUnits(roomData.pricePerNight.toString(), 6);
        const cleaningFeeInUnits = parseUnits((roomData.cleaningFee || 0).toString(), 6);

        setIsUploading(false);

        // Call the contract
        await writeContractAsync({
          ...CONTRACTS.roomTypeNFT,
          functionName: "addRoomType",
          args: [
            propertyId,
            roomData.name,
            ipfsHash,
            priceInUnits,
            cleaningFeeInUnits,
            BigInt(roomData.maxGuests),
            BigInt(roomData.maxSupply),
          ],
        });
      } catch (err) {
        setIsUploading(false);
        setUploadError(err instanceof Error ? err : new Error("Failed to add room type"));
        throw err;
      }
    },
    [writeContractAsync]
  );

  return {
    addRoomType,
    isPending: isUploading || isWritePending || isTxLoading,
    isSuccess: isTxSuccess,
    error: uploadError || writeError,
    txHash,
    reset,
  };
}

/**
 * Hook to update room type name via RoomTypeNFT
 * @deprecated The new RoomTypeNFT contract does not support updating the name.
 * Name is immutable after creation. Update IPFS metadata instead.
 */
export function useUpdateRoomTypeName() {
  const updateName = React.useCallback((_tokenId: bigint, _newName: string) => {
    console.warn(
      "useUpdateRoomTypeName is deprecated. Room type names are immutable in the new architecture."
    );
  }, []);

  return {
    updateName,
    isPending: false,
    isSuccess: false,
    error: null,
    txHash: undefined,
  };
}

// Re-export from usePropertyMutations for backwards compatibility
export {
  useSetRoomTypeActive,
  useUpdateRoomTypeSettings,
  useUpdateRoomTypeSupply,
  useDeleteRoomType,
} from "./usePropertyMutations";
