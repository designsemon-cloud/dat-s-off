import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Eye, Code, ListChecks, Sparkles } from "lucide-react";
import { Header } from "./Header";
import type { AuthUser } from "@/lib/auth-types";

const STEPS = [
  { icon: Eye, label: "Image processed" },
  { icon: ListChecks, label: "Analyzing visual hierarchy" },
  { icon: Sparkles, label: "Checking WCAG compliance" },
  { icon: Code, label: "Generating code fixes" },
];

const TIPS = [
  "💡 Checking WCAG 2.1 compliance across all elements",
  "💡 Analyzing visual hierarchy and Fitts's Law",
  "💡 Evaluating touch target sizes for mobile",
  "💡 Generating framework-specific code fixes",
];

interface AnalyzingStateProps {
  imageUrl: string;
  stack?: string;
  device?: string;
  remainingUses: number;
  user: AuthUser | null;
  onAddCredits: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function AnalyzingState({
  imageUrl,
  stack,
  device,
  remainingUses,
  user,
  onAddCredits,
  onSignIn,
  onSignOut,
}: AnalyzingStateProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((_, i) => setTimeout(() => setStepIndex(i + 1), (i + 1) * 800));
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        remainingUses={remainingUses}
        user={user}
        onAddCredits={onAddCredits}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
      />

      {/* Horizontal split content */}
      <div className="flex flex-1 gap-5 p-5">
        {/* LEFT PANEL — 40% */}
        <aside className="w-2/5 space-y-4 self-start">
          {/* Screenshot with CSS scan animation */}
          <div className="overflow-hidden rounded-2xl border border-border-strong bg-bg-tertiary p-3">
            <div className="relative overflow-hidden rounded-xl bg-bg-secondary">
              <img src={imageUrl} alt="Analyzing" className="max-h-72 w-full object-contain" />
              <div className="absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-primary/40 to-transparent animate-scan" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.62_0.22_280/0.12)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.62_0.22_280/0.12)_1px,transparent_1px)] bg-[size:32px_32px]" />
            </div>

            {(stack || device) && (
              <div className="mt-3 space-y-1.5">
                {stack && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-tertiary">Tech stack</span>
                    <span className="text-[11px] font-medium text-foreground">{stack}</span>
                  </div>
                )}
                {device && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-tertiary">Device</span>
                    <span className="text-[11px] font-medium text-foreground">{device}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Agent status */}
          <div className="rounded-2xl border border-border bg-bg-tertiary/60 p-4 backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">🤖</span>
              <h3 className="text-xs font-semibold text-foreground">Analysis Progress</h3>
            </div>
            <div className="space-y-2.5">
              {STEPS.map((step, i) => {
                const done = i < stepIndex;
                const active = i === stepIndex;
                return (
                  <div key={step.label} className="flex items-center gap-2.5">
                    {done ? (
                      <span className="text-[10px] leading-none text-severity-low">✅</span>
                    ) : (
                      <span
                        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                          active ? "animate-pulse-dot bg-primary" : "bg-text-tertiary/40"
                        }`}
                      />
                    )}
                    <span
                      className={`text-xs ${
                        done
                          ? "text-severity-low"
                          : active
                            ? "text-foreground"
                            : "text-text-tertiary"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL — 60% */}
        <main className="w-3/5 flex items-center justify-center">
          <div className="text-center space-y-5">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-border" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1.5">Analyzing your UI...</h2>
              <p className="text-sm text-text-tertiary">This usually takes around 30 seconds</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-text-tertiary italic max-w-xs mx-auto"
              >
                {TIPS[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
