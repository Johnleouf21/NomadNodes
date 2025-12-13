"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Anchor, Compass, Map, Ship, Gem, Skull } from "lucide-react";
import { EasterEggBadge, FloatingIconConfig } from "./shared/EasterEggBadge";

interface AdelieEasterEggProps {
  children?: React.ReactNode;
}

// Pirate icons that float around
const PIRATE_ICONS: FloatingIconConfig[] = [
  { icon: Anchor, color: "#1E3A5F" },
  { icon: Compass, color: "#D4AF37" },
  { icon: Map, color: "#8B4513" },
  { icon: Ship, color: "#2C5F7C" },
  { icon: Gem, color: "#E91E63" },
  { icon: Skull, color: "#333333" },
];

// Number of clicks required and time window
const REQUIRED_CLICKS = 5;
const CLICK_WINDOW_MS = 2000; // 2 seconds to complete all clicks

export function AdelieEasterEgg({ children }: AdelieEasterEggProps) {
  const [showBadge, setShowBadge] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    // Clear previous timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const newCount = clickCount + 1;
    setClickCount(newCount);

    // Check if we reached the required clicks
    if (newCount >= REQUIRED_CLICKS) {
      setShowBadge(true);
      setClickCount(0);
      return;
    }

    // Reset click count after time window expires
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, CLICK_WINDOW_MS);
  };

  const closeBadge = useCallback(() => {
    setShowBadge(false);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <button
        onClick={handleClick}
        className="absolute right-4 bottom-4 z-20 hidden cursor-pointer text-[10px] text-white/30 transition-all select-none hover:text-white/60 sm:block"
      >
        {children || "🏴‍☠️ Curated by Captain Adélie"}
        {clickCount > 0 && clickCount < REQUIRED_CLICKS && (
          <span className="ml-1 text-amber-400/60">{"🪙".repeat(clickCount)}</span>
        )}
      </button>
      <EasterEggBadge
        show={showBadge}
        onClose={closeBadge}
        autoCloseMs={6000}
        backgroundGradient="bg-gradient-to-b from-sky-900 via-blue-900 to-slate-900"
        floatingIcons={PIRATE_ICONS}
        floatingIconsCount={15}
        fallingEmoji="🪙"
        fallingCount={30}
        badgeGradient="bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700"
        badgeBorderColor="rgba(245, 158, 11, 0.5)"
        glowGradient="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500"
        mainEmoji="🏴‍☠️"
        miniIcons={[
          {
            icon: <Compass className="h-6 w-6" />,
            gradient: "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900",
            position: "top-right",
            bounce: true,
          },
          {
            icon: <Gem className="h-5 w-5" />,
            gradient: "bg-gradient-to-r from-red-600 to-red-700",
            position: "bottom-left",
          },
          {
            icon: <Anchor className="h-5 w-5" />,
            gradient: "bg-gradient-to-r from-blue-600 to-cyan-600",
            position: "bottom-right",
          },
        ]}
        subtitle="🏴‍☠️ Captain of Curation"
        subtitleColor="text-amber-400"
        title="Adélie"
        titleGradient="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400"
        role="Visual Pirate & Treasure Hunter"
        quote={
          <>
            &quot;Les vrais trésors ne sont pas dans les coffres,
            <br />
            mais dans les destinations qu&apos;on découvre.&quot; 🗺️
          </>
        }
        tags={[
          { emoji: "🏝️", label: "Îles" },
          { emoji: "⚓", label: "Ports" },
          { emoji: "🌅", label: "Horizons" },
          { emoji: "💎", label: "Trésors" },
        ]}
        tagBgColor="bg-amber-900/50"
        tagTextColor="text-amber-300"
        tagBorderColor="border-amber-500/30"
        bouncingEmojis={["🪙", "💎", "🏆", "💰", "🪙"]}
      />
    </>
  );
}
