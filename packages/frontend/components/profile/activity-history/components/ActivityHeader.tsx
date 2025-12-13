"use client";

/**
 * Activity header with title, count badge and date filter
 */

import * as React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Users } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import type { DateFilterOption } from "@/lib/hooks/useUserProfile";
import { DATE_FILTER_LABELS, DATE_FILTER_OPTIONS } from "../types";

interface ActivityHeaderProps {
  isHostView: boolean;
  totalCount: number;
  dateFilter: DateFilterOption;
  onDateFilterChange: (value: DateFilterOption) => void;
}

export function ActivityHeader({
  isHostView,
  totalCount,
  dateFilter,
  onDateFilterChange,
}: ActivityHeaderProps) {
  const { t } = useTranslation();

  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {isHostView ? (
            <Users className="text-primary h-5 w-5" />
          ) : (
            <Calendar className="text-primary h-5 w-5" />
          )}
          {isHostView ? "Bookings Received" : t("profile.activity_history")}
        </CardTitle>
        <Badge variant="secondary">
          {totalCount} {isHostView ? "bookings" : "activities"}
        </Badge>
      </div>

      <div className="mt-2">
        <Select
          value={dateFilter}
          onValueChange={(value) => onDateFilterChange(value as DateFilterOption)}
        >
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option} value={option} className="text-xs">
                {DATE_FILTER_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </CardHeader>
  );
}
