"use client";

interface DateDetailsProps {
  checkIn: Date;
  checkOut: Date;
}

/**
 * Check-in and check-out date display
 */
export function DateDetails({ checkIn, checkOut }: DateDetailsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">Check-in</p>
        <p className="font-semibold">{checkIn.toLocaleDateString()}</p>
        <p className="text-muted-foreground text-xs">After 3:00 PM</p>
      </div>
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">Check-out</p>
        <p className="font-semibold">{checkOut.toLocaleDateString()}</p>
        <p className="text-muted-foreground text-xs">Before 11:00 AM</p>
      </div>
    </div>
  );
}
