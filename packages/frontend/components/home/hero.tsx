"use client";

import * as React from "react";
import { Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { GuestSelector } from "@/components/ui/guest-selector";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { useSearchStore } from "@/lib/store";
import { useAuth } from "@/lib/hooks/useAuth";
import { getAndClearRedirectPath } from "@/components/auth/protected-route";

export function Hero() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isConnected, isConnecting } = useAuth();
  const { filters, setFilters } = useSearchStore();
  const hasRedirected = React.useRef(false);

  // Redirect back to the original page after connection
  React.useEffect(() => {
    // Only redirect once, when connected and not still connecting
    if (isConnected && !isConnecting && !hasRedirected.current) {
      const redirectPath = getAndClearRedirectPath();
      if (redirectPath) {
        hasRedirected.current = true;
        router.push(redirectPath);
      }
    }
  }, [isConnected, isConnecting, router]);

  // Convert store dates to DateRange
  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (filters.checkIn || filters.checkOut) {
      return {
        from: filters.checkIn || undefined,
        to: filters.checkOut || undefined,
      };
    }
    return undefined;
  }, [filters.checkIn, filters.checkOut]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setFilters({
      checkIn: range?.from || null,
      checkOut: range?.to || null,
    });
  };

  const handleGuestsChange = (guests: number) => {
    setFilters({ guests });
  };

  const handleSearch = () => {
    router.push("/explore");
  };

  return (
    <section className="from-primary/10 via-background relative flex min-h-[600px] items-center justify-center overflow-hidden bg-gradient-to-br to-purple-500/10">
      <div className="relative z-10 container px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Title */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {t("hero.title")}
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground mb-12 text-lg sm:text-xl md:text-2xl">
            {t("hero.subtitle")}
          </p>

          {/* Search Bar */}
          <div className="mx-auto max-w-3xl">
            <div className="bg-card rounded-2xl border p-4 shadow-2xl">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
                {/* Location Input */}
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder={t("hero.search_placeholder")}
                    value={filters.location}
                    onChange={(e) => setFilters({ location: e.target.value })}
                    className="h-12 pl-10"
                  />
                </div>

                {/* Date Range Picker */}
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  placeholder={`${t("hero.check_in")} - ${t("hero.check_out")}`}
                  className="h-12 md:min-w-[240px]"
                  align="center"
                />

                {/* Guest Selector */}
                <GuestSelector
                  guests={filters.guests}
                  onGuestsChange={handleGuestsChange}
                  placeholder={t("hero.guests")}
                  className="h-12 md:min-w-[130px]"
                />

                {/* Search Button */}
                <Button className="h-12 px-8" size="lg" onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  {t("hero.search_button")}
                </Button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {!isConnected ? (
                <>
                  <Link href="/explore">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Explore Properties
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <p className="text-muted-foreground text-sm">
                    or{" "}
                    <button
                      onClick={() =>
                        document
                          .querySelector("appkit-button")
                          ?.shadowRoot?.querySelector("button")
                          ?.click()
                      }
                      className="text-primary font-medium hover:underline"
                    >
                      connect your wallet
                    </button>{" "}
                    to get started
                  </p>
                </>
              ) : (
                <Link href="/onboarding">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
    </section>
  );
}
