"use client";

import * as React from "react";
import { Wallet, Search, Shield, Award } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Wallet,
    key: "step1",
  },
  {
    icon: Search,
    key: "step2",
  },
  {
    icon: Shield,
    key: "step3",
  },
  {
    icon: Award,
    key: "step4",
  },
];

export function HowItWorks() {
  const { t } = useTranslation();
  const refCallback = React.useCallback((node: HTMLElement | null) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <section ref={refCallback} className="py-16 md:py-24">
      <div className="container px-4">
        <div
          className={`mx-auto max-w-3xl text-center transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t("how_it_works.title")}
          </h2>
          <p className="text-muted-foreground mb-12 text-lg md:text-xl">
            {t("how_it_works.subtitle")}
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.key}
                className={`group hover:border-primary relative overflow-hidden border-2 transition-all duration-500 hover:scale-105 hover:shadow-xl ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="bg-primary/10 group-hover:bg-primary/20 mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110">
                    <Icon className="text-primary h-8 w-8 transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                  <div className="text-muted-foreground mb-2 text-sm font-semibold">
                    {t("common.next")} {index + 1}
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{t(`how_it_works.${step.key}_title`)}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t(`how_it_works.${step.key}_desc`)}
                  </p>
                </CardContent>
                <div className="from-primary/5 absolute inset-0 -z-10 bg-gradient-to-br to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
