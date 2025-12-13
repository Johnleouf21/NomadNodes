"use client";

import * as React from "react";
import { Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
import { AdelieEasterEgg } from "@/components/easter-eggs/adelie-easter-egg";

// Vacation-themed background images from Unsplash
// ✨ Curated with love by Adélie ✨
const HERO_IMAGES = [
  // 🏖️ Beaches & Tropical
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80", // Tropical beach
  "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1920&q=80", // Maldives turquoise water
  "https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=1920&q=80", // Maldives overwater villa
  // 🏔️ Mountains & Nature
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80", // Mountain peaks
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80", // Swiss Alps
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80", // Snowy mountains at night
  // 🌆 Cities & Urban
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=80", // Paris Eiffel Tower
  "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1920&q=80", // Tokyo at night
  "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1920&q=80", // New York skyline
  // 🏡 Countryside & Retreats
  "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1920&q=80", // Tuscany countryside
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1920&q=80", // Luxury pool resort
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920&q=80", // Hotel pool at sunset
];

export function Hero() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isConnected, isConnecting } = useAuth();
  const { filters, setFilters } = useSearchStore();
  const hasRedirected = React.useRef(false);

  // Background image carousel state
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  // Auto-advance background images every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    <section className="relative flex min-h-[600px] items-center justify-center overflow-hidden">
      {/* Background Image Carousel */}
      {HERO_IMAGES.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentImageIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={src}
            alt={`Vacation destination ${index + 1}`}
            fill
            className="object-cover"
            priority={index === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Gradient overlay for brand consistency */}
      <div className="from-primary/20 absolute inset-0 bg-gradient-to-br to-purple-500/20" />

      <div className="relative z-10 container px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          {/* Title */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
            {t("hero.title")}
          </h1>

          {/* Subtitle */}
          <p className="mb-12 text-lg text-white/90 drop-shadow-md sm:text-xl md:text-2xl">
            {t("hero.subtitle")}
          </p>

          {/* Search Bar */}
          <div className="mx-auto max-w-4xl">
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
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                      Explore Properties
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <p className="text-sm text-white/80">
                    or{" "}
                    <button
                      onClick={() =>
                        document
                          .querySelector("appkit-button")
                          ?.shadowRoot?.querySelector("button")
                          ?.click()
                      }
                      className="font-medium text-white underline-offset-2 hover:underline"
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

      {/* Image Indicators */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentImageIndex ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Easter egg dedication */}
      <AdelieEasterEgg />
    </section>
  );
}
