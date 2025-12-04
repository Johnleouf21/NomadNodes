"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Loader2, ShieldAlert, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/hooks/useTranslation";

// Key for storing redirect path in sessionStorage
const REDIRECT_PATH_KEY = "nomadnodes_redirect_path";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSBT?: "traveler" | "host" | "any";
  fallbackUrl?: string;
}

export function ProtectedRoute({ children, requireSBT, fallbackUrl = "/" }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isConnected, isConnecting, isLoadingSBTs, hasTravelerSBT, hasHostSBT } = useAuth();
  const [shouldRender, setShouldRender] = React.useState(false);
  // Track client-side mount to prevent SSR hydration issues
  const [hasMounted, setHasMounted] = React.useState(false);

  // Mark as mounted after first client render
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    // Don't do anything until client is mounted
    if (!hasMounted) {
      return;
    }

    // Wait for all checks to complete
    if (isConnecting || isLoadingSBTs) {
      return;
    }

    // Not connected - save current path and redirect
    if (!isConnected) {
      // Save the current path so we can redirect back after connection
      if (typeof window !== "undefined" && pathname && pathname !== "/") {
        sessionStorage.setItem(REDIRECT_PATH_KEY, pathname);
      }
      router.push(fallbackUrl);
      return;
    }

    // Check SBT requirements
    if (requireSBT) {
      const hasRequiredSBT =
        (requireSBT === "traveler" && hasTravelerSBT) ||
        (requireSBT === "host" && hasHostSBT) ||
        (requireSBT === "any" && (hasTravelerSBT || hasHostSBT));

      if (!hasRequiredSBT) {
        setShouldRender(false);
        return;
      }
    }

    setShouldRender(true);
  }, [
    hasMounted,
    isConnected,
    isConnecting,
    isLoadingSBTs,
    requireSBT,
    hasTravelerSBT,
    hasHostSBT,
    router,
    fallbackUrl,
    pathname,
  ]);

  // Loading state - show loading during SSR, before mount, or while connecting
  if (!hasMounted || isConnecting || isLoadingSBTs) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Not connected (only checked after mount and connection check complete)
  if (!isConnected) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Wallet className="text-primary h-8 w-8" />
            </div>
            <CardTitle>Wallet Connection Required</CardTitle>
            <CardDescription>You need to connect your wallet to access this page</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/")}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Missing required SBT
  if (requireSBT && !shouldRender) {
    const sbtName = requireSBT === "traveler" ? "Traveler" : requireSBT === "host" ? "Host" : "";

    return (
      <div className="container flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
              <ShieldAlert className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
            </div>
            <CardTitle>{sbtName} SBT Required</CardTitle>
            <CardDescription>
              You need a {sbtName} Soulbound Token to access this page. Get your identity token to
              continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => router.push("/onboarding")}>
              Get Your SBT
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children only if all checks pass
  return shouldRender ? <>{children}</> : null;
}

/**
 * Get and clear the stored redirect path
 * Call this after successful connection to redirect back to the original page
 */
export function getAndClearRedirectPath(): string | null {
  if (typeof window === "undefined") return null;
  const path = sessionStorage.getItem(REDIRECT_PATH_KEY);
  if (path) {
    sessionStorage.removeItem(REDIRECT_PATH_KEY);
  }
  return path;
}
