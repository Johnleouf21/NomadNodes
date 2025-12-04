"use client";

import * as React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Home, Star, MessageCircle, CheckCircle } from "lucide-react";

type ActivityType = "booking" | "review" | "listing" | "message" | "mint";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  date: string;
  status?: "completed" | "upcoming" | "active";
}

export function ActivityHistory() {
  const { t } = useTranslation();
  const { hasTravelerSBT, hasHostSBT } = useAuth();

  // Mock activity data - will be replaced with actual on-chain data
  const activities: Activity[] = [
    {
      id: "1",
      type: "booking",
      title: "Booked Modern Loft in Paris",
      description: "3 nights • Feb 15-18, 2025",
      date: "2 days ago",
      status: "upcoming",
    },
    {
      id: "2",
      type: "review",
      title: "Left review for Beach House in Bali",
      description: '5 stars • "Amazing stay with incredible views"',
      date: "1 week ago",
      status: "completed",
    },
    {
      id: "3",
      type: "listing",
      title: "Listed Cozy Studio Apartment",
      description: "San Francisco, CA",
      date: "2 weeks ago",
      status: "active",
    },
    {
      id: "4",
      type: "message",
      title: "New message from guest",
      description: "Question about check-in process",
      date: "3 weeks ago",
      status: "completed",
    },
    {
      id: "5",
      type: "mint",
      title: "Minted Traveler SBT",
      description: "Completed onboarding",
      date: "1 month ago",
      status: "completed",
    },
  ];

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "booking":
        return Calendar;
      case "review":
        return Star;
      case "listing":
        return Home;
      case "message":
        return MessageCircle;
      case "mint":
        return CheckCircle;
      default:
        return Calendar;
    }
  };

  const getStatusBadge = (status?: Activity["status"]) => {
    if (!status) return null;

    const variants = {
      completed: "default",
      upcoming: "secondary",
      active: "outline",
    } as const;

    const labels = {
      completed: "Completed",
      upcoming: "Upcoming",
      active: "Active",
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    );
  };

  // Filter activities based on user's SBTs
  const filteredActivities = activities.filter((activity) => {
    if (activity.type === "booking" || activity.type === "review") {
      return hasTravelerSBT;
    }
    if (activity.type === "listing" || activity.type === "message") {
      return hasHostSBT;
    }
    return true; // mint and other types are always shown
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.activity_history")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div
                  key={activity.id}
                  className="hover:bg-muted/50 flex items-start gap-4 rounded-lg border p-4 transition-colors"
                >
                  <div className="bg-primary/10 rounded-full p-2">
                    <Icon className="text-primary h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{activity.title}</p>
                      {getStatusBadge(activity.status)}
                    </div>
                    <p className="text-muted-foreground text-sm">{activity.description}</p>
                    <p className="text-muted-foreground text-xs">{activity.date}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <Calendar className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No activity yet. Start exploring!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
