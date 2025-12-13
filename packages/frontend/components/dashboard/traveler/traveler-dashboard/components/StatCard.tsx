"use client";

import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBgClass: string;
  onClick?: () => void;
}

/**
 * Card displaying a single statistic
 */
export function StatCard({ title, value, subtitle, icon, iconBgClass, onClick }: StatCardProps) {
  return (
    <Card
      className={onClick ? "hover:bg-muted/50 cursor-pointer transition-colors" : ""}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBgClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
