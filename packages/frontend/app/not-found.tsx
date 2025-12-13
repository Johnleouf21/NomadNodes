"use client";

import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      {/* Animated 404 */}
      <div className="relative mb-8">
        <h1 className="font-heading text-[120px] leading-none font-bold text-transparent md:text-[180px]">
          <span className="animate-gradient bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_auto] bg-clip-text">
            404
          </span>
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl md:text-8xl">🏝️</span>
        </div>
      </div>

      {/* Message */}
      <h2 className="mb-3 text-2xl font-bold md:text-3xl">{t("error.404_title")}</h2>
      <p className="text-muted-foreground mb-8 max-w-md">{t("error.404_description")}</p>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-4">
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            {t("error.back_home")}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/explore">
            <Search className="mr-2 h-4 w-4" />
            {t("error.explore")}
          </Link>
        </Button>
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("error.go_back")}
        </Button>
      </div>
    </div>
  );
}
