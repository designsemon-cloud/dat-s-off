import { ArrowRight } from "lucide-react";
import type { AnalysisResult } from "@/lib/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecentAnalysisItem = {
  id: string;
  imageUrl: string;
  imageName: string;
  stack: string;
  device: string;
  result: AnalysisResult;
  analyzedAt: string;
};

// ─── Hardcoded sample data ────────────────────────────────────────────────────

const SAMPLES = [
  {
    id: "salesforce",
    title: "Salesforce CRM",
    subtitle: "Web dashboard",
    issues: [{ text: "Data density causes cognitive load" }, { text: "Active nav state missing" }],
    keywords: ["Cognitive Load", "Feedback"],
    dataUrl: "/salesforce.png",
  },
  {
    id: "amazon",
    title: "Amazon Homepage",
    subtitle: "E-commerce web",
    issues: [
      { text: "CTA button lacks visual prominence" },
      { text: "Price hierarchy not scannable" },
    ],
    keywords: ["Visual Hierarchy", "Fitts's Law"],
    dataUrl: "/amazon.jpg",
  },
];

// ─── Shared card shell ────────────────────────────────────────────────────────

function AnalysisCard({
  imageUrl,
  title,
  subtitle,
  issues,
  keywords,
  onClick,
}: {
  imageUrl: string;
  title: string;
  subtitle: string;
  issues: { text: string }[];
  keywords: string[];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex overflow-hidden rounded-xl border border-border bg-bg-tertiary/60 text-left backdrop-blur transition-all hover:border-border-strong hover:bg-bg-elevated/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {/* Screenshot */}
      <div className="w-[36%] shrink-0 overflow-hidden bg-bg-secondary border-r border-border/50">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover object-top"
          draggable={false}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div>
          <p className="text-[13px] font-semibold leading-snug text-foreground">{title}</p>
          <p className="mt-0.5 text-[11px] text-text-tertiary">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-1.5 my-1">
          {issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
              <span className="text-[11px] leading-tight text-muted-foreground line-clamp-2">
                {issue.text}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="rounded-md border border-border bg-bg-secondary px-1.5 py-0.5 text-[10px] text-text-tertiary"
            >
              {kw}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-1 flex items-center gap-1 text-[11px] font-medium text-primary transition-opacity group-hover:opacity-70">
          View analysis
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SampleAnalysisProps {
  onViewSample: (imageDataUrl: string) => void;
  /** When provided and non-empty, switches to "Recent Analysis" mode */
  recentAnalyses?: RecentAnalysisItem[];
  onViewRecent?: (item: RecentAnalysisItem) => void;
}

export function SampleAnalysis({
  onViewSample,
  recentAnalyses,
  onViewRecent,
}: SampleAnalysisProps) {
  const isRecentMode = recentAnalyses && recentAnalyses.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-6 pb-6">
      <p
        className="mb-6 text-center text-[15px] font-semibold text-foreground"
        style={{ letterSpacing: "-0.5px" }}
      >
        {isRecentMode ? "Recent Analysis" : "Sample Analysis"}
      </p>

      <div className="grid grid-cols-2 gap-4">
        {isRecentMode
          ? recentAnalyses.map((item) => {
              const topIssues = item.result.fixes.slice(0, 2).map((f) => ({ text: f.title }));
              const keywords = item.result.fixes.slice(0, 2).map((f) => f.principle);
              const subtitle = `Score ${item.result.score}/100 · ${item.stack}`;
              return (
                <AnalysisCard
                  key={item.id}
                  imageUrl={item.imageUrl}
                  title={item.imageName.replace(/\.[^.]+$/, "") || "Analysis"}
                  subtitle={subtitle}
                  issues={topIssues}
                  keywords={keywords}
                  onClick={() => onViewRecent?.(item)}
                />
              );
            })
          : SAMPLES.map((sample) => (
              <AnalysisCard
                key={sample.id}
                imageUrl={sample.dataUrl}
                title={sample.title}
                subtitle={sample.subtitle}
                issues={sample.issues}
                keywords={sample.keywords}
                onClick={() => onViewSample(sample.dataUrl)}
              />
            ))}
      </div>
    </div>
  );
}
