import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  ChevronDown,
  Check,
  Copy,
  AlertTriangle,
  AlertCircle,
  Info,
  Lightbulb,
  BookOpen,
  Wrench,
  Sparkles,
} from "lucide-react";

import type { UXFix, Severity } from "@/lib/mock-data";
import type { FlowFix } from "@/lib/flow-types";
import { FLOW_ISSUE_CATEGORY_LABELS } from "@/lib/flow-types";
import { cn } from "@/lib/utils";
import { GlowButton } from "./GlowButton";
import { Reveal } from "@/lib/reveal";

// Accent for critical only; medium/low step down in grey weight.
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
    color: "text-foreground",
    bg: "bg-bg-elevated",
    border: "border-border-strong",
    icon: AlertTriangle,
  },
  low: {
    label: "Low",
    color: "text-text-tertiary",
    bg: "bg-transparent",
    border: "border-border",
    icon: Info,
  },
};

interface FixCardProps {
  fix: UXFix | FlowFix;
  index: number;
  anchorLabel?: string;
}

function isFlowFix(fix: UXFix | FlowFix): fix is FlowFix {
  return "category" in fix;
}

export function FixCard({ fix, index, anchorLabel }: FixCardProps) {
  const [open, setOpen] = useState(index === 0);
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const sev = SEVERITY_META[fix.severity];
  const Icon = sev.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="overflow-hidden rounded-2xl border border-border bg-bg-tertiary transition-colors hover:border-border-strong"
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
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[12px] font-medium",
                sev.bg,
                sev.border,
                sev.color,
              )}
            >
              <Icon className="h-3 w-3" />
              {sev.label}
            </span>
            <span className="text-[12px] text-text-tertiary">{fix.principle}</span>
            {isFlowFix(fix) && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-border bg-bg-elevated text-[12px] font-medium text-muted-foreground">
                {FLOW_ISSUE_CATEGORY_LABELS[fix.category]}
              </span>
            )}
            {anchorLabel && (
              <span className="text-[12px] font-semibold text-foreground">{anchorLabel}</span>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          className="mt-1 shrink-0 text-text-tertiary"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {open && (
          <Reveal transition={{ duration: 0.25 }}>
            <div className="space-y-4 border-t border-border px-4 pb-4 pt-4">
              <Section icon={AlertCircle} label="The problem">
                {fix.problem}
              </Section>
              <Section icon={BookOpen} label="Why it matters">
                {fix.why}
              </Section>
              <Section icon={Lightbulb} label="The fix">
                {fix.solution}
              </Section>

              {/* Code block — critiques now return paste-ready fix prompts
                  instead of code (code: ""), so this only shows for older
                  results that still carry code. */}
              {fix.code?.trim() && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[14px] font-medium text-text-tertiary">
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
                        <Check className="h-3 w-3 text-foreground" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  {/* rounded-lg instead of rounded-xl — less soft, more technical */}
                  <div className="overflow-hidden rounded-lg border border-border bg-bg-secondary">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
                      <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-severity-high/70" />
                        <span className="h-2.5 w-2.5 rounded-full bg-severity-medium/70" />
                        <span className="h-2.5 w-2.5 rounded-full bg-severity-low/70" />
                      </div>
                      <span className="font-mono text-[10px] text-text-tertiary">
                        {fix.language}
                      </span>
                    </div>
                    <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-foreground">
                      <code>{fix.code}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Older/saved results may predate fixPrompt, so guard at runtime too */}
              {typeof fix.fixPrompt === "string" && fix.fixPrompt.trim() !== "" && (
                <div className="flex justify-end">
                  <GlowButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(fix.fixPrompt);
                      setPromptCopied(true);
                      setTimeout(() => setPromptCopied(false), 2000);
                    }}
                    className="w-[158px]"
                  >
                    {promptCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-foreground" /> Copied
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> Copy Fix Prompt
                      </>
                    )}
                  </GlowButton>
                </div>
              )}
            </div>
          </Reveal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Section({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof AlertCircle;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
