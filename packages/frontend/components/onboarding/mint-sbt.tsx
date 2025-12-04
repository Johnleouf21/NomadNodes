"use client";

import * as React from "react";
import { Shield, CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { UserRole } from "@/lib/store";
import { useAuth } from "@/lib/hooks/useAuth";
import { useMintSBT } from "@/lib/hooks/useMintSBT";

interface MintSBTProps {
  role: UserRole;
  onComplete: () => void;
}

export function MintSBT({ role, onComplete }: MintSBTProps) {
  const { t } = useTranslation();
  const { address, hasTravelerSBT, hasHostSBT } = useAuth();

  const {
    mint,
    isMinting,
    isSuccess,
    error,
    mintingStep,
    isTravelerSuccess,
    isHostSuccess,
    needsTravelerSBT,
    needsHostSBT,
  } = useMintSBT({
    role,
    address,
    hasTravelerSBT,
    hasHostSBT,
    onSuccess: () => {
      // Redirect after 2 seconds on success
      setTimeout(() => {
        onComplete();
      }, 2000);
    },
  });

  // If user already has required SBTs, skip minting
  React.useEffect(() => {
    if (!needsTravelerSBT && !needsHostSBT) {
      onComplete();
    }
  }, [needsTravelerSBT, needsHostSBT, onComplete]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
          <Shield className="text-primary h-10 w-10" />
        </div>
        <h2 className="mb-2 text-3xl font-bold">{t("onboarding.mint_sbt")}</h2>
        <p className="text-muted-foreground">
          Get your on-chain identity to start using NomadNodes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Identity Tokens</CardTitle>
          <CardDescription>You need the following SBT(s) for your selected role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {needsTravelerSBT && (
            <div
              className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
                mintingStep === "traveler" || isTravelerSuccess
                  ? "border-blue-500 bg-blue-500/10"
                  : ""
              }`}
            >
              <Shield className="h-8 w-8 text-blue-500" />
              <div className="flex-1">
                <h3 className="font-semibold">Traveler SBT</h3>
                <p className="text-muted-foreground text-sm">Required to book properties</p>
              </div>
              {mintingStep === "traveler" && !isTravelerSuccess && (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              )}
              {isTravelerSuccess && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </div>
          )}

          {needsHostSBT && (
            <div
              className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
                mintingStep === "host" || isHostSuccess ? "border-purple-500 bg-purple-500/10" : ""
              }`}
            >
              <Shield className="h-8 w-8 text-purple-500" />
              <div className="flex-1">
                <h3 className="font-semibold">Host SBT</h3>
                <p className="text-muted-foreground text-sm">Required to list properties</p>
              </div>
              {mintingStep === "host" && !isHostSuccess && (
                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
              )}
              {isHostSuccess && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </div>
          )}

          <div className="bg-muted/50 flex items-center gap-4 rounded-lg p-4">
            <Info className="text-muted-foreground h-5 w-5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{t("onboarding.free_mint")}</p>
              <p className="text-muted-foreground text-xs">{t("onboarding.one_time")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isSuccess && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700 dark:text-green-400">
            {t("onboarding.mint_success")}
          </AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-500">
            Redirecting you to your dashboard...
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("onboarding.mint_error")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="what-is-sbt">
          <AccordionTrigger>{t("onboarding.what_is_sbt")}</AccordionTrigger>
          <AccordionContent>
            <p className="text-muted-foreground text-sm">{t("onboarding.sbt_explanation")}</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="why-need">
          <AccordionTrigger>{t("onboarding.why_need_sbt")}</AccordionTrigger>
          <AccordionContent>
            <p className="text-muted-foreground text-sm">{t("onboarding.sbt_benefits")}</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onComplete} disabled={isMinting}>
          {t("onboarding.skip_for_now")}
        </Button>
        <Button size="lg" disabled={isMinting || isSuccess} onClick={mint}>
          {isMinting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mintingStep === "traveler" ? "Minting Traveler SBT..." : "Minting Host SBT..."}
            </>
          ) : (
            <>
              {role === "both"
                ? "Mint Both SBTs"
                : `Mint ${role === "traveler" ? "Traveler" : "Host"} SBT`}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
