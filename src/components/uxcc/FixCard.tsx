import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Check,
  Copy,
  AlertTriangle,
  AlertCircle,
  Info,
  Lightbulb,
  BookOpen,
  Wrench,
} from "lucide-react";

import type { UXFix, Severity } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; bg: string; border: string; icon: typeof AlertTriangle }
> = {
  high: {
    label: "Critical",
    color: "text-severity-high",
    bg: "bg-severity-high/10",
    border: "border-severity-high/25",
    icon: AlertCircle,
  },
  medium: {
    label: "Medium",
    color: "text-severity-medium",
    bg: "bg-severity-medium/10",
    border: "border-severity-medium/25",
    icon: AlertTriangle,
  },
  low: {
    label: "Low",
    color: "text-severity-low",
    bg: "bg-severity-low/10",
    border: "border-severity-low/25",
    icon: Info,
  },
};

interface FixCardProps {
  fix: UXFix;
  index: number;
}

export function FixCard({ fix, index }: FixCardProps) {
  const [open, setOpen] = useState(index === 0);
  const [copied, setCopied] = useState(false);
  const sev = SEVERITY_META[fix.severity];
  const Icon = sev.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="overflow-hidden rounded-2xl border border-border bg-bg-tertiary/60 backdrop-blur transition-colors hover:border-border-strong"
    >
      {/* Header — title is the dominant element */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          {/* Title first */}
          <h3 className="text-base font-semibold text-foreground mb-2">{fix.title}</h3>
          {/* Severity badge + principle below */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium",
                sev.bg,
                sev.border,
                sev.color,
              )}
            >
              <Icon className="h-3 w-3" />
              {sev.label}
            </span>
            <span className="text-[11px] text-text-tertiary">{fix.principle}</span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          className="mt-1 shrink-0 text-text-tertiary"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-border px-4 pb-4 pt-4">
              <Section icon={AlertCircle} label="The problem" tone="text-severity-high">
                {fix.problem}
              </Section>
              <Section icon={BookOpen} label="Why it matters" tone="text-cyan">
                {fix.why}
              </Section>
              <Section icon={Lightbulb} label="The fix" tone="text-severity-low">
                {fix.solution}
              </Section>

              {/* Code block */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    <Wrench className="h-3.5 w-3.5" />
                    Working Code
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(fix.code);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-elevated px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-severity-low" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                {/* rounded-lg instead of rounded-xl — less soft, more technical */}
                <div className="overflow-hidden rounded-lg border border-border bg-[oklch(0.08_0.01_280)]">
                  <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-severity-high/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-severity-medium/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-severity-low/70" />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                      {fix.language}
                    </span>
                  </div>
                  <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-foreground">
                    <code>{fix.code}</code>
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Section({
  icon: Icon,
  label,
  tone,
  children,
}: {
  icon: typeof AlertCircle;
  label: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className={cn(
          "mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider",
          tone,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
