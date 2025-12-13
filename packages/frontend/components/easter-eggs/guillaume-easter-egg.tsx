"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bitcoin, TrendingUp, Sparkles, Wallet, LineChart } from "lucide-react";
import { EasterEggBadge, FloatingIconConfig } from "./shared/EasterEggBadge";

// Konami Code: ↑↑↓↓←→←→BA (supports both QWERTY KeyA and AZERTY KeyQ)
const KONAMI_PREFIX = "ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightKeyB";

// Bitcoin-themed icons for floating effect
const BITCOIN_ICONS: FloatingIconConfig[] = [
  { icon: Bitcoin, color: "#F7931A" },
  { icon: TrendingUp, color: "#22C55E" },
  { icon: Wallet, color: "#F59E0B" },
  { icon: LineChart, color: "#3B82F6" },
  { icon: Sparkles, color: "#EAB308" },
];

export function GuillaumeEasterEgg() {
  const [showBadge, setShowBadge] = useState(false);
  const keySequenceRef = useRef("");

  const triggerEasterEggCallback = useCallback(() => {
    setShowBadge(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Append key to sequence, keep only last ~80 chars (enough for konami code)
      keySequenceRef.current = (keySequenceRef.current + e.code).slice(-80);

      // Check if sequence ends with Konami code (accept both KeyA for QWERTY and KeyQ for AZERTY)
      if (
        keySequenceRef.current.endsWith(KONAMI_PREFIX + "KeyA") ||
        keySequenceRef.current.endsWith(KONAMI_PREFIX + "KeyQ")
      ) {
        triggerEasterEggCallback();
        keySequenceRef.current = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerEasterEggCallback]);

  const closeBadge = useCallback(() => {
    setShowBadge(false);
  }, []);

  return (
    <EasterEggBadge
      show={showBadge}
      onClose={closeBadge}
      autoCloseMs={6000}
      backgroundGradient="bg-gradient-to-b from-orange-900 via-amber-900 to-yellow-950"
      floatingIcons={BITCOIN_ICONS}
      floatingIconsCount={15}
      fallingEmoji="🪙"
      fallingCount={30}
      badgeGradient="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500"
      badgeBorderColor="rgba(249, 115, 22, 0.5)"
      glowGradient="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"
      mainIcon={<Bitcoin className="h-16 w-16 text-white drop-shadow-lg" />}
      miniIcons={[
        {
          icon: <TrendingUp className="h-6 w-6" />,
          gradient: "bg-gradient-to-r from-green-500 to-emerald-500",
          position: "top-right",
          bounce: true,
        },
        {
          icon: <Wallet className="h-5 w-5" />,
          gradient: "bg-gradient-to-r from-blue-500 to-cyan-500",
          position: "bottom-left",
        },
        {
          icon: <LineChart className="h-5 w-5" />,
          gradient: "bg-gradient-to-r from-purple-500 to-pink-500",
          position: "bottom-right",
        },
      ]}
      subtitle="🎮 Konami Code Activated!"
      subtitleColor="text-orange-400"
      title="Guillaume"
      titleGradient="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400"
      role="Blockchain Consultant & Bitcoin Maximalist"
      quote={
        <>
          &quot;In Bitcoin We Trust.
          <br />
          21 millions, pas un de plus !&quot; ₿
        </>
      }
      tags={[
        { emoji: "₿", label: "Bitcoin" },
        { emoji: "⛓️", label: "Blockchain" },
        { emoji: "🔮", label: "DeFi" },
        { emoji: "💎", label: "HODL" },
      ]}
      tagBgColor="bg-orange-900/50"
      tagTextColor="text-orange-300"
      tagBorderColor="border-orange-500/30"
      bouncingEmojis={["🪙", "📈", "💰", "📈", "🪙"]}
    />
  );
}
