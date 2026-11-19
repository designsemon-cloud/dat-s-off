import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Check, AlertTriangle } from "lucide-react";
import jsPDF from "jspdf";
import type { FlowAnalysisResult, FlowScreen, FlowIssueCategory } from "@/lib/flow-types";
import { FLOW_ISSUE_CATEGORIES, FLOW_ISSUE_CATEGORY_LABELS } from "@/lib/flow-types";
import type { Severity } from "@/lib/mock-data";
import type { AuthUser } from "@/lib/auth-types";
import { FixCard } from "./FixCard";
import { FlowFilmstrip } from "./FlowFilmstrip";
import { GlowButton } from "./GlowButton";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

interface FlowResultsViewProps {
  screens: FlowScreen[];
  stack: string;
  device: string;
  result: FlowAnalysisResult;
  remainingUses: number;
  user: AuthUser | null;
  onReset: () => void;
  onAddCredits: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

const SEVERITIES: Severity[] = ["high", "medium", "low"];

export function FlowResultsView({
  screens,
  stack,
  device,
  result,
  remainingUses,
  user,
  onReset,
  onAddCredits,
  onSignIn,
  onSignOut,
}: FlowResultsViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<Set<FlowIssueCategory>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<Set<Severity>>(new Set());

  const ordinalById = useMemo(() => {
    const ordered = [...screens].sort((a, b) => a.order - b.order);
    return new Map(ordered.map((s, i) => [s.id, i + 1]));
  }, [screens]);

  const labelFor = (anchorScreenIds: string[]) => {
    if (anchorScreenIds.length === 0) return "Whole flow";
    const ordinals = anchorScreenIds.map((id) => ordinalById.get(id) ?? "?");
    if (ordinals.length === 1) return `Screen ${ordinals[0]}`;
    return `Screen ${ordinals.join(" → ")}`;
  };

  const toggle = <T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    setter(next);
  };

  const filtered = result.findings.filter((f) => {
    if (categoryFilter.size > 0 && !categoryFilter.has(f.category)) return false;
    if (severityFilter.size > 0 && !severityFilter.has(f.severity)) return false;
    if (activeScreenId && !f.anchorScreenIds.includes(activeScreenId)) return false;
    return true;
  });

  const exportPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Dats Off. — Flow Analysis Report", margin, y);
    y += 28;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(110);
    doc.text(
      `Stack: ${stack}   Device: ${device}   Flow Score: ${result.flowScore}/100   Goal achieved: ${result.goalAchieved}`,
      margin,
      y,
    );
    y += 18;
    const summaryLines = doc.splitTextToSize(result.summary, 500);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 14 + 10;

    result.findings.forEach((fix, i) => {
      if (y > 720) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(20);
      doc.text(
        `${i + 1}. [${fix.severity.toUpperCase()}] ${fix.title} — ${labelFor(fix.anchorScreenIds)}`,
        margin,
        y,
      );
      y += 18;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(110);
      doc.text(`${FLOW_ISSUE_CATEGORY_LABELS[fix.category]} — ${fix.principle}`, margin, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40);
      ["Problem: " + fix.problem, "Why: " + fix.why, "Solution: " + fix.solution].forEach((t) => {
        const lines = doc.splitTextToSize(t, 500);
        if (y + lines.length * 12 > 760) {
          doc.addPage();
          y = margin;
        }
        doc.text(lines, margin, y);
        y += lines.length * 12 + 6;
      });
      y += 8;
    });

    doc.save("dats-off-flow-report.pdf");
  };

  const handleCopyMD = () => {
    const md =
      `# Dats Off. Flow Analysis Report\n\nFlow Score: ${result.flowScore}/100\nGoal achieved: ${result.goalAchieved}\n\n${result.summary}\n\n` +
      result.findings
        .map(
          (f, i) =>
            `## ${i + 1}. ${f.title} [${f.severity}] — ${labelFor(f.anchorScreenIds)}\n**${FLOW_ISSUE_CATEGORY_LABELS[f.category]} · ${f.principle}**\n\n${f.problem}\n\n*Why:* ${f.why}\n\n*Fix:* ${f.solution}\n\n\`\`\`${f.language}\n${f.code}\n\`\`\``,
        )
        .join("\n\n");
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Header
        remainingUses={remainingUses}
        user={user}
        onAddCredits={onAddCredits}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        showNewAnalysis
        onNewAnalysis={onReset}
      />

      <div className="mx-auto w-full max-w-7xl px-6 py-6 space-y-4">
        <div className="rounded-2xl border border-border-strong bg-bg-tertiary p-3">
          <FlowFilmstrip
            screens={screens}
            activeScreenId={activeScreenId}
            onSelect={setActiveScreenId}
            scores={result.screenScores}
          />
        </div>

        {!result.flowCoherent && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-severity-high/25 bg-severity-high/10 p-4">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-severity-high" />
            <p className="text-sm text-severity-high">
              These screens don&rsquo;t appear to form one coherent flow — treat the findings below
              as best-effort rather than a full transition analysis.
            </p>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <motion.aside
            initial={{ x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-3 lg:sticky lg:top-6 lg:self-start"
          >
            <div className="rounded-2xl border border-border bg-bg-tertiary/60 p-4 backdrop-blur">
              <div className="flex items-center gap-3 mb-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-foreground text-background">
                  <span className="text-sm font-bold">{result.flowScore}</span>
                </div>
                <div>
                  <div className="text-[12px] font-medium text-text-tertiary">Flow Score</div>
                  <div className="text-sm font-semibold text-foreground">out of 100</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <Stat label="Stack" value={stack} />
                <Stat label="Device" value={device} />
                <Stat label="Screens" value={`${screens.length}`} />
                <Stat
                  label="Goal Achieved"
                  value={result.goalAchieved}
                  tone={
                    result.goalAchieved === "yes"
                      ? "text-foreground"
                      : result.goalAchieved === "no"
                        ? "text-severity-high"
                        : "text-foreground"
                  }
                />
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-border bg-bg-tertiary/60 p-4 backdrop-blur space-y-3">
              <div>
                <div className="mb-1.5 text-[12px] font-medium text-text-tertiary">Severity</div>
                <div className="flex flex-wrap gap-1.5">
                  {SEVERITIES.map((s) => (
                    <FilterChip
                      key={s}
                      active={severityFilter.has(s)}
                      onClick={() => toggle(severityFilter, s, setSeverityFilter)}
                    >
                      {s}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[12px] font-medium text-text-tertiary">Category</div>
                <div className="flex flex-wrap gap-1.5">
                  {FLOW_ISSUE_CATEGORIES.map((c) => (
                    <FilterChip
                      key={c}
                      active={categoryFilter.has(c)}
                      onClick={() => toggle(categoryFilter, c, setCategoryFilter)}
                    >
                      {FLOW_ISSUE_CATEGORY_LABELS[c]}
                    </FilterChip>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>

          <motion.div
            initial={{ x: 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-bg-tertiary/60 p-4 backdrop-blur">
              <div>
                <h1 className="text-sm font-semibold text-foreground">Flow Analysis Complete</h1>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {filtered.length} of {result.findings.length} findings shown
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <GlowButton variant="outline" size="sm" onClick={exportPDF}>
                  <Download className="h-3.5 w-3.5" /> Export PDF
                </GlowButton>
                <GlowButton
                  variant="outline"
                  size="sm"
                  onClick={handleCopyMD}
                  className="w-[108px]"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-foreground" /> Copied
                    </>
                  ) : (
                    <>
                      <FileText className="h-3.5 w-3.5" /> Copy MD
                    </>
                  )}
                </GlowButton>
              </div>
            </div>

            <div className="space-y-3">
              {filtered.map((fix, i) => (
                <FixCard
                  key={fix.id}
                  fix={fix}
                  index={i}
                  anchorLabel={labelFor(fix.anchorScreenIds)}
                />
              ))}
              {filtered.length === 0 && (
                <div className="rounded-2xl border border-border bg-bg-tertiary/60 p-8 text-center text-sm text-text-tertiary">
                  No findings match the current filters.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-1 text-[12px] font-medium capitalize transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-bg-secondary/60 text-muted-foreground hover:border-border-strong hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  tone = "text-foreground",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-secondary/60 p-2.5">
      <div className="text-[12px] font-medium text-text-tertiary">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold capitalize ${tone}`}>{value}</div>
    </div>
  );
}
