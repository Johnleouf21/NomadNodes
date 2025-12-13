"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Terminal, Code2, Cpu, Zap, Rocket } from "lucide-react";

// Trigger: Type "JOHNLEOUF"
const TRIGGER_WORD = "JOHNLEOUF";

// Matrix characters
const MATRIX_CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>/{}[]();:=+-*";

// Boot sequence lines
const BOOT_LINES = [
  { text: "$ initializing nomad_nodes.system...", delay: 0 },
  { text: "[OK] Loading React 19...", delay: 400 },
  { text: "[OK] Next.js 15 framework ready", delay: 700 },
  { text: "[OK] TypeScript compiler initialized", delay: 1000 },
  { text: "[OK] Web3 provider connected", delay: 1300 },
  { text: "[OK] Solidity contracts deployed", delay: 1600 },
  { text: "[OK] Ponder indexer synced", delay: 1900 },
  { text: "$ sudo unlock --creator-mode", delay: 2300 },
  { text: "[ACCESS GRANTED]", delay: 2700 },
  { text: "", delay: 3000 },
  { text: ">>> DEVELOPER MODE ACTIVATED <<<", delay: 3200 },
];

interface MatrixDrop {
  id: number;
  x: number;
  speed: number;
  chars: string[];
}

export function JohnleoufEasterEgg() {
  const [phase, setPhase] = useState<"idle" | "glitch" | "matrix" | "boot" | "badge">("idle");
  const [mounted, setMounted] = useState(false);
  const [matrixDrops, setMatrixDrops] = useState<MatrixDrop[]>([]);
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const keySequenceRef = useRef("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const startSequence = useCallback(() => {
    // Phase 1: Glitch effect
    setPhase("glitch");
    let glitchCount = 0;
    const glitchInterval = setInterval(() => {
      setGlitchIntensity(Math.random());
      glitchCount++;
      if (glitchCount > 10) {
        clearInterval(glitchInterval);
        setGlitchIntensity(0);

        // Phase 2: Matrix rain
        setPhase("matrix");
        const drops: MatrixDrop[] = Array.from({ length: 30 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          speed: 2 + Math.random() * 3,
          chars: Array.from(
            { length: 20 },
            () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
          ),
        }));
        setMatrixDrops(drops);

        // Phase 3: Boot sequence after matrix starts
        setTimeout(() => {
          setPhase("boot");
          setVisibleLines(0);

          // Show boot lines progressively
          BOOT_LINES.forEach((line, index) => {
            setTimeout(() => {
              setVisibleLines(index + 1);
            }, line.delay);
          });

          // Phase 4: Show badge
          setTimeout(() => {
            setPhase("badge");
          }, 4000);
        }, 1500);
      }
    }, 100);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toUpperCase();
      keySequenceRef.current = (keySequenceRef.current + key).slice(-10);

      if (keySequenceRef.current.includes(TRIGGER_WORD)) {
        startSequence();
        keySequenceRef.current = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [startSequence]);

  const closeEasterEgg = () => {
    setPhase("idle");
    setMatrixDrops([]);
    setVisibleLines(0);
  };

  if (!mounted || phase === "idle") return null;

  const portal = createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      onClick={phase === "badge" ? closeEasterEgg : undefined}
    >
      {/* Glitch overlay */}
      {phase === "glitch" && (
        <div
          className="absolute inset-0 bg-black"
          style={{
            animation: "glitch 0.1s infinite",
          }}
        >
          <div
            className="absolute inset-0 bg-cyan-500/20"
            style={{
              transform: `translateX(${glitchIntensity * 10 - 5}px)`,
              clipPath: `inset(${Math.random() * 100}% 0 ${Math.random() * 100}% 0)`,
            }}
          />
          <div
            className="absolute inset-0 bg-red-500/20"
            style={{
              transform: `translateX(${-glitchIntensity * 10 + 5}px)`,
              clipPath: `inset(${Math.random() * 100}% 0 ${Math.random() * 100}% 0)`,
            }}
          />
        </div>
      )}

      {/* Matrix rain background */}
      {(phase === "matrix" || phase === "boot" || phase === "badge") && (
        <div className="absolute inset-0 bg-black">
          {matrixDrops.map((drop) => (
            <div
              key={drop.id}
              className="animate-matrix-fall absolute top-0 font-mono text-sm text-green-500"
              style={{
                left: `${drop.x}%`,
                animationDuration: `${drop.speed}s`,
                textShadow: "0 0 10px #00ff00, 0 0 20px #00ff00",
              }}
            >
              {drop.chars.map((char, i) => (
                <div key={i} style={{ opacity: 1 - i * 0.05 }}>
                  {char}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Boot sequence terminal */}
      {(phase === "boot" || phase === "badge") && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`mx-4 w-full max-w-2xl rounded-lg border border-green-500/50 bg-black/90 p-6 font-mono text-sm shadow-2xl transition-all duration-500 ${
              phase === "badge" ? "scale-95 opacity-0" : "scale-100 opacity-100"
            }`}
            style={{
              boxShadow: "0 0 50px rgba(0, 255, 0, 0.3)",
            }}
          >
            {/* Terminal header */}
            <div className="mb-4 flex items-center gap-2 border-b border-green-500/30 pb-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="ml-4 text-green-500/70">nomad-nodes@system:~</span>
            </div>

            {/* Boot lines */}
            <div className="space-y-1">
              {BOOT_LINES.slice(0, visibleLines).map((line, index) => (
                <div
                  key={index}
                  className={`${
                    line.text.includes("[OK]")
                      ? "text-green-400"
                      : line.text.includes("ACCESS GRANTED")
                        ? "font-bold text-cyan-400"
                        : line.text.includes(">>>")
                          ? "mt-4 text-center text-lg font-bold text-yellow-400"
                          : "text-green-500"
                  }`}
                >
                  {line.text}
                  {index === visibleLines - 1 && line.text && (
                    <span className="animate-pulse">_</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Final Badge */}
      {phase === "badge" && (
        <div className="animate-fade-in absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="animate-bounce-in relative flex flex-col items-center gap-6 rounded-2xl border-2 border-teal-500/50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-10 shadow-2xl">
            {/* Glow effect */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 opacity-30 blur-xl" />

            {/* Badge content */}
            <div className="relative">
              {/* Main icon */}
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-600 shadow-lg">
                  <Terminal className="h-16 w-16 text-white" />
                </div>
                {/* Orbiting icons */}
                <div className="absolute -top-2 -right-2 flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                  <Code2 className="h-6 w-6" />
                </div>
                <div className="absolute -bottom-2 -left-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                  <Cpu className="h-5 w-5" />
                </div>
                <div className="absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="relative text-center">
              <p className="text-sm font-medium text-teal-400">🖥️ Developer Mode Unlocked</p>
              <h3 className="mt-2 text-4xl font-bold">
                <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Johnleouf
                </span>
              </h3>
              <p className="mt-1 text-lg font-medium text-gray-300">The Creator</p>
              <p className="mt-4 max-w-sm text-sm text-gray-400 italic">
                &quot;First, solve the problem.
                <br />
                Then, write the code.&quot;
              </p>
              <p className="mt-1 text-xs text-gray-500">— John Johnson</p>
            </div>

            {/* Tech stack */}
            <div className="relative flex flex-wrap justify-center gap-2">
              {[
                { icon: "⚛️", label: "React" },
                { icon: "▲", label: "Next.js" },
                { icon: "📘", label: "TypeScript" },
                { icon: "💎", label: "Solidity" },
                { icon: "🔗", label: "Web3" },
                { icon: "⚡", label: "Ponder" },
              ].map((tech, i) => (
                <span
                  key={tech.label}
                  className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs text-gray-300"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {tech.icon} {tech.label}
                </span>
              ))}
            </div>

            {/* Animated rockets */}
            <div className="relative flex gap-2">
              {[...Array(5)].map((_, i) => (
                <Rocket
                  key={i}
                  className="h-6 w-6 animate-bounce text-teal-500"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>

            <p className="relative text-xs text-gray-500">Cliquez pour fermer</p>
          </div>
        </div>
      )}
    </div>,
    document.body
  );

  return portal;
}
