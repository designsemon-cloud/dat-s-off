import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { Layers, GitBranch, ListChecks, Sparkles } from "lucide-react";
import { Header } from "./Header";
import { FlowFilmstrip } from "./FlowFilmstrip";
import type { AuthUser } from "@/lib/auth-types";
import type { FlowScreen } from "@/lib/flow-types";

const STEP_TEMPLATES = [
  { icon: Layers, label: (n: number) => `Processing ${n} screens` },
  { icon: GitBranch, label: () => "Mapping transitions" },
  { icon: ListChecks, label: () => "Applying UX heuristics" },
  { icon: Sparkles, label: () => "Scoring & compiling findings" },
];

const TIPS = [
  "💡 Running a cognitive walkthrough on every transition",
  "💡 Checking for lost context between screens",
  "💡 Looking for dead ends and missing feedback states",
  "💡 Cross-referencing Nielsen's usability heuristics",
];

interface FlowAnalyzingStateProps {
  screens: FlowScreen[];
  stack?: string;
  device?: string;
  remainingUses: number;
  user: AuthUser | null;
  onAddCredits: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function FlowAnalyzingState({
  screens,
  stack,
  device,
  remainingUses,
  user,
  onAddCredits,
  onSignIn,
  onSignOut,
}: FlowAnalyzingStateProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  const steps = useMemo(
    () => STEP_TEMPLATES.map((t) => ({ icon: t.icon, label: t.label(screens.length) })),
    [screens.length],
  );

  // Total estimate scales with screen count so a 2-screen and an 8-screen
  // flow don't feel identically (mis)paced.
  const stepDelayMs = Math.max(600, 400 + screens.length * 150);

  useEffect(() => {
    const timers = steps.map((_, i) =>
      setTimeout(() => setStepIndex(i + 1), (i + 1) * stepDelayMs),
    );
    return () => timers.forEach(clearTimeout);
  }, [steps, stepDelayMs]);

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

      <div className="flex flex-1 gap-5 p-5">
        <aside className="w-2/5 space-y-4 self-start">
          <div className="overflow-hidden rounded-2xl border border-border-strong bg-bg-tertiary p-3">
            <FlowFilmstrip screens={screens} />

            {(stack || device) && (
              <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
                {stack && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-text-tertiary">Tech stack</span>
                    <span className="text-[12px] font-medium text-foreground">{stack}</span>
                  </div>
                )}
                {device && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-text-tertiary">Device</span>
                    <span className="text-[12px] font-medium text-foreground">{device}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-bg-tertiary/60 p-4 backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">🤖</span>
              <h3 className="text-xs font-semibold text-foreground">Flow Analysis Progress</h3>
            </div>
            <div className="space-y-2.5">
              {steps.map((step, i) => {
                const done = i < stepIndex;
                const active = i === stepIndex;
                return (
                  <div key={step.label} className="flex items-center gap-2.5">
                    {done ? (
                      <span className="text-[10px] leading-none text-foreground">✅</span>
                    ) : (
                      <span
                        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                          active ? "animate-pulse-dot bg-primary" : "bg-text-tertiary/40"
                        }`}
                      />
                    )}
                    <span
                      className={`text-xs ${
                        done ? "text-foreground" : active ? "text-foreground" : "text-text-tertiary"
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

        <main className="w-3/5 flex items-center justify-center">
          <div className="text-center space-y-5">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-border" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1.5">
                Analyzing your flow...
              </h2>
              <p className="text-sm text-text-tertiary">
                Walking through {screens.length} screens and transitions
              </p>
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
