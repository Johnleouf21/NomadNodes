/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Hook for creating properties with automatic room type minting
 * Uses PropertyRegistry for property creation and RoomTypeNFT for room types
 */

import * as React from "react";
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { decodeEventLog, parseUnits } from "viem";
import { uploadPropertyMetadataToIPFS, uploadRoomTypeMetadataToIPFS } from "@/lib/utils/ipfs";
import type { PropertyMetadata, RoomTypeData } from "./types";

interface UseCreatePropertyOptions {
  onSuccess?: (propertyId: bigint) => void;
  onError?: (error: string) => void;
}

export function useCreateProperty({ onSuccess, onError }: UseCreatePropertyOptions = {}) {
  const publicClient = usePublicClient();
  const [step, setStep] = React.useState<
    "idle" | "uploading" | "creating" | "adding_rooms" | "complete"
  >("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [propertyId, setPropertyId] = React.useState<bigint | null>(null);
  const [roomTypesData, setRoomTypesData] = React.useState<RoomTypeData[]>([]);
  // Use useRef instead of useState for Set to avoid dependency issues
  const processedRoomHashesRef = React.useRef<Set<string>>(new Set());
  const [processedCount, setProcessedCount] = React.useState(0);

  // Stable callback refs to avoid useEffect dependency issues
  const onSuccessRef = React.useRef(onSuccess);
  const onErrorRef = React.useRef(onError);
  React.useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  // Create property transaction
  const {
    writeContract: writeCreateProperty,
    data: createTxHash,
    isPending: isCreatePending,
    error: createError,
    reset: resetCreate,
  } = useWriteContract();

  // Add room type transaction
  const {
    writeContract: writeAddRoomType,
    data: roomTxHash,
    isPending: isRoomPending,
    error: roomError,
    reset: resetRoom,
  } = useWriteContract();

  const {
    isLoading: isCreateTxLoading,
    isSuccess: isCreateTxSuccess,
    data: createReceipt,
  } = useWaitForTransactionReceipt({
    hash: createTxHash,
  });

  const { isLoading: isRoomTxLoading, isSuccess: isRoomTxSuccess } = useWaitForTransactionReceipt({
    hash: roomTxHash,
  });

  // Handle create property errors
  React.useEffect(() => {
    if (createError) {
      const errorMsg = createError.message || "Failed to create property";
      setError(errorMsg);
      setStep("idle");
      onErrorRef.current?.(errorMsg);
    }
  }, [createError]);

  // Handle room type errors
  React.useEffect(() => {
    if (roomError) {
      const errorMsg = roomError.message || "Failed to add room type";
      setError(errorMsg);
      setStep("idle");
      onErrorRef.current?.(errorMsg);
    }
  }, [roomError]);

  // Extract propertyId from PropertyCreated event (from PropertyRegistry)
  const roomTypesCount = roomTypesData.length;
  React.useEffect(() => {
    if (isCreateTxSuccess && createReceipt && publicClient) {
      const logs = createReceipt.logs;

      // Find PropertyCreated event from PropertyRegistry
      for (const log of logs) {
        try {
          const decoded = decodeEventLog({
            abi: CONTRACTS.propertyRegistry.abi,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "PropertyCreated") {
            const propId = (decoded.args as any).propertyId as bigint;
            setPropertyId(propId);

            // Start adding room types if we have any
            if (roomTypesCount > 0) {
              setStep("adding_rooms");
            } else {
              setStep("complete");
              onSuccessRef.current?.(propId);
            }
            break;
          }
        } catch (e) {
          // Not the event we're looking for
          continue;
        }
      }
    }
  }, [isCreateTxSuccess, createReceipt, publicClient, roomTypesCount]);

  // Add next room type when ready
  React.useEffect(() => {
    if (
      step === "adding_rooms" &&
      propertyId &&
      !isRoomPending &&
      !isRoomTxLoading &&
      !roomTxHash // No pending transaction - blockchain-native check
    ) {
      // Find next room that hasn't been processed
      const nextRoomIndex = roomTypesData.findIndex((_, idx) => {
        const roomKey = `${propertyId.toString()}-${idx}`;
        return !processedRoomHashesRef.current.has(roomKey);
      });

      if (nextRoomIndex !== -1) {
        const room = roomTypesData[nextRoomIndex];
        const roomKey = `${propertyId.toString()}-${nextRoomIndex}`;

        // Mark as being processed (using ref, no state update)
        processedRoomHashesRef.current.add(roomKey);
        setProcessedCount(processedRoomHashesRef.current.size);

        // Upload room metadata to IPFS
        uploadRoomTypeMetadataToIPFS(room)
          .then((ipfsHash) => {
            // New RoomTypeNFT.addRoomType signature:
            // (propertyId, name, ipfsHash, pricePerNight, cleaningFee, maxGuests, maxSupply)
            // Convert price to 6 decimals (USDC/EURC format)
            const priceInUnits = parseUnits(room.pricePerNight.toString(), 6);
            const cleaningFeeInUnits = parseUnits((room.cleaningFee || 0).toString(), 6);

            writeAddRoomType({
              ...CONTRACTS.roomTypeNFT,
              functionName: "addRoomType",
              args: [
                propertyId,
                room.name,
                ipfsHash,
                priceInUnits,
                cleaningFeeInUnits,
                BigInt(room.maxGuests),
                BigInt(room.maxSupply),
              ],
            });
          })
          .catch((error) => {
            console.error("Failed to upload room metadata:", error);
            setError("Failed to upload room metadata to IPFS");
            setStep("idle");
          });
      } else {
        // All rooms processed
        setStep("complete");
        if (propertyId) {
          onSuccessRef.current?.(propertyId);
        }
      }
    }
  }, [
    step,
    propertyId,
    roomTypesData,
    isRoomPending,
    isRoomTxLoading,
    roomTxHash,
    writeAddRoomType,
  ]);

  // Reset transaction hash after success to trigger next room
  React.useEffect(() => {
    if (isRoomTxSuccess && step === "adding_rooms") {
      // Reset to allow next room to be processed
      resetRoom();
    }
  }, [isRoomTxSuccess, step, resetRoom]);

  const createProperty = React.useCallback(
    async (metadata: PropertyMetadata, roomTypes: RoomTypeData[]) => {
      setError(null);
      setStep("uploading");
      setRoomTypesData(roomTypes);
      processedRoomHashesRef.current = new Set();
      setProcessedCount(0);

      try {
        // Step 1: Upload property metadata to IPFS
        const ipfsHash = await uploadPropertyMetadataToIPFS(metadata);

        setStep("creating");

        // Step 2: Create property on blockchain via PropertyRegistry
        writeCreateProperty({
          ...CONTRACTS.propertyRegistry,
          functionName: "createProperty",
          args: [ipfsHash, metadata.propertyType, `${metadata.city}, ${metadata.country}`],
        });

        // Steps 3+: Room types will be added automatically via useEffect (via RoomTypeNFT)
      } catch (err: any) {
        const errorMsg = err?.message || "Failed to create property";
        setError(errorMsg);
        setStep("idle");
        onErrorRef.current?.(errorMsg);
      }
    },
    [writeCreateProperty]
  );

  const reset = React.useCallback(() => {
    setStep("idle");
    setError(null);
    setPropertyId(null);
    setRoomTypesData([]);
    processedRoomHashesRef.current = new Set();
    setProcessedCount(0);
    resetCreate();
    resetRoom();
  }, [resetCreate, resetRoom]);

  // Calculate current room index for display
  const currentRoomIndex = processedCount > 0 ? processedCount - 1 : 0;

  return {
    createProperty,
    reset,
    step,
    error,
    propertyId,
    currentRoomIndex,
    totalRooms: roomTypesData.length,
    isCreating:
      isCreatePending ||
      isCreateTxLoading ||
      isRoomPending ||
      isRoomTxLoading ||
      step === "adding_rooms",
    isSuccess: step === "complete",
  };
}
