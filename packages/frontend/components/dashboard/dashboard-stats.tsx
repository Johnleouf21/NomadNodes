"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, type LucideIcon } from "lucide-react";

export interface DashboardStat {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: string;
}

interface DashboardStatsProps {
  stats: DashboardStat[];
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-muted-foreground mb-1 text-sm font-medium">{stat.title}</p>
                  <p className="mb-2 text-2xl font-bold">{stat.value}</p>
                  <div className="text-muted-foreground flex items-center text-xs">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {stat.trend}
                  </div>
                </div>
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                  <Icon className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
