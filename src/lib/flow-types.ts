import type { IssueProgress, UXFix } from "./mock-data";

// Closed taxonomy grounded in Nielsen's heuristics + the cognitive walkthrough
// method — the model must pick from this set, not invent categories.
export const FLOW_ISSUE_CATEGORIES = [
  "lost-context",
  "dead-end",
  "inconsistency",
  "missing-feedback",
  "redundant-step",
  "error-recovery-gap",
  "cognitive-overload",
  "orphan-state",
  "drop-off-risk",
] as const;

export type FlowIssueCategory = (typeof FLOW_ISSUE_CATEGORIES)[number];

export const FLOW_ISSUE_CATEGORY_LABELS: Record<FlowIssueCategory, string> = {
  "lost-context": "Lost Context",
  "dead-end": "Dead End",
  inconsistency: "Inconsistency",
  "missing-feedback": "Missing Feedback",
  "redundant-step": "Redundant Step",
  "error-recovery-gap": "Error Recovery Gap",
  "cognitive-overload": "Cognitive Overload",
  "orphan-state": "Orphan State",
  "drop-off-risk": "Drop-off Risk",
};

export type FlowFindingScope = "screen" | "transition" | "flow";

export interface FlowFix extends UXFix {
  scope: FlowFindingScope;
  category: FlowIssueCategory;
  // "screen" -> [screenId]; "transition" -> [fromId, toId]; "flow" -> []
  anchorScreenIds: string[];
  // The specific named heuristic or cognitive-walkthrough question violated,
  // e.g. "Cognitive walkthrough Q3: will the user understand the feedback after acting?"
  heuristic: string;
}

export interface FlowScreen {
  id: string;
  order: number;
  name: string;
  dataUrl: string;
  source: "upload" | "video-frame";
  timestampMs?: number;
}

export interface FlowAnalysisResult {
  flowScore: number; // 0-100, distinct from any per-screen score
  screenScores: Record<string, number>;
  flowCoherent: boolean;
  goalAchieved: "yes" | "no" | "unclear";
  /** Direct answer to the user's question (or "what to fix first"), 1–3 sentences. */
  answer?: string;
  summary: string;
  screens: { id: string; name: string }[];
  findings: FlowFix[];
  /** Re-checks only: the previous version's findings, each marked fixed / partly / open. */
  progress?: IssueProgress[];
}
