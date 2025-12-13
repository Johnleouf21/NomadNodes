"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LucideIcon } from "lucide-react";

export interface FloatingIconConfig {
  icon: LucideIcon;
  color: string;
}

export interface EasterEggBadgeProps {
  show: boolean;
  onClose: () => void;
  // Background
  backgroundGradient: string;
  // Floating icons
  floatingIcons?: FloatingIconConfig[];
  floatingIconsCount?: number;
  // Falling items
  fallingEmoji?: string;
  fallingCount?: number;
  // Badge colors
  badgeGradient: string;
  badgeBorderColor: string;
  glowGradient: string;
  // Main icon
  mainIcon?: React.ReactNode;
  mainEmoji?: string;
  // Mini icons around main badge
  miniIcons?: Array<{
    icon: React.ReactNode;
    gradient: string;
    position: "top-right" | "bottom-left" | "bottom-right";
    bounce?: boolean;
  }>;
  // Text
  subtitle: string;
  subtitleColor: string;
  title: string;
  titleGradient: string;
  role: string;
  quote: React.ReactNode;
  // Tags
  tags: Array<{ emoji: string; label: string }>;
  tagBgColor: string;
  tagTextColor: string;
  tagBorderColor: string;
  // Bouncing emojis
  bouncingEmojis: string[];
  // Z-index
  zIndex?: number;
  // Auto-close
  autoCloseMs?: number;
}

interface FloatingItem {
  id: number;
  x: number;
  y: number;
  icon?: number;
  delay: number;
  duration: number;
}

interface FallingItem {
  id: number;
  x: number;
  delay: number;
}

export function EasterEggBadge({
  show,
  onClose,
  backgroundGradient,
  floatingIcons = [],
  floatingIconsCount = 15,
  fallingEmoji,
  fallingCount = 30,
  badgeGradient,
  badgeBorderColor,
  glowGradient,
  mainIcon,
  mainEmoji,
  miniIcons = [],
  subtitle,
  subtitleColor,
  title,
  titleGradient,
  role,
  quote,
  tags,
  tagBgColor,
  tagTextColor,
  tagBorderColor,
  bouncingEmojis,
  zIndex = 100,
  autoCloseMs,
}: EasterEggBadgeProps) {
  const [mounted, setMounted] = useState(false);
  const [floating, setFloating] = useState<FloatingItem[]>([]);
  const [falling, setFalling] = useState<FallingItem[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (show) {
      // Generate floating icons
      if (floatingIcons.length > 0) {
        const items = Array.from({ length: floatingIconsCount }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          icon: Math.floor(Math.random() * floatingIcons.length),
          delay: Math.random() * 2,
          duration: 3 + Math.random() * 2,
        }));
        setFloating(items);
      }

      // Generate falling items
      if (fallingEmoji) {
        const items = Array.from({ length: fallingCount }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 1,
        }));
        setFalling(items);
      }

      // Auto-close
      if (autoCloseMs) {
        const timer = setTimeout(() => {
          onClose();
        }, autoCloseMs);
        return () => clearTimeout(timer);
      }
    } else {
      setFloating([]);
      setFalling([]);
    }
  }, [
    show,
    floatingIcons.length,
    floatingIconsCount,
    fallingEmoji,
    fallingCount,
    autoCloseMs,
    onClose,
  ]);

  if (!mounted || !show) return null;

  const getMiniIconPosition = (position: "top-right" | "bottom-left" | "bottom-right") => {
    switch (position) {
      case "top-right":
        return "absolute -right-2 -top-2";
      case "bottom-left":
        return "absolute -bottom-2 -left-2";
      case "bottom-right":
        return "absolute -bottom-2 -right-2";
    }
  };

  const getMiniIconSize = (position: "top-right" | "bottom-left" | "bottom-right") => {
    return position === "top-right" ? "h-12 w-12" : "h-10 w-10";
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[${zIndex}] flex items-center justify-center overflow-hidden`}
      style={{ zIndex }}
      onClick={onClose}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 ${backgroundGradient} backdrop-blur-sm`} />

      {/* Floating icons */}
      {floating.map((item) => {
        if (floatingIcons.length === 0 || item.icon === undefined) return null;
        const IconComponent = floatingIcons[item.icon].icon;
        return (
          <div
            key={item.id}
            className="animate-float-travel pointer-events-none absolute"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`,
            }}
          >
            <IconComponent
              className="h-8 w-8 opacity-30"
              style={{ color: floatingIcons[item.icon].color }}
            />
          </div>
        );
      })}

      {/* Falling items */}
      {fallingEmoji &&
        falling.map((item) => (
          <div
            key={item.id}
            className="animate-confetti pointer-events-none absolute top-0 text-2xl"
            style={{
              left: `${item.x}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: "4s",
            }}
          >
            {fallingEmoji}
          </div>
        ))}

      {/* Badge */}
      <div
        className="animate-bounce-in relative flex flex-col items-center gap-6 rounded-3xl border-2 bg-gradient-to-b from-slate-900/95 to-slate-800/95 p-10 shadow-2xl backdrop-blur"
        style={{ borderColor: badgeBorderColor }}
      >
        {/* Glow effect */}
        <div className={`absolute -inset-2 rounded-3xl ${glowGradient} opacity-20 blur-xl`} />

        {/* Main badge */}
        <div className="relative">
          <div
            className={`flex h-32 w-32 items-center justify-center rounded-full ${badgeGradient} border-4 shadow-lg`}
            style={{ borderColor: `${badgeBorderColor}80` }}
          >
            {mainIcon || <span className="text-6xl">{mainEmoji}</span>}
          </div>

          {/* Mini floating icons */}
          {miniIcons.map((mini, idx) => (
            <div
              key={idx}
              className={`${getMiniIconPosition(mini.position)} flex ${getMiniIconSize(mini.position)} items-center justify-center rounded-full ${mini.gradient} text-white shadow-lg ${mini.bounce ? "animate-bounce" : ""}`}
            >
              {mini.icon}
            </div>
          ))}
        </div>

        {/* Text */}
        <div className="relative text-center">
          <p className={`text-sm font-medium ${subtitleColor}`}>{subtitle}</p>
          <h3 className="mt-2 text-4xl font-bold">
            <span className={`bg-clip-text text-transparent ${titleGradient}`}>{title}</span>
          </h3>
          <p className="mt-1 text-sm font-medium text-gray-300">{role}</p>
          <p className="mt-4 max-w-xs text-sm text-gray-400 italic">{quote}</p>
        </div>

        {/* Tags */}
        <div className="relative flex flex-wrap justify-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag.label}
              className={`rounded-full ${tagBgColor} px-3 py-1 text-xs ${tagTextColor} border ${tagBorderColor}`}
            >
              {tag.emoji} {tag.label}
            </span>
          ))}
        </div>

        {/* Bouncing emojis */}
        <div className="relative flex gap-2">
          {bouncingEmojis.map((emoji, i) => (
            <span
              key={i}
              className="animate-bounce text-2xl"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <p className="relative text-xs text-gray-500">Cliquez pour fermer</p>
      </div>
    </div>,
    document.body
  );
}
