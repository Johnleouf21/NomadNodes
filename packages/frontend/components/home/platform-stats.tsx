"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Building2, Users, Calendar, Star } from "lucide-react";
import { useGlobalStats } from "@/lib/hooks/contracts/adminPlatform";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface StatItemProps {
  icon: React.ElementType;
  value: string;
  label: string;
  isLoading: boolean;
  delay?: number;
}

function AnimatedNumber({ value, isLoading }: { value: string; isLoading: boolean }) {
  const [displayValue, setDisplayValue] = useState("0");
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isLoading || hasAnimated) return;

    // Extract numeric part and suffix
    const match = value.match(/^([\d.]+)(.*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const targetNum = parseFloat(match[1]);
    const suffix = match[2] || "";
    const duration = 1500;
    const steps = 30;
    const stepTime = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = targetNum * easeProgress;

      if (suffix === "K" || suffix === "M") {
        setDisplayValue(`${currentValue.toFixed(1)}${suffix}`);
      } else {
        setDisplayValue(`${Math.round(currentValue)}${suffix}`);
      }

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
        setHasAnimated(true);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, isLoading, hasAnimated]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <div className="bg-muted h-9 w-12 animate-pulse rounded" />
        <div className="bg-muted h-9 w-6 animate-pulse rounded opacity-50" />
      </div>
    );
  }

  return <span className="tabular-nums">{displayValue}</span>;
}

function StatItem({ icon: Icon, value, label, isLoading, delay = 0 }: StatItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`flex flex-col items-center text-center transition-all duration-500 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="bg-primary/10 mb-3 flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-300 hover:scale-110">
        <Icon className="text-primary h-7 w-7" />
      </div>
      <div className="font-heading text-3xl font-bold md:text-4xl">
        <AnimatedNumber value={value} isLoading={isLoading} />
      </div>
      <div className="text-muted-foreground mt-1 text-sm">{label}</div>
    </div>
  );
}

export function PlatformStats() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useGlobalStats();

  // Format numbers with K/M suffix for large numbers
  const formatNumber = (num: number | string | undefined): string => {
    if (!num) return "0";
    const n = typeof num === "string" ? parseInt(num) : num;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const statItems = [
    {
      icon: Building2,
      value: formatNumber(stats?.totalActiveProperties),
      label: t("stats.properties"),
    },
    {
      icon: Users,
      value: formatNumber(
        (parseInt(stats?.totalHosts || "0") + parseInt(stats?.totalTravelers || "0")).toString()
      ),
      label: t("stats.users"),
    },
    {
      icon: Calendar,
      value: formatNumber(stats?.totalCompletedBookings),
      label: t("stats.bookings"),
    },
    {
      icon: Star,
      value: formatNumber(stats?.totalReviews),
      label: t("stats.reviews"),
    },
  ];

  return (
    <section className="border-y py-12 md:py-16">
      <div className="container px-4">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold md:text-3xl">{t("stats.title")}</h2>
          <p className="text-muted-foreground">{t("stats.subtitle")}</p>
        </div>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
          {statItems.map((stat, index) => (
            <StatItem
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              isLoading={isLoading}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
