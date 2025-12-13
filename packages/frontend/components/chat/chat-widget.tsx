"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  X,
  Palmtree,
  Mountain,
  Building2,
  TreePine,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface QuickQuestion {
  key: string;
  icon: React.ElementType;
}

const quickQuestions: QuickQuestion[] = [
  { key: "what_is_sbt", icon: HelpCircle },
  { key: "how_to_book", icon: HelpCircle },
  { key: "payment_methods", icon: HelpCircle },
  { key: "how_reviews_work", icon: HelpCircle },
];

const themes = [
  { key: "beach", icon: Palmtree, filter: "beach" },
  { key: "mountain", icon: Mountain, filter: "mountain" },
  { key: "city", icon: Building2, filter: "city" },
  { key: "nature", icon: TreePine, filter: "nature" },
];

export function ChatWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeAnswer, setActiveAnswer] = useState<string | null>(null);

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          "bg-primary hover:bg-primary/90 hover:scale-110",
          isOpen && "rotate-90"
        )}
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Panel */}
      <Card
        className={cn(
          "fixed right-6 bottom-24 z-50 w-80 overflow-hidden shadow-2xl transition-all duration-300 md:w-96",
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        {/* Header */}
        <div className="bg-primary p-4 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-heading text-lg font-bold">{t("chat.title")}</h3>
          </div>
          <p className="mt-1 text-sm text-white/80">{t("chat.subtitle")}</p>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto p-4">
          {activeAnswer ? (
            // Answer View
            <div className="space-y-4">
              <button
                onClick={() => setActiveAnswer(null)}
                className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
              >
                ← {t("chat.back")}
              </button>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm leading-relaxed">{t(`chat.answers.${activeAnswer}`)}</p>
              </div>
              <Link
                href="/faq"
                className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
                onClick={() => setIsOpen(false)}
              >
                {t("chat.more_faq")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            // Main View
            <div className="space-y-6">
              {/* Theme Suggestions */}
              <div>
                <h4 className="mb-3 text-sm font-semibold">{t("chat.explore_themes")}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {themes.map((theme) => {
                    const Icon = theme.icon;
                    return (
                      <Link
                        key={theme.key}
                        href={`/explore?theme=${theme.filter}`}
                        onClick={() => setIsOpen(false)}
                        className="bg-muted hover:bg-primary/10 hover:border-primary flex items-center gap-2 rounded-lg border p-3 transition-colors"
                      >
                        <Icon className="text-primary h-5 w-5" />
                        <span className="text-sm font-medium">{t(`chat.themes.${theme.key}`)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Quick Questions */}
              <div>
                <h4 className="mb-3 text-sm font-semibold">{t("chat.quick_questions")}</h4>
                <div className="space-y-2">
                  {quickQuestions.map((q) => (
                    <button
                      key={q.key}
                      onClick={() => setActiveAnswer(q.key)}
                      className="hover:bg-muted flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors"
                    >
                      <HelpCircle className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{t(`chat.questions.${q.key}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="border-t pt-4">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/faq"
                    onClick={() => setIsOpen(false)}
                    className="bg-muted hover:bg-muted/80 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    📚 FAQ
                  </Link>
                  <Link
                    href="/onboarding"
                    onClick={() => setIsOpen(false)}
                    className="bg-muted hover:bg-muted/80 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    🚀 {t("chat.get_started")}
                  </Link>
                  <Link
                    href="/explore"
                    onClick={() => setIsOpen(false)}
                    className="bg-muted hover:bg-muted/80 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    🔍 {t("chat.explore")}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
