"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useRoomTypeById, useRoomTypeMetadata } from "@/lib/hooks/usePropertyNFT";
import { RoomTypeManagementCard } from "@/components/property/room-type-management-card";
import { RoomPricingEditor } from "@/components/property/RoomSettingsEditor";
import { RoomCalendarAccordion } from "@/components/property/room-calendar-accordion";
import { RoomTypeMetadataEditor } from "@/components/property/room-type-metadata-editor";

interface RoomTypesManagementProps {
  roomTypeIds: bigint[];
  propertyId?: bigint;
  isLoading: boolean;
  onAddRoomType?: () => void;
}

/*//////////////////////////////////////////////////////////////
                      HELPER COMPONENTS
//////////////////////////////////////////////////////////////*/

// Status & Settings Tab
function RoomTypeStatusTab({ tokenId }: { tokenId: bigint }) {
  const { data: roomTypeData, isLoading, refetch } = useRoomTypeById(tokenId);
  const data = roomTypeData as any;
  const { data: roomMetadata } = useRoomTypeMetadata(data?.ipfsMetadataHash);

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (!roomTypeData) return null;

  const roomName = roomMetadata?.name || data.name || `Room ${tokenId.toString()}`;

  return (
    <RoomTypeManagementCard
      tokenId={tokenId}
      roomName={roomName}
      maxSupply={Number(data.totalSupply || 0n)}
      isActive={Boolean(data.isActive)}
      isDeleted={Boolean(data.isDeleted)}
      onUpdate={() => refetch()}
    />
  );
}

// Pricing Tab - Edit on-chain prices
function RoomTypePricingTab({ tokenId }: { tokenId: bigint }) {
  const { data: roomTypeData, isLoading, refetch } = useRoomTypeById(tokenId);
  const data = roomTypeData as any;
  const { data: roomMetadata } = useRoomTypeMetadata(data?.ipfsMetadataHash);

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (!roomTypeData) return null;

  const roomName = roomMetadata?.name || data.name || `Room ${tokenId.toString()}`;

  // Use IPFS metadata price as source of truth (converted to 6 decimals for display)
  // This handles both old properties (price stored without decimals) and new ones
  const priceFromMetadata = roomMetadata?.pricePerNight || 0;
  const cleaningFeeFromMetadata = roomMetadata?.cleaningFee || 0;
  // Convert to 6 decimal format for the editor component
  const priceInUnits = BigInt(Math.round(priceFromMetadata * 1e6));
  const cleaningFeeInUnits = BigInt(Math.round(cleaningFeeFromMetadata * 1e6));

  return (
    <div className="space-y-3">
      {/* Room Header */}
      <div className="bg-muted/50 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{roomName}</h3>
          <span className="text-muted-foreground font-mono text-xs">
            Token: {tokenId.toString()}
          </span>
        </div>
      </div>

      {/* Pricing Editor */}
      <RoomPricingEditor
        tokenId={tokenId}
        currentPricePerNight={priceInUnits}
        currentCleaningFee={cleaningFeeInUnits}
        currency={roomMetadata?.currency || "USD"}
        _onUpdate={() => refetch()}
      />
    </div>
  );
}

// Room Details Tab (IPFS Metadata)
function RoomTypeDetailsTab({ tokenId }: { tokenId: bigint }) {
  const { data: roomTypeData, isLoading, refetch } = useRoomTypeById(tokenId);
  const data = roomTypeData as any;
  const { data: roomMetadata, refetch: refetchMetadata } = useRoomTypeMetadata(
    data?.ipfsMetadataHash
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (!roomTypeData) return null;

  const roomName = roomMetadata?.name || data.name || `Room ${tokenId.toString()}`;

  return (
    <div className="space-y-3">
      {/* Room Header */}
      <div className="bg-muted/50 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{roomName}</h3>
          <span className="text-muted-foreground font-mono text-xs">
            Token: {tokenId.toString()}
          </span>
        </div>
      </div>

      {/* Metadata Editor */}
      <RoomTypeMetadataEditor
        tokenId={tokenId}
        currentMetadata={roomMetadata || undefined}
        _currentMetadataURI={data?.ipfsMetadataHash}
        onUpdate={() => {
          refetch();
          refetchMetadata();
        }}
      />
    </div>
  );
}

/*//////////////////////////////////////////////////////////////
                      MAIN COMPONENT
//////////////////////////////////////////////////////////////*/

export function RoomTypesManagement({
  roomTypeIds,
  propertyId: _propertyId,
  isLoading,
  onAddRoomType,
}: RoomTypesManagementProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Room Types Management</CardTitle>
              <CardDescription>Manage availability and status of your room types</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (roomTypeIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Room Types Management</CardTitle>
              <CardDescription>Manage availability and status of your room types</CardDescription>
            </div>
            {onAddRoomType && (
              <Button onClick={onAddRoomType} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Room Type
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-4">No room types configured yet</p>
            {onAddRoomType && (
              <Button onClick={onAddRoomType}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Room Type
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Room Types Management</CardTitle>
            <CardDescription>Manage availability and status of your room types</CardDescription>
          </div>
          {onAddRoomType && (
            <Button onClick={onAddRoomType} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Room Type
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4 pt-4">
            {roomTypeIds.map((tokenId) => (
              <RoomTypeStatusTab key={tokenId.toString()} tokenId={tokenId} />
            ))}
          </TabsContent>

          <TabsContent value="details" className="space-y-4 pt-4">
            {roomTypeIds.map((tokenId) => (
              <RoomTypeDetailsTab key={tokenId.toString()} tokenId={tokenId} />
            ))}
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4 pt-4">
            {roomTypeIds.map((tokenId) => (
              <RoomTypePricingTab key={tokenId.toString()} tokenId={tokenId} />
            ))}
          </TabsContent>

          <TabsContent value="calendar" className="pt-4">
            <Accordion type="single" collapsible className="w-full">
              {roomTypeIds.map((tokenId, index) => (
                <RoomCalendarAccordion
                  key={tokenId.toString()}
                  tokenId={tokenId}
                  index={index}
                  currentMonth={new Date()}
                />
              ))}
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
