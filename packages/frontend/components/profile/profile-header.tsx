"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, MapPin, Calendar, Shield } from "lucide-react";
import { formatAddress } from "@/lib/utils";
import { useTravelerSBTData, useHostSBTData, getTierName } from "@/lib/hooks/useSBTProfile";

export function ProfileHeader() {
  const { t } = useTranslation();
  const { address, hasTravelerSBT, hasHostSBT, role } = useAuth();

  const travelerData = useTravelerSBTData(address);
  const hostData = useHostSBTData(address);

  // Get member since date from the earliest SBT
  const getMemberSince = () => {
    const dates = [];
    if (travelerData.profile?.memberSince) {
      dates.push(Number(travelerData.profile.memberSince));
    }
    if (hostData.profile?.memberSince) {
      dates.push(Number(hostData.profile.memberSince));
    }
    if (dates.length === 0) return "Recently joined";

    const earliestDate = new Date(Math.min(...dates) * 1000);
    return `Member since ${earliestDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  };

  // Get tier badge
  const getTierBadge = () => {
    if (hasTravelerSBT && travelerData.profile) {
      const tierName = getTierName(travelerData.profile.tier, true);
      return (
        <Badge variant="outline" className="text-xs">
          {tierName}
        </Badge>
      );
    }
    if (hasHostSBT && hostData.profile) {
      const tierName = getTierName(hostData.profile.tier, false);
      return (
        <Badge variant="outline" className="text-xs">
          {tierName} {hostData.profile.superHost && "⭐"}
        </Badge>
      );
    }
    return null;
  };

  const getRoleBadge = () => {
    if (role === "both") {
      return (
        <>
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Shield className="mr-1 h-3 w-3" />
            Traveler
          </Badge>
          <Badge
            variant="secondary"
            className="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          >
            <Shield className="mr-1 h-3 w-3" />
            Host
          </Badge>
        </>
      );
    }
    if (hasTravelerSBT) {
      return (
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Shield className="mr-1 h-3 w-3" />
          Traveler
        </Badge>
      );
    }
    if (hasHostSBT) {
      return (
        <Badge
          variant="secondary"
          className="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        >
          <Shield className="mr-1 h-3 w-3" />
          Host
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden">
      {/* Cover Image */}
      <div className="from-primary h-32 bg-gradient-to-r to-purple-600" />

      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="-mt-16 mb-4">
          <Avatar className="border-background h-32 w-32 border-4">
            <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${address}`} />
            <AvatarFallback>{address?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            {/* Address & Role */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">
                {address ? formatAddress(address) : "Anonymous"}
              </h1>
              {getRoleBadge()}
              {getTierBadge()}
            </div>

            {/* Metadata */}
            <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{getMemberSince()}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>Location not set</span>
              </div>
            </div>

            {/* Bio */}
            <p className="text-muted-foreground max-w-2xl text-sm">
              Welcome to my NomadNodes profile! Exploring the world one decentralized booking at a
              time.
            </p>
          </div>

          {/* Edit Button */}
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            {t("profile.edit")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
