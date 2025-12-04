"use client";

import * as React from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Zap, Users, Home, Lock } from "lucide-react";

export function Badges() {
  const { t } = useTranslation();

  // Mock badges - will be replaced with actual achievements
  const badges = [
    {
      icon: Award,
      name: "Early Adopter",
      description: "Joined in the first month",
      earned: true,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      icon: Star,
      name: "Superhost",
      description: "Maintain 4.8+ rating",
      earned: true,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Zap,
      name: "Quick Responder",
      description: "Reply within 1 hour",
      earned: true,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Users,
      name: "Community Leader",
      description: "Help 10+ travelers",
      earned: false,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Home,
      name: "Property Pro",
      description: "List 5+ properties",
      earned: false,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
    },
  ];

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="text-primary h-5 w-5" />
            {t("profile.badges")}
          </CardTitle>
          <Badge variant="secondary">
            {earnedCount}/{badges.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                  badge.earned ? "border-primary/20 bg-primary/5" : "opacity-50 grayscale"
                }`}
              >
                <div className={`rounded-full ${badge.bgColor} p-2`}>
                  {badge.earned ? (
                    <Icon className={`h-4 w-4 ${badge.color}`} />
                  ) : (
                    <Lock className="text-muted-foreground h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-medium">{badge.name}</p>
                  <p className="text-muted-foreground text-xs">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
