import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import type { Session } from "@/lib/session-types";
import { relativeTime, sessionScore, sessionThumb, STATUS_LABEL } from "@/lib/session-utils";
import { cn } from "@/lib/utils";
import { scoreFill, scoreTone } from "./AnnotatedScreenshot";

// Grid card for a session — Library, Samples, and the new-critique screen.
// Image on top in a fixed horizontal ratio, text below (same anatomy as the
// landing sample cards, molecules/analysis-card.md).
export function SessionCard({ session, onDelete }: { session: Session; onDelete?: () => void }) {
  const score = sessionScore(session);
  const thumb = sessionThumb(session);
  const v = session.versions[session.versions.length - 1];
  const issues = v ? (v.mode === "flow" ? v.result.findings.length : v.result.fixes.length) : null;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-bg-tertiary/60 transition-colors hover:border-border-strong">
      <Link to="/app/s/$sessionId" params={{ sessionId: session.id }} className="block">
        <div className="aspect-[16/9] overflow-hidden border-b border-border bg-bg-secondary">
          {thumb && (
            <img
              src={thumb}
              alt=""
              className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
            />
          )}
        </div>
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 truncate text-[14px] font-semibold text-foreground">
              {session.title}
            </h3>
            {score !== null && (
              <span
                className={cn(
                  "flex shrink-0 items-center gap-1 font-mono text-[12px] font-semibold",
                  scoreTone(score),
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", scoreFill(score))} />
                {score}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-2 text-[12px] text-text-tertiary">
            <span>{session.mode === "flow" ? "Flow" : "Single screen"}</span>
            {issues !== null && <span>· {issues} issues</span>}
            {session.status !== "done" && STATUS_LABEL[session.status] && (
              <span>· {STATUS_LABEL[session.status]}</span>
            )}
            {!session.readOnly && <span>· {relativeTime(session.updatedAt)}</span>}
          </div>
        </div>
      </Link>
      {onDelete && (
        <button
          onClick={onDelete}
          aria-label={`Delete ${session.title}`}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg border border-border bg-bg-elevated/90 text-muted-foreground opacity-0 transition-opacity hover:text-severity-high focus:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
