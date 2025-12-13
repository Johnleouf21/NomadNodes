"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Scale, Gavel, BookOpen, Shield, Scroll } from "lucide-react";
import { EasterEggBadge, FloatingIconConfig } from "./shared/EasterEggBadge";

// Legal-themed icons for floating effect
const LEGAL_ICONS: FloatingIconConfig[] = [
  { icon: Scale, color: "#D97706" },
  { icon: Gavel, color: "#92400E" },
  { icon: BookOpen, color: "#78350F" },
  { icon: Shield, color: "#B45309" },
  { icon: Scroll, color: "#A16207" },
];

interface VictorEasterEggProps {
  children: React.ReactNode;
}

export function VictorEasterEgg({ children }: VictorEasterEggProps) {
  const [showBadge, setShowBadge] = useState(false);
  const typedKeysRef = useRef("");

  const triggerEasterEgg = useCallback(() => {
    setShowBadge(true);
  }, []);

  // Listen for "VICTOR" being typed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      typedKeysRef.current = (typedKeysRef.current + e.key.toUpperCase()).slice(-6);

      if (typedKeysRef.current === "VICTOR") {
        triggerEasterEgg();
        typedKeysRef.current = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerEasterEgg]);

  const closeBadge = useCallback(() => {
    setShowBadge(false);
  }, []);

  return (
    <div className="relative">
      {children}
      <EasterEggBadge
        show={showBadge}
        onClose={closeBadge}
        autoCloseMs={6000}
        backgroundGradient="bg-gradient-to-b from-amber-900 via-yellow-900 to-amber-950"
        floatingIcons={LEGAL_ICONS}
        floatingIconsCount={15}
        fallingEmoji="📜"
        fallingCount={25}
        badgeGradient="bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600"
        badgeBorderColor="rgba(251, 191, 36, 0.5)"
        glowGradient="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500"
        mainIcon={<Scale className="h-16 w-16 text-white drop-shadow-lg" />}
        miniIcons={[
          {
            icon: <span className="text-xl">✓</span>,
            gradient: "bg-gradient-to-r from-green-500 to-emerald-500",
            position: "top-right",
            bounce: true,
          },
          {
            icon: <Gavel className="h-5 w-5" />,
            gradient: "bg-gradient-to-r from-amber-600 to-yellow-600",
            position: "bottom-left",
          },
          {
            icon: <BookOpen className="h-5 w-5" />,
            gradient: "bg-gradient-to-r from-orange-500 to-red-500",
            position: "bottom-right",
          },
        ]}
        subtitle="⚖️ Expert Légal Certifié"
        subtitleColor="text-amber-400"
        title="Victor"
        titleGradient="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400"
        role="Gardien du Droit & Architecte Juridique"
        quote={
          <>
            &quot;Nul n&apos;est censé ignorer la loi...
            <br />
            sauf si elle est bien rédigée !&quot; 📜
          </>
        }
        tags={[
          { emoji: "⚖️", label: "CGU" },
          { emoji: "📜", label: "Contrats" },
          { emoji: "🛡️", label: "RGPD" },
          { emoji: "🔒", label: "Conformité" },
        ]}
        tagBgColor="bg-amber-900/50"
        tagTextColor="text-amber-300"
        tagBorderColor="border-amber-500/30"
        bouncingEmojis={["⚖️", "📜", "🏛️", "📜", "⚖️"]}
      />
    </div>
  );
}

// Wrapper for the date element specifically - triggers the full badge on triple-click
export function VictorDateTrigger({ children }: { children: React.ReactNode }) {
  const [showBadge, setShowBadge] = useState(false);

  const handleTripleClick = () => {
    setShowBadge(true);
  };

  const closeBadge = useCallback(() => {
    setShowBadge(false);
  }, []);

  return (
    <>
      <span
        onClick={(e) => {
          if (e.detail === 3) {
            handleTripleClick();
          }
        }}
        className="cursor-text select-text"
      >
        {children}
      </span>
      <EasterEggBadge
        show={showBadge}
        onClose={closeBadge}
        autoCloseMs={6000}
        backgroundGradient="bg-gradient-to-b from-amber-900 via-yellow-900 to-amber-950"
        floatingIcons={LEGAL_ICONS}
        floatingIconsCount={15}
        fallingEmoji="📜"
        fallingCount={25}
        badgeGradient="bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600"
        badgeBorderColor="rgba(251, 191, 36, 0.5)"
        glowGradient="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500"
        mainIcon={<Scale className="h-16 w-16 text-white drop-shadow-lg" />}
        miniIcons={[
          {
            icon: <span className="text-xl">✓</span>,
            gradient: "bg-gradient-to-r from-green-500 to-emerald-500",
            position: "top-right",
            bounce: true,
          },
          {
            icon: <Gavel className="h-5 w-5" />,
            gradient: "bg-gradient-to-r from-amber-600 to-yellow-600",
            position: "bottom-left",
          },
          {
            icon: <BookOpen className="h-5 w-5" />,
            gradient: "bg-gradient-to-r from-orange-500 to-red-500",
            position: "bottom-right",
          },
        ]}
        subtitle="⚖️ Expert Légal Certifié"
        subtitleColor="text-amber-400"
        title="Victor"
        titleGradient="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400"
        role="Gardien du Droit & Architecte Juridique"
        quote={
          <>
            &quot;Nul n&apos;est censé ignorer la loi...
            <br />
            sauf si elle est bien rédigée !&quot; 📜
          </>
        }
        tags={[
          { emoji: "⚖️", label: "CGU" },
          { emoji: "📜", label: "Contrats" },
          { emoji: "🛡️", label: "RGPD" },
          { emoji: "🔒", label: "Conformité" },
        ]}
        tagBgColor="bg-amber-900/50"
        tagTextColor="text-amber-300"
        tagBorderColor="border-amber-500/30"
        bouncingEmojis={["⚖️", "📜", "🏛️", "📜", "⚖️"]}
      />
    </>
  );
}
