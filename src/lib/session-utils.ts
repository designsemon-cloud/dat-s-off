import type { Session, SessionVersion } from "./session-types";

export function latestVersion(s: Session): SessionVersion | undefined {
  return s.versions[s.versions.length - 1];
}

export function versionScore(v: SessionVersion): number {
  return v.mode === "flow" ? v.result.flowScore : v.result.score;
}

export function sessionScore(s: Session): number | null {
  const v = latestVersion(s);
  return v ? versionScore(v) : null;
}

export function sessionThumb(s: Session): string | null {
  for (const m of s.messages) {
    if (m.kind === "prompt" && m.attachments.length > 0) {
      return [...m.attachments].sort((a, b) => a.order - b.order)[0].dataUrl;
    }
  }
  return null;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const STATUS_LABEL: Partial<Record<Session["status"], string>> = {
  new: "Starting",
  triaging: "Reading",
  "awaiting-answers": "Needs answers",
  analyzing: "Analyzing",
  replying: "Replying",
  error: "Failed",
  interrupted: "Interrupted",
};
