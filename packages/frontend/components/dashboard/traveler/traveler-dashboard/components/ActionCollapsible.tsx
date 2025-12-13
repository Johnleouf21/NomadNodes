"use client";

import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ActionCollapsibleProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  badgeClass: string;
  items: Array<{
    id: string;
    propertyName: string;
    roomName?: string;
    checkOut?: Date;
  }>;
  renderItem: (item: {
    id: string;
    propertyName: string;
    roomName?: string;
    checkOut?: Date;
  }) => React.ReactNode;
  moreCount?: number;
}

/**
 * Collapsible action section for pending actions
 */
export function ActionCollapsible({
  icon,
  title,
  count,
  badgeClass,
  items,
  renderItem,
  moreCount,
}: ActionCollapsibleProps) {
  return (
    <Collapsible defaultOpen className="rounded-lg border">
      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between p-3 transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${badgeClass} px-2 py-0.5 text-xs text-white`}>{count}</Badge>
          <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <div className="space-y-2 pt-2">
          {items.map(renderItem)}
          {moreCount && moreCount > 0 && (
            <p className="text-muted-foreground pt-1 text-center text-sm">
              +{moreCount} more to complete or review
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
