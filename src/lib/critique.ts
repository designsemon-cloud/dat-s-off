import type { IssueProgress, Severity, UXFix } from "./mock-data";
import type { FlowFix } from "./flow-types";
import type { Session, SessionVersion } from "./session-types";
import { versionScore } from "./session-utils";

// Reading a critique version the same way everywhere: the chat's summary and
// the critique document both use these, so issue numbers, order, wording of
// the score, and the fix prompt never disagree between the two.

export type AnyFix = UXFix | FlowFix;

export const SEVERITY_LABEL: Record<Severity, string> = {
  high: "Critical",
  medium: "Medium",
  low: "Low",
};

const RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

/** Issues in the order to fix them: critical, then medium, then low (stable within each). */
export function orderedFixes(v: SessionVersion): AnyFix[] {
  const fixes: AnyFix[] = v.mode === "flow" ? v.result.findings : v.result.fixes;
  return fixes
    .map((f, i) => ({ f, i }))
    .sort((a, b) => RANK[a.f.severity] - RANK[b.f.severity] || a.i - b.i)
    .map(({ f }) => f);
}

/** The score in words, on the same scale the analyzer is told to use. */
export function scoreVerdict(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs work";
  return "Significant issues";
}

/** What the chat leads with: the direct answer, or the summary for results that predate it. */
export function versionAnswer(v: SessionVersion) {
  return v.result.answer?.trim() || v.result.summary;
}

/** Groups for "what to fix", in order. */
export const PRIORITY: { severity: Severity; label: string }[] = [
  { severity: "high", label: "Fix first" },
  { severity: "medium", label: "Then" },
  { severity: "low", label: "Polish" },
];

export interface RecheckItem extends IssueProgress {
  title: string;
}

export interface Recheck {
  /** 1-based number of the version this one is compared with. */
  against: number;
  scoreBefore: number;
  scoreAfter: number;
  items: RecheckItem[];
  fixed: number;
  partly: number;
  open: number;
  unseen: number;
  /** Issues found for the first time in this version. */
  newIssues: AnyFix[];
}

const STATUS_ORDER: Record<IssueProgress["status"], number> = {
  fixed: 0,
  partly: 1,
  open: 2,
  unseen: 3,
};

/** For a re-checked version: what happened to each issue of the version before it. */
export function recheckOf(session: Session, index: number): Recheck | null {
  const v = session.versions[index];
  const prev = session.versions[index - 1];
  const progress = v?.result.progress;
  if (!v || !prev || !progress?.length) return null;
  const prevFixes = prev.mode === "flow" ? prev.result.findings : prev.result.fixes;
  const items = progress
    .map((p) => ({
      ...p,
      title: prevFixes.find((f) => f.id === p.previousId)?.title ?? `Issue ${p.previousId}`,
    }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const count = (s: IssueProgress["status"]) => items.filter((i) => i.status === s).length;
  return {
    against: index,
    scoreBefore: versionScore(prev),
    scoreAfter: versionScore(v),
    items,
    fixed: count("fixed"),
    partly: count("partly"),
    open: count("open"),
    unseen: count("unseen"),
    newIssues: orderedFixes(v).filter((f) => !f.carriedFrom),
  };
}

export const STATUS_LABEL: Record<IssueProgress["status"], string> = {
  fixed: "Fixed",
  partly: "Partly fixed",
  open: "Still open",
  unseen: "Not visible",
};
