import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Eye, ListChecks, Sparkles, Code } from "lucide-react";
import { AppHeader } from "./AppHeader";

const STEPS = [
  { icon: Eye, label: "Image processed" },
  { icon: ListChecks, label: "Analyzing visual hierarchy" },
  { icon: Sparkles, label: "Checking WCAG compliance" },
  { icon: Code, label: "Generating code fixes" },
];

const TIPS = [
  "Checking WCAG compliance, visual hierarchy, and touch targets",
  "Analyzing typography hierarchy and reading flow",
  "Scanning for color contrast and accessibility issues",
  "Mapping interactive element spacing against Fitts’s Law",
];

interface AnalyzingStateProps {
  imageUrl: string;
  stack: string;
  device: string;
}

export function AnalyzingState({ imageUrl, stack, device }: AnalyzingStateProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex min-h-screen flex-col"
    >
      <AppHeader />

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-5 px-6 py-5">
        {/* LEFT — 40% sticky panel */}
        <aside className="w-2/5 sticky top-6 self-start space-y-4" style={{ maxHeight: "calc(100vh - 5rem)" }}>
          {/* Screenshot card */}
          <div className="rounded-2xl border border-border bg-bg-tertiary/60 p-4 backdrop-blur">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
              Your Input
            </p>
            <div className="relative overflow-hidden rounded-xl border border-border bg-bg-secondary">
              <img src={imageUrl} alt="Analyzing" className="w-full object-contain max-h-48" />
              {/* Scanning beam */}
              <motion.div
                initial={{ y: "-100%" }}
                animate={{ y: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-primary/40 to-transparent"
              />
              {/* Grid overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.62_0.22_280/0.10)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.62_0.22_280/0.10)_1px,transparent_1px)] bg-[size:32px_32px]" />
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Tech stack</span>
                <span className="font-medium text-foreground">{stack}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Device</span>
                <span className="font-medium text-foreground">{device}</span>
              </div>
            </div>
          </div>

          {/* Agent status card */}
          <div className="rounded-2xl border border-border bg-bg-tertiary/60 p-4 backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <p className="text-sm font-medium text-foreground">Analysis Progress</p>
            </div>
            <div className="space-y-2.5">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.15 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${i === 0 ? "bg-severity-low/20 text-severity-low" : "bg-primary/10 text-primary"}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className={`flex-1 text-sm ${i === 0 ? "text-severity-low" : i === 1 ? "text-foreground" : "text-text-tertiary"}`}>
                      {step.label}
                    </span>
                    {i === 0 && <span className="text-xs text-severity-low">✓</span>}
                    {i === 1 && (
                      <motion.div
                        className="h-1.5 w-1.5 rounded-full bg-primary"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* RIGHT — 60% loading content */}
        <main className="flex w-3/5 items-center justify-center">
          <div className="text-center space-y-5">
            {/* Spinner */}
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-border" />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">Analyzing your UI&hellip;</h2>
              <p className="mt-1.5 text-sm text-text-tertiary">This usually takes around 30 seconds</p>
            </div>

            <motion.p
              key={tipIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="max-w-sm text-xs text-text-tertiary italic"
            >
              💡 {TIPS[tipIndex]}
            </motion.p>
          </div>
        </main>
      </div>
    </motion.div>
  );
}
