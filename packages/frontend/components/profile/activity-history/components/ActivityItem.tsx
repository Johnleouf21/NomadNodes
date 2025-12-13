"use client";

/**
 * Activity item display
 */

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, type UserActivity } from "@/lib/hooks/useUserProfile";
import { getActivityIcon, getStatusBadgeConfig } from "../utils";

interface ActivityItemProps {
  activity: UserActivity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = getActivityIcon(activity.type);
  const statusConfig = getStatusBadgeConfig(activity.status);

  return (
    <div className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-2.5 transition-colors">
      <div className="bg-primary/10 shrink-0 rounded-full p-2">
        <Icon className="text-primary h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{activity.title}</p>
          {statusConfig && (
            <Badge variant={statusConfig.variant} className="gap-1 text-xs">
              <statusConfig.icon className="h-3 w-3" />
              {statusConfig.label}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{activity.description}</p>
        <div className="mt-1 flex items-center gap-3">
          <p className="text-muted-foreground text-[10px]">{formatRelativeTime(activity.date)}</p>
          {activity.propertyId && (
            <Link
              href={`/property/${activity.propertyId}`}
              className="text-primary inline-flex items-center gap-1 text-[10px] hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View
            </Link>
          )}
          {activity.rating && <StarRating rating={activity.rating} />}
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-2.5 w-2.5 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}
