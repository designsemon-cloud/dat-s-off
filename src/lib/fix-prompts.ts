import type { Session, SessionVersion } from "./session-types";
import type { FlowFix } from "./flow-types";
import { screenLabeler } from "./export";
import { deviceLabel, stackLabel } from "./prefs";
import { orderedFixes, type AnyFix } from "./critique";

// Fix prompts for any AI coding tool (Cursor, Claude Code, v0, Lovable, Copilot,
// ChatGPT…). Built here from the critique's structured fields, not written by
// the model, so every prompt has the same sections in the same order: the
// task, the context the tool can't see, where the problem is, what's wrong
// and why, the exact change, what must not change, the constraints, and how
// to tell it's done. See design-system/patterns/fix-prompts.md.

const SEVERITY: Record<AnyFix["severity"], string> = {
  high: "critical",
  medium: "medium",
  low: "low",
};

const end = (t: string) => (/[.!?]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);
const bullets = (items: string[]) => items.map((i) => `- ${end(i)}`).join("\n");

/** The shared rules every fix follows, whichever tool runs it. */
const CONSTRAINTS = [
  "Change only what this fix needs. Don't redesign, restyle or refactor anything else.",
  "Reuse the existing components, design tokens (colours, spacing, type, radii) and patterns. Don't hard-code new colours or sizes.",
  "Don't change copy, data, business logic or behaviour unless the fix requires it.",
  "Don't add dependencies.",
  "Keep it accessible: WCAG AA contrast, visible focus states, keyboard access, and touch targets of at least 44×44px on touch devices.",
  "If something here doesn't match the code (a component or label doesn't exist), find the closest match and say so instead of guessing.",
];

function contextLines(session: Session, version: SessionVersion) {
  const c = session.context;
  const lines = [
    `Screen: ${session.title}${version.mode === "flow" ? ` (a flow of ${version.attachments.length} screens)` : ""}`,
    c?.productType && `Product: ${c.productType}`,
    c?.primaryUser && `Users: ${c.primaryUser}`,
    c?.primaryTask && `Their main task here: ${c.primaryTask}`,
    `Platform: ${deviceLabel(session.device)}`,
    `Stack: ${stackLabel(session.stack)}`,
    "Source: a UX review of a screenshot, so elements are named as they appear on screen. Find the matching code before changing anything.",
  ].filter(Boolean) as string[];
  return lines.map((l) => `- ${l}`).join("\n");
}

function where(f: AnyFix, version: SessionVersion) {
  const parts = [
    "anchorScreenIds" in f
      ? screenLabeler(version.attachments)((f as FlowFix).anchorScreenIds)
      : "",
    f.location?.trim() ?? "",
  ].filter(Boolean);
  return parts.join(", ");
}

function changeSteps(f: AnyFix) {
  if (f.steps?.length) return f.steps.map((s, i) => `${i + 1}. ${end(s)}`).join("\n");
  // Older critiques have no steps: the solution, plus the model's own prompt as detail.
  return [end(f.solution), f.fixPrompt?.trim() && `Details: ${end(f.fixPrompt)}`]
    .filter(Boolean)
    .join("\n");
}

function doneWhen(f: AnyFix) {
  const checks = f.acceptance?.length
    ? f.acceptance
    : [
        "The problem described above no longer happens on the screen.",
        "Everything else on the screen looks and behaves as before.",
      ];
  return bullets(checks);
}

/** The body of one issue, shared by the single and combined prompts. */
function issueBody(f: AnyFix, version: SessionVersion, heading: string) {
  const loc = where(f, version);
  return [
    `${heading} ${f.title} (${SEVERITY[f.severity]})`,
    loc && `Where: ${end(loc)}`,
    `Problem: ${end(f.problem)}`,
    `Why it matters: ${end(f.why)} Principle: ${end(f.principle)}`,
    `What to change:\n${changeSteps(f)}`,
    f.avoid?.length ? `Don't change:\n${bullets(f.avoid)}` : "",
    `Done when:\n${doneWhen(f)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** A self-contained prompt that fixes one issue. */
export function issuePrompt(session: Session, version: SessionVersion, f: AnyFix): string {
  return [
    `# Task\nFix one UX issue in this UI: ${end(f.title)} Make the smallest change that fully solves it.`,
    `# Context\n${contextLines(session, version)}`,
    `# The issue\n\n${issueBody(f, version, "##")}`,
    `# Constraints\n${bullets(CONSTRAINTS)}`,
    `# When you're done\nReply with the files you changed and one line on what changed. If you couldn't fully fix it, say what's left and why.`,
  ].join("\n\n");
}

/** One prompt for several issues, in the order given (most important first). */
export function combinedPrompt(session: Session, version: SessionVersion, fixes: AnyFix[]): string {
  if (fixes.length === 0) return "";
  if (fixes.length === 1) return issuePrompt(session, version, fixes[0]);
  return [
    `# Task\nFix these ${fixes.length} UX issues in this UI, one at a time, in the order listed (most important first). Make the smallest change that fully solves each one.`,
    `# Context\n${contextLines(session, version)}`,
    `# Issues\n\n${fixes.map((f, i) => issueBody(f, version, `## ${i + 1}.`)).join("\n\n")}`,
    `# Constraints (apply to every issue)\n${bullets(CONSTRAINTS)}`,
    `# When you're done\nFor each issue, reply with its number, the files you changed and one line on what changed. List any issue you couldn't fully fix, with what's left and why.`,
  ].join("\n\n");
}

/**
 * The version's "fix everything" prompt: critical and medium issues (or all of
 * them when there are only low ones), most important first. Empty when
 * nothing is left to fix.
 */
export function versionPrompt(session: Session, version: SessionVersion): string {
  const fixes = orderedFixes(version);
  const important = fixes.filter((f) => f.severity !== "low");
  return combinedPrompt(session, version, important.length ? important : fixes);
}
