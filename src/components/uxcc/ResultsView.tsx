import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Check, Copy } from "lucide-react";
import jsPDF from "jspdf";
import type { AnalysisResult } from "@/lib/mock-data";
import type { AuthUser } from "@/lib/auth-types";
import { FixCard } from "./FixCard";
import { GlowButton } from "./GlowButton";
import { Header } from "./Header";

interface ResultsViewProps {
  imageUrl: string;
  imageName: string;
  stack: string;
  device: string;
  result: AnalysisResult;
  remainingUses: number;
  user: AuthUser | null;
  onReset: () => void;
  onAddCredits: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function ResultsView({
  imageUrl,
  imageName,
  stack,
  device,
  result,
  remainingUses,
  user,
  onReset,
  onAddCredits,
  onSignIn,
  onSignOut,
}: ResultsViewProps) {
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  // Results from before wins/consolidatedFixPrompt existed (e.g. saved recent
  // analyses) won't have them, despite what the type says.
  const wins = result.wins ?? [];
  const consolidatedPrompt = result.consolidatedFixPrompt?.trim() ?? "";

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(consolidatedPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("UXCC — UX Analysis Report", margin, y);
    y += 28;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(110);
    doc.text(`Stack: ${stack}   Device: ${device}   Score: ${result.score}/100`, margin, y);
    y += 18;
    const summaryLines = doc.splitTextToSize(result.summary, 500);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 14 + 10;

    result.fixes.forEach((fix, i) => {
      if (y > 720) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(20);
      doc.text(`${i + 1}. [${fix.severity.toUpperCase()}] ${fix.title}`, margin, y);
      y += 18;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(110);
      doc.text(`Principle: ${fix.principle}`, margin, y);
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

    doc.save("uxcc-report.pdf");
  };

  const handleCopyMD = () => {
    const md =
      `# UXCC Report\n\nScore: ${result.score}/100\n\n${result.summary}\n\n` +
      result.fixes
        .map(
          (f, i) =>
            `## ${i + 1}. ${f.title} [${f.severity}]\n**${f.principle}**\n\n${f.problem}\n\n*Why:* ${f.why}\n\n*Fix:* ${f.solution}\n\n\`\`\`${f.language}\n${f.code}\n\`\`\``,
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

      {/* Content */}
      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* LEFT — image + details */}
          <motion.aside
            initial={{ x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-3 lg:sticky lg:top-6 lg:self-start"
          >
            <div className="overflow-hidden rounded-2xl border border-border-strong bg-bg-tertiary p-3">
              <div className="overflow-hidden rounded-xl bg-bg-secondary">
                <img src={imageUrl} alt={imageName} className="w-full object-contain" />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-bg-tertiary/60 p-4 backdrop-blur">
              <div className="flex items-center gap-3 mb-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-foreground text-background">
                  <span className="text-sm font-bold">{result.score}</span>
                </div>
                <div>
                  <div className="text-[12px] font-medium text-text-tertiary">UX Score</div>
                  <div className="text-sm font-semibold text-foreground">out of 100</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <Stat label="Stack" value={stack} />
                <Stat label="Device" value={device} />
                <Stat label="Issues" value={`${result.fixes.length}`} />
                <Stat
                  label="Critical"
                  value={`${result.fixes.filter((f) => f.severity === "high").length}`}
                  tone="text-severity-high"
                />
              </div>
            </div>
          </motion.aside>

          {/* RIGHT — actions + fixes */}
          <motion.div
            initial={{ x: 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="space-y-3"
          >
            {/* Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-bg-tertiary/60 p-4 backdrop-blur">
              <div>
                <h1 className="text-sm font-semibold text-foreground">Analysis Complete</h1>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {result.fixes.length} prioritized fixes ready
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <GlowButton variant="outline" size="sm" onClick={exportPDF}>
                  <Download className="h-3.5 w-3.5" /> Export PDF
                </GlowButton>
                {/* Fixed-width so button doesn't shift between "Copy MD" and "Copied" states */}
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

            {/* Wins */}
            {wins.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between px-1">
                  <h2 className="text-[14px] font-medium text-text-tertiary">What You Got Right</h2>
                  <span className="text-[12px] font-mono text-text-tertiary">
                    {wins.length} {wins.length === 1 ? "win" : "wins"}
                  </span>
                </div>
                {wins.map((win) => (
                  <div
                    key={win.id}
                    className="rounded-2xl border border-border bg-bg-tertiary/60 p-4 backdrop-blur"
                  >
                    <h3 className="mb-2 text-base font-semibold text-foreground">{win.title}</h3>
                    <span className="inline-flex items-center rounded-md border border-border bg-bg-elevated px-2 py-0.5 text-[12px] font-medium text-muted-foreground">
                      {win.principle}
                    </span>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                      {win.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Fixes */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between px-1">
                <h2 className="text-[14px] font-medium text-text-tertiary">Recommended Fixes</h2>
                <span className="text-[12px] font-mono text-text-tertiary">
                  {result.fixes.length} issues
                </span>
              </div>
              {result.fixes.map((fix, i) => (
                <FixCard key={fix.id} fix={fix} index={i} />
              ))}
            </div>

            {/* Consolidated fix prompt */}
            {consolidatedPrompt && (
              <div className="rounded-2xl border border-border bg-bg-tertiary/60 p-4 backdrop-blur">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-foreground">
                    Fix Everything at Once
                  </h2>
                  <GlowButton
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPrompt}
                    className="w-[124px]"
                  >
                    {promptCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-foreground" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy Prompt
                      </>
                    )}
                  </GlowButton>
                </div>
                <textarea
                  readOnly
                  value={consolidatedPrompt}
                  rows={10}
                  aria-label="Consolidated fix prompt"
                  className="block w-full resize-none rounded-lg border border-border bg-bg-secondary p-4 font-mono text-[12.5px] leading-relaxed text-foreground focus:border-border-strong focus:outline-none"
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
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
