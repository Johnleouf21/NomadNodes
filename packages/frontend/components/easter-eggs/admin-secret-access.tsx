"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Shield, Lock, Unlock, Key, Sparkles } from "lucide-react";

interface AdminSecretAccessProps {
  children: React.ReactNode;
}

// Duration to hold (in ms)
const HOLD_DURATION = 3000;

export function AdminSecretAccess({ children }: AdminSecretAccessProps) {
  const router = useRouter();
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showUnlock, setShowUnlock] = useState(false);
  const [mounted, setMounted] = useState(false);

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const startHold = useCallback(() => {
    setIsHolding(true);
    setProgress(0);
    startTimeRef.current = Date.now();

    // Update progress every 30ms for smooth animation
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(newProgress);
    }, 30);

    // Trigger unlock after hold duration
    holdTimerRef.current = setTimeout(() => {
      setIsHolding(false);
      setProgress(100);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      // Show unlock animation
      setShowUnlock(true);

      // Navigate after 2 seconds
      setTimeout(() => {
        router.push("/admin");
      }, 2000);

      // Close popup 5 seconds after appearing (gives time to see animation + page load)
      setTimeout(() => {
        setShowUnlock(false);
      }, 5000);
    }, HOLD_DURATION);
  }, [router]);

  const endHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setIsHolding(false);
    setProgress(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const closeUnlock = useCallback(() => {
    setShowUnlock(false);
  }, []);

  // Calculate the circle stroke dashoffset for progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <>
      <div
        className="relative cursor-pointer select-none"
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={startHold}
        onTouchEnd={endHold}
      >
        {children}

        {/* Progress ring overlay */}
        {isHolding && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Glowing background */}
              <div
                className="absolute inset-0 rounded-full blur-xl transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle, rgba(139, 92, 246, ${progress / 200}) 0%, transparent 70%)`,
                }}
              />

              {/* SVG Progress Ring */}
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(139, 92, 246, 0.2)"
                  strokeWidth="4"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-100"
                />
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="50%" stopColor="#EC4899" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock
                  className="h-6 w-6 text-purple-400 transition-all duration-300"
                  style={{
                    transform: `scale(${1 + progress / 200})`,
                    opacity: 1 - progress / 150,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unlock Animation Portal */}
      {mounted &&
        showUnlock &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
            onClick={closeUnlock}
          >
            {/* Background */}
            <div className="animate-fade-in absolute inset-0 bg-gradient-to-b from-purple-900/95 via-indigo-900/95 to-slate-900/95 backdrop-blur-md" />

            {/* Floating particles */}
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="animate-float-travel pointer-events-none absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              >
                {[Shield, Key, Sparkles][i % 3] === Shield && (
                  <Shield className="h-6 w-6 text-purple-400/40" />
                )}
                {[Shield, Key, Sparkles][i % 3] === Key && (
                  <Key className="h-6 w-6 text-amber-400/40" />
                )}
                {[Shield, Key, Sparkles][i % 3] === Sparkles && (
                  <Sparkles className="h-6 w-6 text-pink-400/40" />
                )}
              </div>
            ))}

            {/* Main badge */}
            <div className="animate-bounce-in relative flex flex-col items-center gap-6 rounded-3xl border-2 border-purple-500/50 bg-gradient-to-b from-slate-900/95 to-slate-800/95 p-10 shadow-2xl backdrop-blur">
              {/* Glow effect */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 opacity-20 blur-xl" />

              {/* Unlocking animation */}
              <div className="relative">
                {/* Rotating ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="h-36 w-36 rounded-full border-4 border-dashed border-purple-500/30"
                    style={{
                      animation: "spin 3s linear infinite",
                    }}
                  />
                </div>

                {/* Main badge circle */}
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-purple-400/50 bg-gradient-to-br from-purple-500 via-pink-500 to-amber-500 shadow-lg">
                  <Unlock className="h-16 w-16 animate-pulse text-white drop-shadow-lg" />
                </div>

                {/* Mini icons */}
                <div className="absolute -top-2 -right-2 flex h-12 w-12 animate-bounce items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                  <span className="text-xl">✓</span>
                </div>
                <div className="absolute -bottom-2 -left-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg">
                  <Key className="h-5 w-5" />
                </div>
                <div className="absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg">
                  <Shield className="h-5 w-5" />
                </div>
              </div>

              {/* Text */}
              <div className="relative text-center">
                <p className="text-sm font-medium text-purple-400">🔓 Accès Déverrouillé</p>
                <h3 className="mt-2 text-4xl font-bold">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                    Admin Panel
                  </span>
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-300">
                  Zone Réservée aux Administrateurs
                </p>
                <p className="mt-4 max-w-xs text-sm text-gray-400 italic">
                  &quot;Avec de grands pouvoirs viennent
                  <br />
                  de grandes responsabilités.&quot; 🦸
                </p>
              </div>

              {/* Tags */}
              <div className="relative flex flex-wrap justify-center gap-2">
                {[
                  { emoji: "🛡️", label: "Admin" },
                  { emoji: "⚙️", label: "Config" },
                  { emoji: "📊", label: "Stats" },
                  { emoji: "👥", label: "Users" },
                ].map((tag) => (
                  <span
                    key={tag.label}
                    className="rounded-full border border-purple-500/30 bg-purple-900/50 px-3 py-1 text-xs text-purple-300"
                  >
                    {tag.emoji} {tag.label}
                  </span>
                ))}
              </div>

              {/* Bouncing emojis */}
              <div className="relative flex gap-2">
                {["🔐", "⚡", "🎛️", "⚡", "🔐"].map((emoji, i) => (
                  <span
                    key={i}
                    className="animate-bounce text-2xl"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>

              {/* Loading indicator */}
              <div className="relative flex items-center gap-2 text-purple-400">
                <div className="h-2 w-2 animate-pulse rounded-full bg-purple-400" />
                <span className="text-xs">Redirection vers le panneau admin...</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
