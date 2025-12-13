"use client";

import { useRouter } from "next/navigation";
import { User, Star, MessageSquare, Calendar } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatTravelerRating,
  getTierColor,
  getTierEmoji,
  type TravelerTier,
  type PonderTraveler,
} from "@/hooks/usePonderTraveler";

interface ProfileCardProps {
  address: string | undefined;
  traveler: PonderTraveler | null;
  calculatedAvgRating: number | null;
  nonFlaggedReviewCount: number;
  onReviewsClick: () => void;
}

export function ProfileCard({
  address,
  traveler,
  calculatedAvgRating,
  nonFlaggedReviewCount,
  onReviewsClick,
}: ProfileCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          {/* Avatar */}
          <div className="from-primary/20 to-primary/40 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br">
            <User className="text-primary h-10 w-10" />
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h2 className="text-2xl font-bold">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Anonymous"}
              </h2>
              {traveler && (
                <Badge className={`${getTierColor(traveler.tier as TravelerTier)} border`}>
                  {getTierEmoji(traveler.tier as TravelerTier)} {traveler.tier}
                </Badge>
              )}
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
              {traveler && (
                <>
                  <button
                    onClick={onReviewsClick}
                    className="hover:bg-muted flex items-center gap-1 rounded-md px-2 py-1 transition-colors"
                  >
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-foreground font-medium">
                      {calculatedAvgRating !== null
                        ? calculatedAvgRating.toFixed(2)
                        : formatTravelerRating(traveler.averageRating).toFixed(2)}
                    </span>
                    <span>rating</span>
                    <span className="text-muted-foreground/60">•</span>
                    <MessageSquare className="h-4 w-4" />
                    <span>
                      {nonFlaggedReviewCount > 0
                        ? nonFlaggedReviewCount
                        : traveler.totalReviewsReceived}{" "}
                      reviews
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Member since{" "}
                      {new Date(Number(traveler.memberSince) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
              {!traveler && <span>Complete your first booking to build your traveler profile</span>}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              {t("nav.profile")}
            </Button>
            <Button onClick={() => router.push("/explore")}>{t("nav.explore")}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
