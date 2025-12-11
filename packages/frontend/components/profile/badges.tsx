"use client";

import * as React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Award,
  Star,
  Zap,
  Users,
  Home,
  Lock,
  Loader2,
  Plane,
  Map,
  Globe,
  MessageSquare,
  Crown,
  ThumbsUp,
  Shield,
  DollarSign,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  useUserAchievements,
  type UserAchievement,
  type AchievementCategory,
  type AchievementRarity,
} from "@/lib/hooks/useUserProfile";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Award,
  Star,
  Zap,
  Users,
  Home,
  Plane,
  Map,
  Globe,
  MessageSquare,
  Crown,
  ThumbsUp,
  Shield,
  DollarSign,
};

// Rarity config with colors and labels
const rarityConfig: Record<
  AchievementRarity,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  common: {
    label: "Common",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
  },
  rare: {
    label: "Rare",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  epic: {
    label: "Epic",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  legendary: {
    label: "Legendary",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
};

// Rarity order for sorting (legendary first)
const rarityOrder: Record<AchievementRarity, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
};

export function Badges() {
  const { t } = useTranslation();
  const { address } = useAuth();
  const { achievements, isLoading } = useUserAchievements(address);
  const [showAll, setShowAll] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState<AchievementCategory | "all">("all");

  const earnedCount = achievements.filter((b) => b.earned).length;

  // Count by rarity
  const earnedByRarity = React.useMemo(() => {
    const counts: Record<AchievementRarity, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };
    achievements.forEach((a) => {
      if (a.earned) counts[a.rarity]++;
    });
    return counts;
  }, [achievements]);

  // Sort and filter achievements
  const sortedAchievements = React.useMemo(() => {
    let filtered = achievements;

    // Filter by category if not "all"
    if (activeCategory !== "all") {
      filtered = filtered.filter((a) => a.category === activeCategory);
    }

    // Sort: earned first, then by rarity (legendary > epic > rare > common)
    return [...filtered].sort((a, b) => {
      // Earned first
      if (a.earned && !b.earned) return -1;
      if (!a.earned && b.earned) return 1;
      // Then by rarity
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
  }, [achievements, activeCategory]);

  // Show only first 6 if not expanded
  const displayedAchievements = showAll ? sortedAchievements : sortedAchievements.slice(0, 6);
  const hasMore = sortedAchievements.length > 6;

  if (isLoading) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="text-primary h-5 w-5" />
              {t("profile.badges")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="text-primary h-5 w-5" />
            {t("profile.badges")}
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {earnedCount}/{achievements.length}
          </Badge>
        </div>

        {/* Rarity summary */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(["legendary", "epic", "rare", "common"] as AchievementRarity[]).map((rarity) => {
            const config = rarityConfig[rarity];
            const count = earnedByRarity[rarity];
            if (count === 0) return null;
            return (
              <Badge
                key={rarity}
                variant="outline"
                className={`${config.color} ${config.bgColor} text-[10px]`}
              >
                {count} {config.label}
              </Badge>
            );
          })}
        </div>

        {/* Category filter buttons */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(["all", "community", "traveler", "host"] as const).map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setActiveCategory(cat)}
            >
              {cat === "all" ? (
                "All"
              ) : cat === "community" ? (
                <Users className="mr-1 h-3 w-3" />
              ) : cat === "traveler" ? (
                <Plane className="mr-1 h-3 w-3" />
              ) : (
                <Home className="mr-1 h-3 w-3" />
              )}
              {cat !== "all" && <span className="capitalize">{cat}</span>}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className={showAll ? "h-[350px]" : "h-[220px]"}>
          <div className="grid gap-2">
            {displayedAchievements.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                <Lock className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No achievements in this category yet</p>
              </div>
            ) : (
              displayedAchievements.map((badge) => (
                <BadgeItemCompact key={badge.id} badge={badge} />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Show more/less button */}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <ChevronUp className="mr-1 h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-4 w-4" />
                Show {sortedAchievements.length - 6} more
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Compact badge item for the new layout
function BadgeItemCompact({ badge }: { badge: UserAchievement }) {
  const Icon = iconMap[badge.icon] || Award;
  const hasProgress = badge.maxProgress !== undefined && badge.progress !== undefined;
  const progressPercent = hasProgress
    ? Math.min((badge.progress! / badge.maxProgress!) * 100, 100)
    : 0;
  const rarityInfo = rarityConfig[badge.rarity];

  return (
    <div
      className={`group relative flex items-center gap-3 rounded-lg border p-2.5 transition-all hover:shadow-sm ${
        badge.earned
          ? `${rarityInfo.borderColor} ${rarityInfo.bgColor}`
          : "border-muted bg-muted/30 opacity-60"
      }`}
    >
      {/* Icon */}
      <div
        className={`relative shrink-0 rounded-full p-2 transition-transform group-hover:scale-105 ${
          badge.earned ? badge.bgColor : "bg-muted"
        }`}
      >
        {badge.earned ? (
          <Icon className={`h-4 w-4 ${badge.color}`} />
        ) : (
          <Lock className="text-muted-foreground h-4 w-4" />
        )}
        {/* Rarity glow for legendary */}
        {badge.earned && badge.rarity === "legendary" && (
          <div className="absolute inset-0 animate-pulse rounded-full bg-amber-400/20" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className={`truncate text-sm font-medium ${badge.earned ? "" : "text-muted-foreground"}`}
          >
            {badge.name}
          </p>
          {/* Rarity badge */}
          <Badge
            variant="outline"
            className={`h-4 px-1 text-[9px] ${rarityInfo.color} ${rarityInfo.bgColor} border-transparent`}
          >
            {rarityInfo.label}
          </Badge>
        </div>

        {/* Description - always show */}
        <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{badge.description}</p>

        {/* Progress bar for unearned badges with progress */}
        {hasProgress && !badge.earned && (
          <div className="mt-1 flex items-center gap-2">
            <Progress value={progressPercent} className="h-1 flex-1" />
            <span className="text-muted-foreground shrink-0 text-[10px]">
              {badge.progress}/{badge.maxProgress}
            </span>
          </div>
        )}

        {/* Unlock hint for unearned badges */}
        {!badge.earned && (
          <p className="text-primary/70 mt-1 truncate text-[10px] italic">{badge.unlockHint}</p>
        )}
      </div>

      {/* Earned indicator */}
      {badge.earned && (
        <div className="shrink-0 text-green-500">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
