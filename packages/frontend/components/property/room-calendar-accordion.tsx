"use client";

import * as React from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useRoomTypeById, useRoomTypeMetadata } from "@/lib/hooks/usePropertyNFT";
import { ProfessionalAvailabilityCalendar } from "./professional-availability-calendar";

interface RoomCalendarAccordionProps {
  tokenId: bigint;
  index: number;
  currentMonth: Date;
}

/**
 * Reusable accordion item component for displaying room type availability calendar
 * Used in both property edit page and host calendar dashboard
 */
export function RoomCalendarAccordion({
  tokenId,
  index,
  currentMonth,
}: RoomCalendarAccordionProps) {
  const [localMonth, setLocalMonth] = React.useState(currentMonth);
  const { data: roomTypeData, isLoading } = useRoomTypeById(tokenId);
  const data = roomTypeData as any;
  const { data: roomMetadata } = useRoomTypeMetadata(data?.ipfsMetadataHash);

  // Sync with parent month changes
  React.useEffect(() => {
    setLocalMonth(currentMonth);
  }, [currentMonth]);

  if (isLoading) {
    return (
      <AccordionItem value={`room-${index}`}>
        <AccordionTrigger>Loading...</AccordionTrigger>
        <AccordionContent>
          <p className="text-muted-foreground text-sm">Loading room type...</p>
        </AccordionContent>
      </AccordionItem>
    );
  }

  if (!roomTypeData) return null;

  const roomName = roomMetadata?.name || data?.name || `Room ${tokenId.toString()}`;
  const maxSupply = Number(data?.totalSupply || 10n);

  return (
    <AccordionItem value={`room-${index}`}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex w-full items-center justify-between pr-4">
          <span className="font-semibold">{roomName}</span>
          <span className="text-muted-foreground font-mono text-xs">
            Token: {tokenId.toString()}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-6">
        <ProfessionalAvailabilityCalendar
          tokenId={tokenId}
          roomName={roomName}
          maxSupply={maxSupply}
          currentMonth={localMonth}
          onMonthChange={setLocalMonth}
        />
      </AccordionContent>
    </AccordionItem>
  );
}
