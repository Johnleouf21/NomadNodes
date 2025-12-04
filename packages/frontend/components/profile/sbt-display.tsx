"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTravelerSBTData, useHostSBTData } from "@/lib/hooks/useSBTProfile";

export function SBTDisplay() {
  const { t } = useTranslation();
  const { address, hasTravelerSBT, hasHostSBT } = useAuth();

  const travelerData = useTravelerSBTData(address);
  const hostData = useHostSBTData(address);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="text-primary h-5 w-5" />
          {t("profile.soulbound_tokens")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Traveler SBT */}
        <div
          className={`relative overflow-hidden rounded-lg border-2 p-4 transition-all ${
            hasTravelerSBT
              ? "border-blue-500/50 bg-blue-500/10"
              : "border-muted-foreground/30 bg-muted/30 border-dashed"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield
                  className={`h-6 w-6 ${hasTravelerSBT ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
                />
                <h3 className="font-semibold">Traveler SBT</h3>
              </div>
              <p className="text-muted-foreground text-xs">
                {hasTravelerSBT ? "Active identity for booking properties" : "Not minted yet"}
              </p>
            </div>
            {hasTravelerSBT && <CheckCircle className="h-5 w-5 text-green-500" />}
          </div>

          {hasTravelerSBT && (
            <div className="mt-4">
              {travelerData.isLoading ? (
                <div className="bg-muted flex aspect-square w-full items-center justify-center rounded-lg">
                  <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                </div>
              ) : travelerData.imageData ? (
                <div className="aspect-square w-full overflow-hidden rounded-lg">
                  <img
                    src={travelerData.imageData}
                    alt="Traveler SBT"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <div className="flex h-full items-center justify-center">
                    <Shield className="h-20 w-20 text-white/20" />
                  </div>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Token ID</span>
                <Badge variant="outline">
                  #{travelerData.tokenId ? travelerData.tokenId.toString() : "1"}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Host SBT */}
        <div
          className={`relative overflow-hidden rounded-lg border-2 p-4 transition-all ${
            hasHostSBT
              ? "border-purple-500/50 bg-purple-500/10"
              : "border-muted-foreground/30 bg-muted/30 border-dashed"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield
                  className={`h-6 w-6 ${hasHostSBT ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground"}`}
                />
                <h3 className="font-semibold">Host SBT</h3>
              </div>
              <p className="text-muted-foreground text-xs">
                {hasHostSBT ? "Active identity for listing properties" : "Not minted yet"}
              </p>
            </div>
            {hasHostSBT && <CheckCircle className="h-5 w-5 text-green-500" />}
          </div>

          {hasHostSBT && (
            <div className="mt-4">
              {hostData.isLoading ? (
                <div className="bg-muted flex aspect-square w-full items-center justify-center rounded-lg">
                  <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                </div>
              ) : hostData.imageData ? (
                <div className="aspect-square w-full overflow-hidden rounded-lg">
                  <img
                    src={hostData.imageData}
                    alt="Host SBT"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <div className="flex h-full items-center justify-center">
                    <Shield className="h-20 w-20 text-white/20" />
                  </div>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Token ID</span>
                <Badge variant="outline">
                  #{hostData.tokenId ? hostData.tokenId.toString() : "1"}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Get Additional SBT */}
        {(!hasTravelerSBT || !hasHostSBT) && (
          <Link href="/onboarding" className="block">
            <Button variant="outline" className="w-full" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Get {!hasTravelerSBT ? "Traveler" : "Host"} SBT
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
