"use client";

import * as React from "react";
import { Users, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface GuestSelectorProps {
  guests: number;
  onGuestsChange: (guests: number) => void;
  minGuests?: number;
  maxGuests?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function GuestSelector({
  guests,
  onGuestsChange,
  minGuests = 1,
  maxGuests = 16,
  disabled = false,
  className,
  placeholder = "Guests",
}: GuestSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const increment = () => {
    if (guests < maxGuests) {
      onGuestsChange(guests + 1);
    }
  };

  const decrement = () => {
    if (guests > minGuests) {
      onGuestsChange(guests - 1);
    }
  };

  const formatGuests = () => {
    if (guests === 0) {
      return placeholder;
    }
    return `${guests} ${guests === 1 ? "guest" : "guests"}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            guests === 0 && "text-muted-foreground",
            className
          )}
        >
          <Users className="mr-2 h-4 w-4" />
          <span className="flex-1">{formatGuests()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-4" align="start">
        <div className="space-y-4">
          {/* Guests Counter */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Guests</p>
              <p className="text-muted-foreground text-sm">Ages 13 or above</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={decrement}
                disabled={guests <= minGuests}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{guests}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={increment}
                disabled={guests >= maxGuests}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Select */}
          <div className="border-t pt-3">
            <p className="text-muted-foreground mb-2 text-xs">Quick select</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 4, 6].map((num) => (
                <Button
                  key={num}
                  variant={guests === num ? "default" : "outline"}
                  size="sm"
                  className="h-7"
                  onClick={() => onGuestsChange(num)}
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>

          {/* Done button */}
          <Button className="w-full" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
